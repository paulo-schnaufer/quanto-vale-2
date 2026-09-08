# Specs por Módulo — "Quanto Vale? 2.0"

## Nota preliminar

`quanto-vale.html` não estava anexado a esta conversa. A fórmula de pontuação, a lógica de cronômetro, a estratégia de cotações e todas as demais regras de negócio abaixo são **assunções documentadas nesta especificação**, não extração do código original. Onde uma regra tinha mais de uma leitura possível, uma decisão foi tomada e registrada explicitamente — nenhuma ambiguidade foi deixada em aberto.

---

## Contratos de `core/`

### `game-state.types.ts`

```typescript
// core/game-state.types.ts

/** Uma dupla de jogadores cadastrada para a sessão corrente. */
export interface Dupla {
  id: string;
  nomeExibicao: string;
  pontuacaoTotal: number; // escrito por: calculo-pontuacao (evento pontuacao:calculada)
  ordem: number;          // ordem de turno, 0-indexed — definida em setup-duplas
}

/** Objeto/produto cujo preço real a dupla tenta adivinhar. */
export interface ObjetoJogo {
  id: string;
  nome: string;
  imagemUrl: string;
  precoReaisCentavos: number;
  categoria?: string;
}

export type FaixaPontuacao = 'maxima' | 'media' | 'baixa' | 'zero';

export interface ResultadoRodada {
  erroPercentualAbsoluto: number; // ver fórmula exata em calculo-pontuacao
  faixa: FaixaPontuacao;
  pontosGanhos: number;
}

/** Um turno: uma dupla jogando uma rodada numerada. */
export interface RodadaAtual {
  numero: number; // 1-indexed
  duplaId: string;
  objeto: ObjetoJogo | null;              // escrito por: selecao-objeto
  palpiteReaisCentavos: number | null;    // escrito por: captura-palpite
  tempoRespostaMs: number | null;         // escrito por: captura-palpite
  esgotouTempo: boolean;                  // escrito por: captura-palpite
  resultado: ResultadoRodada | null;      // escrito por: calculo-pontuacao
}

/** Cotação de uma moeda estrangeira em relação ao BRL. Chave do Record
 *  em GameState.cotacoes é o próprio codigoISO4217. */
export interface CotacaoMoeda {
  codigoISO4217: string;
  valorEmReais: number; // quanto vale 1 unidade da moeda estrangeira, em BRL
  atualizadoEm: string; // ISO 8601
  origem: 'api' | 'fallback-local';
}

/** País/cédula em exibição na tela de revelação da rodada. */
export interface CedulaEmRevelacao {
  paisISO: string;       // alpha-2, minúsculo (ex.: "us")
  codigoISO4217: string; // ex.: "USD"
  denominacao: number;   // valor de face da cédula
  imagemPath: string;    // ex.: "/assets/cedulas/us_usd_100.jpg"
}

export interface ConfiguracoesJogo {
  numeroDeRodadas: number;              // default 5 — feature dona: configuracoes
  tempoLimiteSegundosPorPalpite: number; // default 15 — feature dona: configuracoes
  paisesDestaque: string[];             // códigos paisISO do manifesto — feature dona: configuracoes
}

/**
 * Estado global compartilhado. Somente-leitura para as features — ver
 * "Nota de arquitetura" abaixo. Toda escrita acontece via evento, nunca
 * por atribuição direta a este objeto por parte de uma feature.
 */
export interface GameState {
  duplas: Dupla[];
  rodadaAtual: RodadaAtual | null;
  historicoRodadas: RodadaAtual[];
  cotacoes: Record<string, CotacaoMoeda>; // chave: codigoISO4217
  cedulaEmRevelacao: CedulaEmRevelacao | null;
  configuracoes: ConfiguracoesJogo;
}

/** Estado inicial usado por main.ts no boot da aplicação. */
export const ESTADO_INICIAL: GameState = {
  duplas: [],
  rodadaAtual: null,
  historicoRodadas: [],
  cotacoes: {},
  cedulaEmRevelacao: null,
  configuracoes: {
    numeroDeRodadas: 5,
    tempoLimiteSegundosPorPalpite: 15,
    paisesDestaque: ['us', 'jp', 'gb', 'ar', 'mx'], // ajustar conforme manifesto real
  },
};
```

