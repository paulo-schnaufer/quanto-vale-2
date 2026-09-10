import type { EventBus, CotacaoMoeda } from '../../core/types';
import { store } from '../../core/store';
import { buscarCotacoesViaApi } from './cotacoes-api';
import { construirTodasCotacoesFallback } from './cotacoes-fallback';

/**
 * Feature: cotacoes
 *
 * Feature de serviço — sem tela própria. `iniciarCotacoes` deve ser
 * chamada exatamente uma vez pelo bootstrap da aplicação (main.ts).
 *
 * Fluxo:
 * 1. Lê `configuracoes.paisesDestaque` do estado atual (leitura única,
 *    feita diretamente aqui porque não há `mount`/`ScreenContext` nesta
 *    feature).
 * 2. Tenta buscar as cotações reais via API pública, com um único
 *    timeout de 5s cobrindo TODO o fluxo (resolução do manifesto de
 *    cédulas + chamada de câmbio) — não 5s por chamada isolada.
 * 3. Em qualquer falha (rede, timeout, resposta malformada), usa os
 *    valores fixos de fallback, marcando `origem: 'fallback-local'` em
 *    100% das entradas emitidas (nunca mistura com `'api'`).
 * 4. Aplica o resultado ao estado global e publica `cotacoes:atualizadas`
 *    para quem precisar reagir (ex.: `revelacao-cedulas`, se já montada
 *    antes do fetch terminar).
 *
 * Sem retentativa: se a API falhar, a sessão inteira opera em fallback
 * até a aplicação ser reiniciada — decisão explícita da spec, para nunca
 * travar ou "piscar" o estande durante o uso.
 */

const TIMEOUT_MS = 5000;

export function iniciarCotacoes(bus: EventBus): void {
  void executar(bus);
}

async function executar(bus: EventBus): Promise<void> {
  const { configuracoes } = store.getState();
  const paisesDestaque = configuracoes.paisesDestaque;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let cotacoes: Record<string, CotacaoMoeda>;
  try {
    cotacoes = await buscarCotacoesViaApi(paisesDestaque, controller.signal);
  } catch {
    // Qualquer falha (rede, timeout, resposta malformada) — sem
    // distinção, conforme a spec — cai para o fallback local completo.
    cotacoes = construirTodasCotacoesFallback(paisesDestaque);
  } finally {
    clearTimeout(timeoutId);
  }

  store.setState({ cotacoes });
  bus.emit('cotacoes:atualizadas', { cotacoes });
}
