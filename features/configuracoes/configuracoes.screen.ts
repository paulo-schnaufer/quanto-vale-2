// features/configuracoes/configuracoes.screen.ts
//
// Painel do organizador: ajusta numeroDeRodadas, tempoLimiteSegundosPorPalpite
// e paisesDestaque. Ver "Specs por Módulo — configuracoes" para a spec completa.
//
// Assunção documentada (não coberta pelo contrato de core/ visível a esta
// feature): a spec pede que, ao fechar (Salvar ou Cancelar), o painel
// "retorne à tela de origem" (boas-vindas ou placar-vitrine), mas
// `ScreenContext` não expõe de onde veio a navegação — e esta feature não
// deve recriar arquivos de `core/` para adicionar esse campo. Como
// `configuracoes` só é montada nesses dois contextos (garantido pela
// montagem condicional do núcleo/router, fora do escopo desta feature),
// usa-se uma heurística sobre o próprio `GameState` para decidir o
// retorno: nenhuma dupla cadastrada ainda => sessão não começou =>
// 'boas-vindas'; caso contrário => sessão em andamento/encerrada =>
// 'placar-vitrine'. Se o núcleo vier a expor a tela de origem
// explicitamente (ex.: um campo em ScreenContext), esta heurística deve
// ser substituída por ele.

import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';
import type { ScreenId } from '../../core/screen-router';
import {
  buscarPaisesDisponiveis,
  paisesUnicos,
  type EntradaManifestoCedula,
} from './manifesto-cliente';
import {
  validar,
  formularioValido,
  construirConfiguracoes,
  LIMITES,
  type ErrosValidacao,
} from './validacao';

function telaDeOrigem(ctx: ScreenContext): ScreenId {
  return ctx.state.duplas.length > 0 ? 'placar-vitrine' : 'boas-vindas';
}