**Regra de edição:** apenas aditiva. Todo campo novo precisa de comentário indicando a feature dona (quem escreve) e, se relevante, quem lê.

### `screen-contract.ts`

```typescript
// core/screen-contract.ts
import type { GameState } from './game-state.types';
import type { EventBus } from './event-bus';
import type { ScreenId } from './screen-router';

export type Teardown = () => void;

export interface ScreenContext {
  /** Snapshot somente-leitura do estado no momento do mount. Readonly<>
   *  do TypeScript é raso — por convenção, nenhuma feature muta arrays
   *  ou objetos aninhados aqui, mesmo onde o compilador permitiria. */
  readonly state: Readonly<GameState>;
  /** Único canal de comunicação entre features. */
  readonly bus: EventBus;
  /** Solicita navegação para outra tela. O ciclo de teardown da tela
   *  atual + mount da nova é responsabilidade do núcleo do app, não de
   *  quem chama esta função. */
  navegar(destino: ScreenId): void;
}

export interface Screen {
  readonly id: ScreenId;
  /** Chamada uma vez ao entrar na tela. Deve retornar uma função de
   *  limpeza (remove listeners do bus, cancela timers). Para refletir
   *  mudanças de estado enquanto a tela permanece montada, a própria
   *  tela assina eventos via ctx.bus — não há re-render automático. */
  mount(root: HTMLElement, ctx: ScreenContext): Teardown;
}
```

### `event-bus.ts` (+ union de eventos)

```typescript
// core/event-bus.ts
import type {
  Dupla,
  ObjetoJogo,
  RodadaAtual,
  ResultadoRodada,
  CotacaoMoeda,
  CedulaEmRevelacao,
  ConfiguracoesJogo,
} from './game-state.types';

/**
 * Mapa exaustivo evento → payload. Fonte única de verdade: nenhuma
 * feature declara ou infere eventos fora daqui. Congelado após a
 * criação inicial — adicionar um evento exige alinhamento entre todos
 * os agentes ativos, não é decisão unilateral de uma feature.
 */
export interface GameEventMap {
  'sessao:reiniciada': Record<string, never>;
  'duplas:definidas': { duplas: Dupla[] };
  'rodada:iniciada': { numero: number; duplaId: string };
  'objeto:selecionado': { objeto: ObjetoJogo };
  'palpite:enviado': {
    palpiteReaisCentavos: number | null;
    tempoRespostaMs: number;
    esgotouTempo: boolean;
  };
  'pontuacao:calculada': {
    duplaId: string;
    resultado: ResultadoRodada;
    rodadaConcluida: RodadaAtual;
  };
  'cotacoes:atualizadas': { cotacoes: Record<string, CotacaoMoeda> };
  'cedula:revelada': CedulaEmRevelacao;
  'configuracoes:atualizadas': ConfiguracoesJogo;
}

export type NomeEvento = keyof GameEventMap;
export type Unsubscribe = () => void;

export interface EventBus {
  emit<K extends NomeEvento>(evento: K, payload: GameEventMap[K]): void;
  on<K extends NomeEvento>(
    evento: K,
    handler: (payload: GameEventMap[K]) => void
  ): Unsubscribe;
  off<K extends NomeEvento>(
    evento: K,
    handler: (payload: GameEventMap[K]) => void
  ): void;
}
```

### `screen-router.ts`

