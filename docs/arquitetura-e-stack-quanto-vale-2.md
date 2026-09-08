## Opções de stack avaliadas

| Critério (em ordem de prioridade) | **Vite + TypeScript vanilla (ESM)** | **Vite + React + Zustand** | **Astro + ilhas + nanostores** |
|---|---|---|---|
| 1. Feature isolada, contexto mínimo | ✅ Cada feature é uma pasta com um `index.ts` que implementa um contrato de tela; nada a ler além disso e do contrato | ⚠️ Bom se a disciplina de componentização for mantida, mas React convida a "subir" estado para um contexto/reducer compartilhado quando duas telas precisam se falar | ⚠️ Ilhas isolam bem o *código*, mas o jogo é essencialmente um fluxo linear e stateful (não um site majoritariamente estático com pontos de interatividade) — força comunicação entre ilhas via store global |
| 2. Contratos explícitos | ✅ Interfaces TS por módulo servem literalmente como o contrato (ex.: `Screen.mount(root, ctx): Teardown`) | ✅ Props tipadas também funcionam como contrato, mas ficam implícitas no componente em vez de num arquivo dedicado | ⚠️ Contrato de props existe, mas o contrato de *estado compartilhado* fica nas stores do nanostores, menos óbvio |
| 3. Minimizar arquivos compartilhados | ✅ Sem "estado global mágico" de framework; comunicação entre features passa por um event bus tipado e um tipo de estado congelado — nada tenta virar hub natural de edição | ⚠️ Uma store Zustand central é exatamente o tipo de arquivo que 8 IAs vão querer editar ao mesmo tempo, a menos que seja particionada por slice desde o dia 1 | ⚠️ Mesmo problema do Zustand, com a complicação extra de sincronizar estado entre páginas/ilhas |
| 4. Build estático simples, offline | ✅ Vite gera `index.html` + bundle JS/CSS, zero servidor, fallback de cotações porta quase 1:1 do `quanto-vale.html` original | ✅ Igualmente trivial via `@vitejs/plugin-react`, mas fetch+fallback precisa virar hook/effect — mais boilerplate e mais chance de 8 agentes implementarem de formas diferentes | ✅ Build estático também é simples, mas o modelo de ilhas (hidratação parcial) é uma otimização de performance que **este projeto não precisa** — é complexidade paga à toa |
| 5. DX de revisão para 1 pessoa só | ✅ Diffs naturalmente escopados por pasta; convenção simples de aprender e cobrar de IAs | ✅✅ React é a convenção mais universalmente conhecida, então há menos variância de estilo entre 8 agentes diferentes | ⚠️ Menos IAs têm padrão consolidado de "ilha Astro para app stateful", risco de cada uma resolver de um jeito |

## Stack escolhida

**Vite + TypeScript vanilla, com módulos ES puros.**

Justificativa: os critérios 1 e 3 pesam mais que os outros neste cenário, e são exatamente onde React e Astro perdem pontos — ambos têm um "hub natural" (contexto/reducer ou store global) para o qual múltiplas features são atraídas a convergir, e isso é a maior fonte de conflito de merge com 8 committers simultâneos. Vanilla TS não tem esse hub por padrão: o event bus e o tipo de estado global são deliberadamente finos, e a comunicação entre features é sempre explícita (publica evento / lê tipo), nunca "importa hook do vizinho".

O custo real é mais código de DOM manual — mas o jogo tem ~7-8 telas simples (texto, imagens, keypad, grid de cédulas), sem necessidade de re-render reativo complexo. Não é uma perda que justifique importar a convenção "familiar" do React em troca de um hotspot de conflito garantido.

A lógica de cotações com fallback offline do `quanto-vale.html` porta quase sem tradução (já é JS puro), o que reduz risco de regressão logo na primeira rodada de agentes.

## Estrutura de pastas proposta