export const configuracoesScreen: Screen = {
  id: 'configuracoes',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    // Snapshot local: o formulário trabalha sobre um rascunho próprio e só
    // toca o estado global ao emitir `configuracoes:atualizadas` no Salvar.
    const configuracaoOriginal = ctx.state.configuracoes;
    const destinoAoFechar = telaDeOrigem(ctx);

    let paisesDisponiveis: EntradaManifestoCedula[] = [];
    let carregandoManifesto = true;
    let erroManifesto: string | null = null;
    const paisesSelecionados = new Set(configuracaoOriginal.paisesDestaque);
    let jaTentouSalvar = false;
    let fechado = false;

    root.innerHTML = '';
    root.classList.add('tela-configuracoes');

    const painel = document.createElement('div');
    painel.className = 'painel-configuracoes';
    painel.setAttribute('role', 'dialog');
    painel.setAttribute('aria-modal', 'true');
    painel.setAttribute('aria-label', 'Configurações do jogo');
    root.appendChild(painel);

    function lerCampoNumerico(id: string): number {
      const elemento = painel.querySelector<HTMLInputElement>(`#${id}`);
      return elemento ? Number(elemento.value) : Number.NaN;
    }

    function calcularErros(): ErrosValidacao {
      return validar({
        numeroDeRodadas: lerCampoNumerico('campo-numero-rodadas'),
        tempoLimiteSegundosPorPalpite: lerCampoNumerico('campo-tempo-limite'),
        paisesDestaque: [...paisesSelecionados],
        totalDePaisesNoManifesto: carregandoManifesto || erroManifesto
          ? Number.POSITIVE_INFINITY
          : paisesDisponiveis.length,
      });
    }

    function renderizarListaDePaises(): string {
      if (carregandoManifesto) {
        return '<p class="form-configuracoes__status">Carregando lista de países...</p>';
      }
      if (erroManifesto) {
        return `<p class="form-configuracoes__erro" role="alert">${erroManifesto}</p>`;
      }
      if (paisesDisponiveis.length === 0) {
        return '<p class="form-configuracoes__erro" role="alert">Nenhum país cadastrado no manifesto de cédulas.</p>';
      }
      return `
        <div class="lista-paises">
          ${paisesDisponiveis
            .map(
              (pais) => `
                <label class="lista-paises__item">
                  <input
                    type="checkbox"
                    name="paisesDestaque"
                    value="${pais.paisISO}"
                    ${paisesSelecionados.has(pais.paisISO) ? 'checked' : ''}
                  />
                  <span>${pais.nomePais}</span>
                </label>
              `
            )
            .join('')}
        </div>
      `;
    }

    function renderizar(): void {
      // Preserva o que o organizador já digitou entre re-renderizações
      // (ex.: ao marcar/desmarcar um país), em vez de sempre voltar ao
      // valor original de `configuracoes`.
      const numeroDeRodadasAtual = painel.querySelector<HTMLInputElement>('#campo-numero-rodadas')?.value
        ?? String(configuracaoOriginal.numeroDeRodadas);
      const tempoLimiteAtual = painel.querySelector<HTMLInputElement>('#campo-tempo-limite')?.value
        ?? String(configuracaoOriginal.tempoLimiteSegundosPorPalpite);

      const erros = jaTentouSalvar ? calcularErrosComValores(numeroDeRodadasAtual, tempoLimiteAtual) : {};

      painel.innerHTML = `
        <h1 class="painel-configuracoes__titulo">Configurações</h1>

        <form class="form-configuracoes" novalidate>
          <fieldset class="form-configuracoes__campo">
            <label for="campo-numero-rodadas">Número de rodadas</label>
            <input
              type="number"
              id="campo-numero-rodadas"
              name="numeroDeRodadas"
              min="${LIMITES.numeroDeRodadas.min}"
              max="${LIMITES.numeroDeRodadas.max}"
              step="1"
              value="${numeroDeRodadasAtual}"
            />
            <p class="form-configuracoes__ajuda">Entre ${LIMITES.numeroDeRodadas.min} e ${LIMITES.numeroDeRodadas.max}.</p>
            ${erros.numeroDeRodadas ? `<p class="form-configuracoes__erro" role="alert">${erros.numeroDeRodadas}</p>` : ''}
          </fieldset>

          <fieldset class="form-configuracoes__campo">
            <label for="campo-tempo-limite">Tempo por palpite (segundos)</label>
            <input
              type="number"
              id="campo-tempo-limite"
              name="tempoLimiteSegundosPorPalpite"
              min="${LIMITES.tempoLimiteSegundosPorPalpite.min}"
              max="${LIMITES.tempoLimiteSegundosPorPalpite.max}"
              step="1"
              value="${tempoLimiteAtual}"
            />
            <p class="form-configuracoes__ajuda">Entre ${LIMITES.tempoLimiteSegundosPorPalpite.min} e ${LIMITES.tempoLimiteSegundosPorPalpite.max}.</p>
            ${erros.tempoLimiteSegundosPorPalpite ? `<p class="form-configuracoes__erro" role="alert">${erros.tempoLimiteSegundosPorPalpite}</p>` : ''}
          </fieldset>

          <fieldset class="form-configuracoes__campo">
            <legend>Países em destaque (mínimo ${LIMITES.paisesDestaqueMinimo})</legend>
            ${renderizarListaDePaises()}
            ${erros.paisesDestaque ? `<p class="form-configuracoes__erro" role="alert">${erros.paisesDestaque}</p>` : ''}
          </fieldset>

          <div class="form-configuracoes__acoes">
            <button type="button" class="botao botao--secundario" data-acao="cancelar">Cancelar</button>
            <button type="submit" class="botao botao--primario" data-acao="salvar">Salvar</button>
          </div>
        </form>
      `;

      ligarEventos();
    }

    function calcularErrosComValores(numeroDeRodadasStr: string, tempoLimiteStr: string): ErrosValidacao {
      return validar({
        numeroDeRodadas: Number(numeroDeRodadasStr),
        tempoLimiteSegundosPorPalpite: Number(tempoLimiteStr),
        paisesDestaque: [...paisesSelecionados],
        totalDePaisesNoManifesto: carregandoManifesto || erroManifesto
          ? Number.POSITIVE_INFINITY
          : paisesDisponiveis.length,
      });
    }

    function fechar(destino: ScreenId): void {
      if (fechado) return; // guarda contra clique duplo / Enter + clique
      fechado = true;
      ctx.navegar(destino);
    }

    function ligarEventos(): void {
      const formulario = painel.querySelector('form.form-configuracoes') as HTMLFormElement;

      formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        jaTentouSalvar = true;

        const erros = calcularErros();
        if (!formularioValido(erros)) {
          renderizar();
          return;
        }

        const configuracoesAtualizadas = construirConfiguracoes({
          numeroDeRodadas: lerCampoNumerico('campo-numero-rodadas'),
          tempoLimiteSegundosPorPalpite: lerCampoNumerico('campo-tempo-limite'),
          paisesDestaque: [...paisesSelecionados],
          totalDePaisesNoManifesto: paisesDisponiveis.length,
        });

        // Único ponto de escrita: o evento é emitido apenas aqui, nunca a
        // cada tecla digitada ou a cada checkbox marcado/desmarcado.
        ctx.bus.emit('configuracoes:atualizadas', configuracoesAtualizadas);
        fechar(destinoAoFechar);
      });

      formulario.querySelectorAll<HTMLInputElement>('input[name="paisesDestaque"]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            paisesSelecionados.add(checkbox.value);
          } else {
            paisesSelecionados.delete(checkbox.value);
          }
          if (jaTentouSalvar) {
            renderizar();
          }
        });
      });

      const botaoCancelar = painel.querySelector('[data-acao="cancelar"]') as HTMLButtonElement;
      botaoCancelar.addEventListener('click', () => {
        // Fecha sem emitir evento e sem tocar em `ctx.state` — até aqui só
        // existe o rascunho local do formulário (paisesSelecionados e os
        // valores dos inputs), nunca escrito de volta ao GameState.
        fechar(destinoAoFechar);
      });

      formulario.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
          evento.preventDefault();
          fechar(destinoAoFechar);
        }
      });
    }

    renderizar();

    buscarPaisesDisponiveis()
      .then((manifesto) => {
        paisesDisponiveis = paisesUnicos(manifesto);
        carregandoManifesto = false;
        renderizar();
      })
      .catch(() => {
        carregandoManifesto = false;
        erroManifesto = 'Não foi possível carregar a lista de países. Tente reabrir o painel (F2).';
        renderizar();
      });

    return function teardown(): void {
      root.innerHTML = '';
      root.classList.remove('tela-configuracoes');
    };
  },
};