```typescript
// core/screen-router.ts
import type { GameState, Dupla } from './game-state.types';

export type ScreenId =
  | 'boas-vindas'
  | 'setup-duplas'
  | 'selecao-objeto'
  | 'captura-palpite'
  | 'calculo-pontuacao'
  | 'revelacao-cedulas'
  | 'placar-vitrine'
  | 'configuracoes';

/**
 * Sequência do fluxo principal. O bloco selecao-objeto → captura-palpite
 * → calculo-pontuacao → revelacao-cedulas se repete por dupla × rodada;
 * a decisão de repetir ou encerrar é tomada pela própria feature
 * revelacao-cedulas ao final de cada turno, usando as funções abaixo
 * (ver sua spec). Este array não duplica essas repetições.
 */
export const FLUXO_PRINCIPAL: readonly ScreenId[] = [
  'boas-vindas',
  'setup-duplas',
  'selecao-objeto',
  'captura-palpite',
  'calculo-pontuacao',
  'revelacao-cedulas',
  'placar-vitrine',
];

/**
 * 'configuracoes' fica fora do fluxo principal: só é acessível por
 * atalho de teclado a partir de 'boas-vindas' ou 'placar-vitrine' (nunca
 * durante uma rodada ativa) e sempre retorna à tela de origem ao fechar.
 */

/**
 * Fonte única da regra de progressão de turno/rodada. Qualquer feature
 * que precise saber "quem joga agora" ou "a sessão terminou?" importa
 * estas funções — nunca reimplementa a lógica localmente.
 */
export function proximaDuplaDaRodada(state: GameState): Dupla | null {
  const numeroRodada = state.rodadaAtual?.numero ?? 1;
  const jogaram = new Set(
    state.historicoRodadas
      .filter((r) => r.numero === numeroRodada)
      .map((r) => r.duplaId)
  );
  const ordem = [...state.duplas].sort((a, b) => a.ordem - b.ordem);
  return ordem.find((d) => !jogaram.has(d.id)) ?? null;
}

export function sessaoTerminou(state: GameState): boolean {
  const numeroRodada = state.rodadaAtual?.numero ?? 1;
  return (
    proximaDuplaDaRodada(state) === null &&
    numeroRodada >= state.configuracoes.numeroDeRodadas
  );
}
```

**Regra de edição:** adicionar tela = append em `FLUXO_PRINCIPAL`. `proximaDuplaDaRodada` e `sessaoTerminou` são a única fonte da regra de turno — não duplicar em nenhuma feature.

---

## Nota de arquitetura (leitura/escrita de estado)

`ScreenContext.state` é **somente leitura**. Nenhuma feature atribui valores a `GameState` diretamente. Toda escrita listada como "Estado — escreve" nas specs abaixo acontece assim:

1. A feature emite o evento correspondente (ver tabela mestra) com o payload que descreve a mudança.
2. Um mecanismo central no núcleo do app — fora do escopo de qualquer feature-agent, parte de `main.ts` — assina todos os eventos e aplica a mutação a `GameState`.
3. **Requisito de implementação do núcleo:** essa aplicação deve ser síncrona dentro de `emit()`. Isso garante que, quando uma feature chama `ctx.navegar(...)` logo após um `emit(...)`, a próxima tela já monta com o estado atualizado — nenhuma feature precisa aguardar ou verificar.

Consequência prática: a maioria das features **não precisa assinar eventos** para funcionar — basta ler `ctx.state` uma vez no `mount()`, porque quando ela monta, o evento da tela anterior já foi aplicado. Assinar eventos (`ctx.bus.on(...)`) só é necessário quando algo pode mudar **enquanto a própria tela já está montada** (caso concreto: `revelacao-cedulas` assinando `cotacoes:atualizadas`, ver sua spec).

---

## Tabela mestra de eventos

