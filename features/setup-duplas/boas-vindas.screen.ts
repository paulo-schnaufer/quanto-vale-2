// features/setup-duplas/boas-vindas.screen.ts
//
// Tela "boas-vindas" — modo atração. Montada no boot da aplicação e sempre
// que placar-vitrine reinicia o ciclo (ver core/screen-router.ts).
//
// Responsabilidade única desta tela: capturar a primeira interação do
// público (clique OU qualquer tecla) e, a partir dela, iniciar uma nova
// sessão. A limpeza de estado da sessão anterior é disparada aqui via
// `sessao:reiniciada`, ANTES de navegar para setup-duplas — este é o
// evento que precede `duplas:definidas` na mesma transição (ver spec).

import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';

export const boasVindasScreen: Screen = {
  id: 'boas-vindas',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    root.innerHTML = '';
    root.className = 'sd-boas-vindas';
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute(
      'aria-label',
      'Toque, clique ou pressione qualquer tecla para jogar'
    );

    const chamada = document.createElement('h1');
    chamada.className = 'sd-boas-vindas__chamada';
    chamada.textContent = 'Toque para jogar';
    root.appendChild(chamada);

    const subtitulo = document.createElement('p');
    subtitulo.className = 'sd-boas-vindas__subtitulo';
    subtitulo.textContent = 'Quanto vale isso, mesmo? Descubra com sua dupla!';
    root.appendChild(subtitulo);

    // Garante que qualquer clique/toque nesta tela dispare o avanço,
    // mesmo que o alvo do evento seja um elemento filho.
    let avancado = false;
    const avancar = () => {
      // Trava reentrância: um único toque/tecla deve produzir uma única
      // transição, mesmo que múltiplos eventos cheguem quase juntos
      // (ex.: 'click' e 'keydown' disparados na mesma interação).
      if (avancado) return;
      avancado = true;

      ctx.bus.emit('sessao:reiniciada', {});
      ctx.navegar('setup-duplas');
    };

    const onClick = () => avancar();
    const onKeydown = (_ev: KeyboardEvent) => avancar();

    root.addEventListener('click', onClick);
    // Ouve teclado no document para que "qualquer tecla" funcione mesmo
    // se o foco não estiver especificamente no root.
    document.addEventListener('keydown', onKeydown);

    root.focus();

    return () => {
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeydown);
    };
  },
};
