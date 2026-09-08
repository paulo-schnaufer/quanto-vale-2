// features/setup-duplas/setup-duplas.screen.ts
//
// Tela "setup-duplas" — cadastro das duplas antes do início da partida.
// Montada ao sair de boas-vindas; desmontada ao confirmar o cadastro.
//
// Regras de negócio (ver spec):
// - Mínimo 1 dupla, máximo 4.
// - Nome vazio ao confirmar -> "Dupla N" automático (N = posição de
//   cadastro, 1-indexed no texto, mas `ordem` no estado é 0-indexed).
// - Ao confirmar: gera `id` único por dupla e `pontuacaoTotal: 0` para
//   todas, emite `duplas:definidas` exatamente uma vez.
// - "Começar" fica desabilitado enquanto nenhuma dupla estiver nomeada
//   (todos os campos vazios).
//
// Esta tela não lê estado algum: sempre parte de um formulário em
// branco a cada sessão (garantido por sessao:reiniciada, emitido pela
// tela anterior).

import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';
import type { Dupla } from '../../core/game-state.types';

const MIN_DUPLAS = 1;
const MAX_DUPLAS = 4;

function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback simples para ambientes sem crypto.randomUUID.
  return `dupla-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const setupDuplasScreen: Screen = {
  id: 'setup-duplas',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    root.innerHTML = '';
    root.className = 'sd-setup';

    const titulo = document.createElement('h1');
    titulo.className = 'sd-setup__titulo';
    titulo.textContent = 'Cadastre as duplas';
    root.appendChild(titulo);

    const lista = document.createElement('div');
    lista.className = 'sd-setup__lista';
    lista.setAttribute('role', 'list');
    root.appendChild(lista);

    const linhas: HTMLInputElement[] = [];
    const cleanupFns: Teardown[] = [];

    const botaoAdicionar = document.createElement('button');
    botaoAdicionar.type = 'button';
    botaoAdicionar.className = 'sd-setup__botao-adicionar';
    botaoAdicionar.textContent = '+ Adicionar dupla';

    const botaoComecar = document.createElement('button');
    botaoComecar.type = 'button';
    botaoComecar.className = 'sd-setup__botao-comecar';
    botaoComecar.textContent = 'Começar';
    botaoComecar.disabled = true;

    const erro = document.createElement('p');
    erro.className = 'sd-setup__erro';
    erro.setAttribute('role', 'alert');
    erro.hidden = true;

    function atualizarEstadoBotoes(): void {
      const algumaNomeada = linhas.some((input) => input.value.trim().length > 0);
      botaoComecar.disabled = !algumaNomeada;
      botaoAdicionar.disabled = linhas.length >= MAX_DUPLAS;
    }

    function criarLinha(posicao: number): HTMLInputElement {
      const item = document.createElement('div');
      item.className = 'sd-setup__item';
      item.setAttribute('role', 'listitem');

      const label = document.createElement('label');
      label.className = 'sd-setup__label';
      const inputId = `sd-dupla-${posicao}`;
      label.htmlFor = inputId;
      label.textContent = `Dupla ${posicao}`;

      const input = document.createElement('input');
      input.type = 'text';
      input.id = inputId;
      input.className = 'sd-setup__input';
      input.placeholder = `Nome da dupla ${posicao} (opcional)`;
      input.maxLength = 40;

      const onInput = () => atualizarEstadoBotoes();
      const onKeydown = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          adicionarDupla();
        }
      };

      input.addEventListener('input', onInput);
      input.addEventListener('keydown', onKeydown);
      cleanupFns.push(() => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKeydown);
      });

      item.appendChild(label);
      item.appendChild(input);
      lista.appendChild(item);

      linhas.push(input);
      return input;
    }

    function adicionarDupla(): void {
      if (linhas.length >= MAX_DUPLAS) {
        atualizarEstadoBotoes();
        return;
      }
      const novoInput = criarLinha(linhas.length + 1);
      atualizarEstadoBotoes();
      novoInput.focus();
    }

    function mostrarErro(mensagem: string): void {
      erro.textContent = mensagem;
      erro.hidden = false;
    }

    function limparErro(): void {
      erro.hidden = true;
      erro.textContent = '';
    }

    function confirmarCadastro(): void {
      const nomeadas = linhas.some((input) => input.value.trim().length > 0);
      if (!nomeadas) {
        mostrarErro('Cadastre pelo menos uma dupla antes de começar.');
        return;
      }
      if (linhas.length < MIN_DUPLAS) {
        // Guarda defensiva: nunca deveria ocorrer, já que a tela sempre
        // nasce com pelo menos uma linha, mas mantém o invariante do
        // contrato (mínimo 1 dupla) explícito.
        mostrarErro('É necessário pelo menos uma dupla.');
        return;
      }
      limparErro();

      const duplas: Dupla[] = linhas.map((input, indice) => {
        const nomeDigitado = input.value.trim();
        const nomeExibicao = nomeDigitado.length > 0 ? nomeDigitado : `Dupla ${indice + 1}`;
        return {
          id: gerarId(),
          nomeExibicao,
          pontuacaoTotal: 0,
          ordem: indice,
        };
      });

      // duplas:definidas é emitido exatamente uma vez por confirmação.
      ctx.bus.emit('duplas:definidas', { duplas });
      ctx.navegar('selecao-objeto');
    }

    const onClickAdicionar = () => adicionarDupla();
    const onClickComecar = () => confirmarCadastro();

    botaoAdicionar.addEventListener('click', onClickAdicionar);
    botaoComecar.addEventListener('click', onClickComecar);

    root.appendChild(botaoAdicionar);
    root.appendChild(erro);
    root.appendChild(botaoComecar);

    // Formulário nasce com exatamente 1 dupla em branco, respeitando o
    // mínimo de 1 e evitando que "Começar" fique acessível sem nenhum
    // campo visível.
    criarLinha(1).focus();
    atualizarEstadoBotoes();

    return () => {
      botaoAdicionar.removeEventListener('click', onClickAdicionar);
      botaoComecar.removeEventListener('click', onClickComecar);
      cleanupFns.forEach((fn) => fn());
    };
  },
};