| Evento | Publica | Assina | Payload | Propósito |
|---|---|---|---|---|
| `sessao:reiniciada` | setup-duplas | núcleo | `{}` | Limpar estado de uma sessão anterior antes de um novo cadastro de duplas. |
| `duplas:definidas` | setup-duplas | núcleo | `{ duplas: Dupla[] }` | Registrar as duplas participantes, com `pontuacaoTotal: 0`. |
| `rodada:iniciada` | selecao-objeto | núcleo | `{ numero: number; duplaId: string }` | Abrir um novo turno (rodada + dupla) em `rodadaAtual`. |
| `objeto:selecionado` | selecao-objeto | núcleo | `{ objeto: ObjetoJogo }` | Registrar o objeto sorteado para o turno corrente. |
| `palpite:enviado` | captura-palpite | núcleo | `{ palpiteReaisCentavos: number \| null; tempoRespostaMs: number; esgotouTempo: boolean }` | Registrar o palpite da dupla (ou marcar tempo esgotado) e encerrar a captura. |
| `pontuacao:calculada` | calculo-pontuacao | núcleo | `{ duplaId: string; resultado: ResultadoRodada; rodadaConcluida: RodadaAtual }` | Aplicar o resultado, somar pontos à dupla e arquivar o turno em `historicoRodadas`. |
| `cotacoes:atualizadas` | cotacoes | núcleo, revelacao-cedulas | `{ cotacoes: Record<string, CotacaoMoeda> }` | Publicar taxas de câmbio (novas ou atualizadas), de API ou fallback local. |
| `cedula:revelada` | revelacao-cedulas | núcleo | `CedulaEmRevelacao` | Registrar país/moeda/denominação em exibição no turno corrente. |
| `configuracoes:atualizadas` | configuracoes | núcleo | `ConfiguracoesJogo` | Aplicar as novas configurações do organizador. |

"Núcleo" = mecanismo central de aplicação de estado em `main.ts`, não uma feature. Nenhum outro par publica/assina equivalente a estes deve ser criado por uma feature-agent — se algo parecer faltar, é ambiguidade a resolver contra esta tabela, não um novo evento.

---

## Specs das features

### setup-duplas

**Responsabilidade:** tela de boas-vindas (modo atração) e cadastro das duplas antes do início da partida. **Decisão:** esta feature possui as duas telas `boas-vindas` e `setup-duplas` (não há feature separada para boas-vindas na lista de 8).

**Screen implementado:** `boas-vindas` (montada no boot e sempre que `placar-vitrine` reinicia o ciclo); `setup-duplas` (montada ao sair de boas-vindas, desmontada ao confirmar o cadastro).

**Estado — lê:** nenhum (ambas as telas partem de um formulário em branco a cada sessão).

**Estado — escreve:** `duplas` (via `duplas:definidas`); reset de sessão (via `sessao:reiniciada`).

**Eventos — publica:** `sessao:reiniciada` (ao sair de boas-vindas, antes de montar setup-duplas), `duplas:definidas` (ao confirmar o cadastro).

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** boas-vindas com chamada gigante ("Toque para jogar"), animada ou não, operável por clique ou qualquer tecla; setup-duplas com campo de texto grande por dupla, botão "+ Adicionar dupla", fonte alta e alto contraste, botão "Começar" desabilitado até 1 dupla nomeada; navegação completa por teclado (Tab entre campos, Enter adiciona dupla).

**Regras de negócio e edge cases:**
- Mínimo 1 dupla, máximo 4 (acima disso o ritmo do estande degrada — decisão adotada aqui).
- Nome vazio ao confirmar → usa "Dupla N" automático (N = posição de cadastro).
- `ordem` = ordem de cadastro, 0-indexed.
- Ao confirmar: gera `id` único por dupla e `pontuacaoTotal: 0` para todas.
- `sessao:reiniciada` é sempre emitido antes de `duplas:definidas`, mesmo na primeiríssima sessão do dia.

**Critérios de aceite:**
- Com 0 duplas nomeadas, "Começar" permanece desabilitado.
- Ao confirmar com N duplas, `duplas:definidas` é emitido exatamente uma vez, com N entradas e `pontuacaoTotal: 0` em todas.
- `sessao:reiniciada` sempre precede `duplas:definidas` na mesma transição.

---

### selecao-objeto

**Responsabilidade:** sorteia o objeto do turno corrente (sem repetição dentro da sessão, enquanto o catálogo permitir) e o revela para a dupla antes do cronômetro de palpite. **Decisão:** a seleção é feita pelo sistema, não pela dupla — a tela existe para anunciar o objeto sorteado, não para oferecer escolha.