```
quanto-vale-2/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── assets/
│       └── cedulas/              # ver seção dedicada abaixo
├── src/
│   ├── main.ts                   # bootstrap: monta app no DOM, inicia o screen-router
│   ├── core/                     # infraestrutura ESTÁVEL — edição rara, dona: revisor
│   │   ├── game-state.types.ts   # tipo do estado global do jogo (CONTRATO, não implementação)
│   │   ├── event-bus.ts          # pub/sub tipado e minimalista
│   │   ├── screen-contract.ts    # interface Screen { mount(root, ctx): Teardown }
│   │   └── screen-router.ts      # única fonte que conhece a ORDEM das telas
│   ├── shared/                   # visual puro, sem lógica de jogo
│   │   ├── theme.css             # tokens de design (cor, tipografia, espaçamento)
│   │   └── ui/                   # botão, modal, card — componentes burros
│   ├── features/
│   │   ├── setup-duplas/         # criação e nomeação das duplas
│   │   ├── selecao-objeto/       # escolha do item a precificar
│   │   ├── captura-palpite/      # keypad numérico
│   │   ├── cotacoes/             # fetch de câmbio + fallback offline, expõe API própria
│   │   ├── calculo-pontuacao/    # regra de proximidade → pontos
│   │   ├── revelacao-cedulas/    # tela nova: valor convertido + fotos reais das cédulas
│   │   ├── placar-vitrine/       # ranking/histórico da sessão
│   │   └── configuracoes/        # ajustes do organizador do estande
│   └── assets/                   # imagens de UI que NÃO são cédulas
└── ...
```

Cada pasta em `features/` é autocontida: implementa `Screen` (de `core/`), só importa de `core/` e `shared/ui/`, e **nunca** importa de outra pasta em `features/` diretamente — troca de informação entre features passa pelo event bus ou pelo tipo de estado em `core/game-state.types.ts`.

## Pasta de imagens de cédulas

- **Nome final:** `public/assets/cedulas/` (substitui `img-cedulas`). Fica em `public/` porque são ativos estáticos versionados pelo próprio conteúdo (o time troca fotos sem tocar em código), e o Vite copia `public/` para o build sem processá-la — caminho de URL previsível em runtime, sem import/bundling desnecessário.
- **Convenção de arquivo:** `{país-ISO 3166-1 alpha-2}_{moeda-ISO 4217}_{denominação}.jpg`, tudo minúsculo, sem acento, sem espaço. Ex.: `us_usd_100.jpg`, `jp_jpy_1000.jpg`, `gb_gbp_20.jpg`, `br_brl_50.jpg`.
- **Formato/resolução:** JPG, orientação paisagem, ~900–1000px de largura, até ~300KB por arquivo — padronizar aspecto ajuda o layout da tela de revelação a não quebrar por foto.
- **Manifesto separado:** `public/assets/cedulas/cedulas.manifest.json` listando os países/denominações efetivamente usados nos 5 a 8 destaques. A feature `revelacao-cedulas` lê esse manifesto em vez de ter nomes de arquivo hardcoded no TS — assim, trocar quais países aparecem é uma edição de dado, não de código, e não gera diff em `features/`.

## Arquivos/módulos compartilhados

| Arquivo | Por que é compartilhado | Estratégia de minimização |
|---|---|---|
| `core/game-state.types.ts` | Único tipo que descreve o estado do jogo inteiro | Edição **só aditiva** (nunca remover/renomear campo existente sem revisão explícita); cada campo novo comentado com a feature dona; idealmente só o revisor humano ou uma IA com tarefa explícita "adicionar campo X" mexe aqui |
| `core/screen-router.ts` | Sabe a ordem das telas | Modelar como array ordenado de IDs de tela + switch simples — adicionar uma tela é um append de uma linha, não uma reescrita |
| `core/event-bus.ts` | Mecanismo de comunicação entre features | Tratar como infraestrutura congelada após a criação inicial; features publicam/assinam eventos tipados, não editam o bus |
| `shared/theme.css` | Tokens visuais usados por todas as telas | Congelar após uma primeira passada de branding; features só consomem variáveis CSS existentes, nunca criam token novo sem passar por esse arquivo único |
| `cedulas.manifest.json` | Lista de países-destaque | É dado, não código — trocar destaques não deveria gerar diff em `.ts` nenhum |

O princípio geral: se duas features precisam "se falar", a ponte é sempre um evento publicado ou um campo já existente em `game-state.types.ts` — nunca um import direto entre pastas de `features/`. Isso é o que de fato impede que 8 IAs converjam para editar o mesmo arquivo ao mesmo tempo.