**Screen implementado:** `selecao-objeto`, montada após `setup-duplas` (1º turno) ou após `revelacao-cedulas` (turnos seguintes); desmontada ao avançar para `captura-palpite`.

**Estado — lê:** `duplas`, `historicoRodadas`, `configuracoes.numeroDeRodadas`, `rodadaAtual` (se existir, para saber o número da rodada corrente).

**Estado — escreve:** `rodadaAtual` (via `rodada:iniciada`, seguido de `objeto:selecionado`).

**Eventos — publica:** `rodada:iniciada` (ao montar, antes do sorteio), `objeto:selecionado` (logo após).

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** imagem grande do objeto centralizada, nome em fonte grande, **sem exibir o preço**; avança automaticamente após ~3s ou por clique/Enter (evita depender de leitura).

**Regras de negócio e edge cases:**
- Usa `proximaDuplaDaRodada` e `sessaoTerminou` de `core/screen-router.ts` para montar o novo `rodadaAtual` (número + duplaId) — nunca reimplementar essa lógica localmente.
- Catálogo de objetos é local à feature (JSON próprio dentro de `features/selecao-objeto/`), fora de `GameState`, já que nenhuma outra feature precisa da lista completa.
- Sorteio exclui `objeto.id` já presentes em `historicoRodadas` nesta sessão. Se o catálogo se esgotar antes do fim da sessão, permite repetição priorizando os objetos menos usados.
- Catálogo mínimo recomendado: 15 objetos (cobre 3 duplas × 5 rodadas sem repetição).
- Imagens de objetos são de responsabilidade desta feature (fora do escopo de cédulas coberto adiante); usar placeholders coloridos com o nome do objeto até que fotos reais existam.

**Critérios de aceite:**
- Nenhum objeto se repete na mesma sessão enquanto houver objeto não usado no catálogo.
- `rodada:iniciada` sempre precede `objeto:selecionado`.
- Avança para `captura-palpite` automaticamente, sem exigir clique.

---

### captura-palpite

**Responsabilidade:** captura o palpite numérico da dupla dentro do tempo limite, com feedback visual de contagem regressiva.

**Screen implementado:** `captura-palpite`, montada após `selecao-objeto`; desmontada ao enviar o palpite ou ao esgotar o tempo.

**Estado — lê:** `rodadaAtual.objeto` (nome/imagem — nunca o preço), `configuracoes.tempoLimiteSegundosPorPalpite`.

**Estado — escreve:** `rodadaAtual.palpiteReaisCentavos`, `.tempoRespostaMs`, `.esgotouTempo` (via `palpite:enviado`).

**Eventos — publica:** `palpite:enviado`.

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** campo numérico grande (compatível com entrada por teclado numérico), anel ou barra de contagem regressiva bem visível, mudança de cor nos últimos segundos (verde → amarelo → vermelho), Enter confirma; totalmente operável sem mouse.

**Regras de negócio e edge cases:**
- Entrada vazia, não numérica ou negativa não é aceita como envio: cronômetro continua, erro inline é mostrado.
- Ao chegar a 0s sem envio válido: dispara automaticamente `palpite:enviado` com `palpiteReaisCentavos: null`, `esgotouTempo: true`, `tempoRespostaMs` = tempo limite em ms.
- `tempoRespostaMs` é medido do `mount()` até o envio (manual ou por timeout).

**Critérios de aceite:**
- Exatamente um `palpite:enviado` por turno, nunca dois.
- Em timeout, `esgotouTempo` é sempre `true` e `palpiteReaisCentavos` é sempre `null`.
- Em envio manual dentro do prazo, `esgotouTempo` é sempre `false`.

---

### cotacoes

**Responsabilidade:** obtém e mantém em cache as taxas de câmbio (BRL por unidade de moeda estrangeira) usadas na revelação de cédulas, com fallback para uso offline.

**Screen implementado:** nenhuma — feature de serviço, sem tela própria. Exporta uma função `iniciarCotacoes(bus: EventBus): void`, chamada uma única vez pelo bootstrap da aplicação (fora do escopo de qualquer feature-agent).

**Estado — lê:** `configuracoes.paisesDestaque`, apenas no momento da inicialização (não via `ScreenContext`, já que não há `mount`).

**Estado — escreve:** `cotacoes` (via `cotacoes:atualizadas`).

**Eventos — publica:** `cotacoes:atualizadas` (ao concluir o primeiro fetch ou fallback).

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** não se aplica (sem tela).

**Regras de negócio e edge cases:**
- Na inicialização, busca as taxas via API pública de câmbio para as moedas referenciadas pelos países em `configuracoes.paisesDestaque` (mapeadas a partir do manifesto de cédulas). A escolha da API específica fica a critério do agente responsável, desde que retorne BRL por unidade de moeda.
- Timeout de rede: 5s. Qualquer falha (rede, timeout, resposta malformada) cai para os valores fixos de fallback abaixo, marcando `origem: 'fallback-local'`.
- Valores de fallback — **assunção, não são taxas reais precisas; atualizar periodicamente**:

| Moeda | BRL por unidade (fallback) |
|---|---|
| USD | 5,40 |
| EUR | 5,90 |
| GBP | 6,80 |
| JPY | 0,036 |
| ARS | 0,0055 |
| MXN | 0,32 |

- Sem retentativa automática dentro da sessão (evita travar o app); se a API falhar, o app opera inteiramente em fallback até reiniciar.

**Critérios de aceite:**
- `cotacoes:atualizadas` é emitido em até ~5s após o boot, com sucesso ou fallback.
- Toda `CotacaoMoeda` emitida tem `origem` correta (`'api'` só quando a resposta veio de fato da API).
- Ausência total de rede não trava a inicialização do app.

---

### calculo-pontuacao

**Responsabilidade:** calcula o resultado do turno (erro percentual, faixa, pontos) e atualiza a pontuação da dupla.

**Screen implementado:** `calculo-pontuacao`, montada após `captura-palpite`; desmontada ao avançar para `revelacao-cedulas`.

**Estado — lê:** `rodadaAtual` (`objeto.precoReaisCentavos`, `palpiteReaisCentavos`, `esgotouTempo`), `duplas` (para exibir o nome da dupla).

**Estado — escreve:** `rodadaAtual.resultado`, `duplas[].pontuacaoTotal`, `historicoRodadas` (via `pontuacao:calculada`).

**Eventos — publica:** `pontuacao:calculada`.

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** feedback grande e imediato ("Mandou bem!" / "Quase lá" / "Não foi dessa vez"), preço real e palpite lado a lado, cor associada à faixa (verde/amarelo/laranja/vermelho); avança automaticamente após ~4s ou por clique.

**Regras de negócio (fórmula — assunção, HTML antigo não anexado):**
- `erroPercentualAbsoluto = |palpiteReaisCentavos - precoReaisCentavos| / precoReaisCentavos`.
- Guarda defensiva: se `precoReaisCentavos === 0`, `erroPercentualAbsoluto = 0` quando o palpite também for `0`, senão `1`.
- Se `esgotouTempo === true` → faixa `'zero'`, `pontosGanhos: 0`, independente de qualquer outro cálculo.
- Caso contrário, por faixa:
  - erro ≤ 0,05 (5%) → `'maxima'` → **1000 pontos**
  - 0,05 < erro ≤ 0,15 (15%) → `'media'` → **600 pontos**
  - 0,15 < erro ≤ 0,30 (30%) → `'baixa'` → **250 pontos**
  - erro > 0,30 → `'zero'` → **0 pontos**
- `pontosGanhos` soma-se a `duplas[duplaId].pontuacaoTotal` (nunca substitui).

**Critérios de aceite:**
- Erro de exatamente 5% cai em `'maxima'` (limites inclusivos conforme fórmula acima).
- `esgotouTempo` sempre resulta em `pontosGanhos: 0`.
- `historicoRodadas` ganha exatamente uma entrada por turno, nunca duplicada.

---

### revelacao-cedulas

**Responsabilidade:** converte o preço do objeto para a moeda de um país-destaque e revela a cédula correspondente ao turno.

**Screen implementado:** `revelacao-cedulas`, montada após `calculo-pontuacao`; desmontada ao decidir a próxima tela.

**Estado — lê:** `rodadaAtual` (`objeto.precoReaisCentavos`, `numero`), `cotacoes`, `configuracoes.paisesDestaque`, `duplas`, `historicoRodadas` (para decidir a próxima tela).

**Estado — escreve:** `cedulaEmRevelacao` (via `cedula:revelada`).

**Eventos — publica:** `cedula:revelada`.

**Eventos — assina:** `cotacoes:atualizadas` (para completar a exibição caso a tela monte antes do fetch inicial terminar).

**Requisitos de UI/UX:** imagem grande da cédula (paisagem, ocupando boa parte da tela), texto grande "≈ N notas de [denominação] [moeda]", nome do país por extenso, alto contraste; avança automaticamente após ~6s ou por clique/Enter.

**Regras de negócio e edge cases:**
- País do turno = `configuracoes.paisesDestaque[(rodadaAtual.numero - 1) % configuracoes.paisesDestaque.length]` — round-robin determinístico, sem sorteio.
- Cédula usada = primeira entrada do manifesto cujo `paisISO` bate com o país do turno (se houver mais de uma denominação cadastrada para o país, a ordem de declaração no JSON decide).
- `valorConvertido = (precoReaisCentavos / 100) / cotacoes[codigoISO4217].valorEmReais`.
- `quantidadeDeNotas = Math.max(1, Math.round(valorConvertido / denominacao))`.
- Se `cotacoes[codigoISO4217]` ainda não existir no `mount()` (fetch em andamento): mostra a cédula com o texto numérico em estado de carregamento ("calculando...") e assina `cotacoes:atualizadas` para completar assim que disponível. A navegação automática nunca espera pela cotação: se os ~6s esgotarem antes dela chegar, avança mesmo assim, mostrando só a cédula.
- **Decisão de próxima tela** (regra única, definida em `core/screen-router.ts`): se `sessaoTerminou(state)` → `ctx.navegar('placar-vitrine')`; caso contrário → `ctx.navegar('selecao-objeto')`.

**Critérios de aceite:**
- O país exibido segue estritamente o round-robin determinístico (rodada 1 = `paisesDestaque[0]`, rodada 2 = `paisesDestaque[1]`, reiniciando do começo se houver mais rodadas que países).
- `cedula:revelada` é emitido exatamente uma vez por turno.
- A navegação após esta tela nunca fica presa — sempre resulta em `selecao-objeto` ou `placar-vitrine`, com ou sem cotação disponível.

**TODO de asset:** as imagens reais das cédulas ainda não existem. Usar placeholder cinza-claro (~960×540px) com o código do país em destaque no centro (ex.: "US") até que as fotos definitivas sejam adicionadas em `public/assets/cedulas/`, seguindo a convenção `{país}_{moeda}_{denominação}.jpg` e o schema do manifesto abaixo. Fonte sugerida para curadoria manual futura, fora do escopo deste agente: colnect.com/br.

---

### placar-vitrine

**Responsabilidade:** exibe o ranking final das duplas ao fim da sessão e conduz o reinício do ciclo para o próximo grupo.

**Screen implementado:** `placar-vitrine`, montada após a última `revelacao-cedulas` da sessão; desmontada ao reiniciar (retorno a `boas-vindas`).

**Estado — lê:** `duplas` (`pontuacaoTotal`), `historicoRodadas` (opcional, para estatísticas extras).

**Estado — escreve:** nenhum campo diretamente. A limpeza de estado para a próxima sessão é responsabilidade de `setup-duplas`, via `sessao:reiniciada`.

**Eventos — publica:** nenhum.

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** ranking grande, ordenado por `pontuacaoTotal` decrescente, 1º lugar destacado (maior, cor de destaque); empates mostrados na mesma posição com etiqueta "empate"; botão "Nova partida" visível, com retorno automático a `boas-vindas` após ~30s de inatividade.

**Regras de negócio e edge cases:**
- Ranking = `[...duplas].sort` descendente por `pontuacaoTotal`; em empate, mantém `ordem` como desempate estável (sem partida de desempate).
- O retorno a `boas-vindas` não emite eventos por si só — a limpeza de estado ocorre quando `boas-vindas`/`setup-duplas` emitir `sessao:reiniciada`, já especificado naquela feature.

**Critérios de aceite:**
- Duplas com pontuação igual aparecem na mesma posição de ranking com o rótulo de empate.
- Após 30s sem interação, navega automaticamente para `boas-vindas`.
- A tela nunca escreve em `GameState` diretamente nem emite eventos.

---

### configuracoes

**Responsabilidade:** painel do organizador para ajustar número de rodadas, tempo de palpite e países-destaque.

**Screen implementado:** `configuracoes`, acessível por atalho de teclado (ex.: F2) **somente** enquanto `boas-vindas` ou `placar-vitrine` estiverem montadas — nunca durante uma rodada ativa. Ao fechar, retorna à tela de origem.

**Estado — lê:** `configuracoes` (para popular o formulário); lista de países disponíveis via fetch próprio de `cedulas.manifest.json` (fora de `GameState`).

**Estado — escreve:** `configuracoes` (via `configuracoes:atualizadas`).

**Eventos — publica:** `configuracoes:atualizadas` (apenas ao clicar "Salvar").

**Eventos — assina:** nenhum.

**Requisitos de UI/UX:** formulário simples (inputs numéricos + checkboxes de países) voltado ao organizador adulto — fonte pode ser um pouco menor que as demais telas, mas ainda operável por teclado; botões "Salvar" e "Cancelar" claros.

**Regras de negócio e edge cases:**
- `numeroDeRodadas`: inteiro entre 1 e 15.
- `tempoLimiteSegundosPorPalpite`: inteiro entre 5 e 60.
- `paisesDestaque`: mínimo 3, máximo = total de países no manifesto.
- A restrição de acesso (só fora de rodada ativa) é responsabilidade da montagem condicional no núcleo/router — esta feature assume que só será montada nesses contextos, sem reforçá-la sozinha.

**Critérios de aceite:**
- Salvar com valor fora dos limites é bloqueado com validação inline.
- `configuracoes:atualizadas` só é emitido ao clicar "Salvar", nunca a cada tecla digitada.
- "Cancelar" fecha sem emitir evento e sem alterar o estado.

---

## Schema — `cedulas.manifest.json`

Localização: `public/assets/cedulas/cedulas.manifest.json`. Array no nível raiz.

| Campo | Tipo | Descrição |
|---|---|---|
| `paisISO` | `string` | Código alpha-2 (ISO 3166-1), minúsculo. Ex.: `"us"`. |
| `nomePais` | `string` | Nome do país em português, para exibição. |
| `codigoISO4217` | `string` | Código da moeda (ISO 4217), maiúsculo. Ex.: `"USD"`. |
| `denominacao` | `number` | Valor de face da cédula fotografada. |
| `arquivo` | `string` | Nome do arquivo em `public/assets/cedulas/`, seguindo `{país}_{moeda}_{denominação}.jpg`. |

Exemplo:

```json
[
  {
    "paisISO": "us",
    "nomePais": "Estados Unidos",
    "codigoISO4217": "USD",
    "denominacao": 100,
    "arquivo": "us_usd_100.jpg"
  },
  {
    "paisISO": "jp",
    "nomePais": "Japão",
    "codigoISO4217": "JPY",
    "denominacao": 10000,
    "arquivo": "jp_jpy_10000.jpg"
  },
  {
    "paisISO": "gb",
    "nomePais": "Reino Unido",
    "codigoISO4217": "GBP",
    "denominacao": 50,
    "arquivo": "gb_gbp_50.jpg"
  }
]
```

`configuracoes.paisesDestaque` deve conter apenas códigos `paisISO` presentes neste manifesto. Novas entradas (ex.: `ar`, `mx`, para completar o default de `ESTADO_INICIAL`) seguem o mesmo schema.
