# Protocolo de Coordenação Multi-IA — "Quanto Vale? 2.0"

## Papéis

### Integrador (humano)
- Escreve e commita, **antes de qualquer agente-feature começar**: `package.json`, `vite.config.ts`, `tsconfig.json`, os 4 arquivos de `core/`, `shared/theme.css` v1 e `main.ts`.
- Define a fila de trabalho das 8 features e a ordem de merge (ver seção seguinte).
- Revisa cada PR com o checklist objetivo (seção "Checklist de revisão").
- É o único que serializa edição em arquivo compartilhado quando dois agentes precisam tocar o mesmo arquivo aditivo/congelado.
- Recebe escalonamentos de ambiguidade de spec, decide, e registra a decisão no adendo versionado.
- Decide, e só ele decide, quando ativar um plano de contingência (stub) para uma feature atrasada.
- **Nunca** delega a um agente-feature a resolução de conflito de merge Git em arquivo compartilhado — isso é sempre trabalho do integrador.
- Em operação normal, não escreve código de feature — só assume código diretamente se decidir ativar um stub de contingência.

### Agente-Feature (IA)
- Recebe um kickoff parametrizado para **exatamente uma feature**.
- Só tem permissão de leitura sobre: (a) o documento de specs do Prompt 3, (b) os 4 arquivos de `core/` já prontos, (c) opcionalmente o HTML antigo do projeto.
- **Nunca** importa de outra feature, sob nenhuma circunstância.
- **Nunca** toca `main.ts`, `core/event-bus.ts` ou `shared/theme.css` — congelados para agentes-feature em qualquer cenário normal.
- Pode editar `core/game-state.types.ts` e `core/screen-router.ts` **apenas** de forma aditiva (novo campo comentado com o nome da feature dona / novo item no array, respectivamente), e deve declarar isso explicitamente no PR.
- Constrói e usa seu próprio harness isolado (seção "Harness") — nunca depende de `main.ts` nem da existência das outras 7 features para testar seu próprio trabalho.
- Se encontrar um caso não coberto pela spec, **não decide sozinho** — escalona (seção "Protocolo de ambiguidade").
- Entrega via branch + PR seguindo a convenção da seção "Convenção de branch/commit/PR", com autoavaliação explícita contra os critérios de aceite da spec da sua própria feature.

Limite estrutural: se, para fazer seu trabalho, um agente-feature sentir necessidade de perguntar "como estão as outras features", isso é sinal de falha de isolamento na arquitetura (contratos incompletos em `game-state.types.ts`/`event-bus.ts`) — o ajuste é no protocolo/contrato, nunca em dar mais contexto ad hoc ao agente.

---

## Ordem de execução recomendada

*(Seção autocontida — pode ser colada isoladamente em outra conversa.)*

**Contexto mínimo:** projeto "Quanto Vale? 2.0", stack Vite + TS vanilla, 8 features desacopladas (`setup-duplas`, `selecao-objeto`, `captura-palpite`, `cotacoes`, `calculo-pontuacao`, `revelacao-cedulas`, `placar-vitrine`, `configuracoes`), comunicação só via `core/event-bus.ts` e `core/game-state.types.ts`, contratos já fixados. Riscos declarados: `cotacoes` e `revelacao-cedulas` = Alto; `selecao-objeto`, `captura-palpite`, `calculo-pontuacao` = Médio; `configuracoes` = Baixo-médio; `setup-duplas` e `placar-vitrine` = Baixo.

**Distinção importante:** todas as 8 features podem **começar a ser codificadas imediatamente e em paralelo** — nenhuma depende de código de outra, só dos contratos já fixados em `core/`. A ordem abaixo é a **fila de prioridade de revisão/merge** do integrador (relevante quando há menos de 8 agentes disponíveis ao mesmo tempo, e para maximizar o quanto do fluxo fica navegável manualmente a cada merge).

1. **`cotacoes`** — maior risco técnico do projeto (API externa + fallback), zero dependência de outra feature; começar primeiro dá o máximo de tempo de reação a problema de rede/integração antes do evento.
2. **`calculo-pontuacao`** — fórmula crítica da qual todo o placar depende; validar cedo evita que um erro de fórmula só apareça tarde, perto do prazo.
3. **`setup-duplas`** — risco baixíssimo e é a primeira tela do fluxo; mesclada, já permite ao integrador clicar manualmente do início da sessão até a criação das duplas.
4. **`selecao-objeto`** — sem dependência de código, complexidade média (catálogo + sorteio sem repetição); mesclada junto com `setup-duplas`, já dá um trecho navegável do início do fluxo até a escolha do objeto.
5. **`configuracoes`** — sem dependência, risco baixo-médio; mesclada cedo, permite ao integrador ajustar `numeroDeRodadas`/`tempoLimiteSegundosPorPalpite`/`paisesDestaque` de verdade ao testar as demais features, em vez de depender de valores fixos no mock do harness.
6. **`captura-palpite`** — timer + validação, risco médio, tecnicamente pode começar a qualquer momento, mas seu teste manual de ponta a ponta fica mais fácil depois de `selecao-objeto` já mesclada (há um objeto real para dar palpite).
7. **`revelacao-cedulas`** — maior risco de todos em termos de testabilidade manual completa (consome `cotacoes` e `resultado` de `calculo-pontuacao`); recomendação é priorizar a revisão/merge depois que `cotacoes` e `calculo-pontuacao` já estiverem na main, para que o teste manual de ponta a ponta use dados reais, não mockados.
8. **`placar-vitrine`** — risco baixo; faz mais sentido revisar por último porque só fica visualmente interessante de testar manualmente quando já há `historicoRodadas` real acumulado de várias rodadas via `calculo-pontuacao`.

Se houver 8 agentes disponíveis simultaneamente: todos começam a codificar no dia 1, seguindo a ordem acima apenas como fila de revisão do integrador. Se houver menos agentes disponíveis, use a lista acima como ordem de alocação: comece pelas de risco mais alto (1–2), depois pelas que destravam mais smoke-test navegável por menor esforço (3–5), deixando `revelacao-cedulas` e `placar-vitrine` (6–8, junto com `captura-palpite`) para quando houver capacidade sobrando ou quando as dependências de teste manual (não de import) já estiverem mescladas.

---

## Harness de desenvolvimento isolado

**Local e nome:** dentro da própria pasta da feature, nunca compartilhado:
```
src/features/<nome-da-feature>/_harness/
├── index.html
└── harness.ts
```

**O que `harness.ts` deve montar:**
- **`GameState` parcial mínimo**: um objeto mock contendo **só** os campos que a linha da feature na tabela mestra (Prompt 3) lista em "Lê de `GameState`" — com valores de exemplo plausíveis, hardcoded e fáceis de editar no topo do arquivo.
- **`EventBus` de teste**: uma instância nova e dedicada da classe real de `core/event-bus.ts` (já pronta e congelada — não recriar a implementação), instanciada só para a sessão do harness, nunca a instância que `main.ts` usaria em produção. Serve tanto para a feature publicar eventos observáveis (logados no console do harness) quanto, quando fizer sentido, para o próprio harness disparar manualmente um evento que a feature assina (simulando o que outra feature publicaria em produção).
- **Chamada direta de `mount()`**: o harness importa a função de montagem da feature (assinatura definida em `core/screen-contract.ts`, Prompt 3) e chama `mount(rootElement, gameStateMock, eventBusMock)` num `<div id="harness-root">` do `index.html` local — sem passar por `screen-router.ts` nem por `main.ts`.

**Como rodar:** `index.html` é uma página HTML mínima e autônoma (`<div id="harness-root"></div>` + `<script type="module" src="./harness.ts">`), servível diretamente pelo Vite dev server apontando para esse arquivo. O agente não precisa que nenhuma das outras 7 features exista para ver e interagir com a própria tela.

O harness permanece no repositório após o merge (não precisa ser removido) — vive isolado dentro da pasta da própria feature e não é importado por nada em produção, então não tem custo de acoplamento.

---

## Convenção de branch/commit/PR

**Branch:** `feature/<nome-da-feature>` (nome exatamente igual ao da pasta em `src/features/`), ex.: `feature/cotacoes`, `feature/captura-palpite`. Ajustes pós-review continuam na mesma branch — não criar branch nova por rodada de correção.

**Mensagem de commit:**
```
feat(<nome-da-feature>): <descrição curta, imperativo, em português>
```
Ex.: `feat(cotacoes): implementa serviço de cotações com fallback offline`

**Descrição do PR (template fixo que o agente preenche):**
```markdown
## Feature: <nome>
## Branch: feature/<nome>

### Arquivos tocados
- <lista completa de caminhos>

### Eventos publicados
- <lista, deve bater 1:1 com a tabela mestra do Prompt 3>

### Eventos assinados
- <lista>

### Campos de GameState lidos / escritos
- Lidos: <lista>
- Escritos (via evento): <lista>

### Edição aditiva em arquivo compartilhado (se houver)
- <arquivo, campo/linha adicionada, ou "nenhuma">

### Harness
- Confirmo que `_harness/index.html` roda isoladamente sem erro de console.
- O que foi testado manualmente: <descrição breve>

### Autoavaliação contra os critérios de aceite (spec Prompt 3, feature <nome>)
- [ ] <cite o critério de aceite 1 da spec desta feature> — status
- [ ] <critério 2> — status
- [ ] ... (um item por critério de aceite já definido na spec; não inventar novos critérios aqui)

### Pendências / ambiguidades escalonadas
- <referência ao formato da seção "Protocolo de ambiguidade", ou "nenhuma">

### TODO de asset (se aplicável)
- <descrição do asset pendente, ou "nenhum">
```

---

## Checklist de revisão (integrador)

Aplicável a qualquer uma das 8 features, sem reler a spec inteira:

1. **Acoplamento:** nenhum `import` saindo de `src/features/<nome>/` para dentro de outra pasta de feature.
2. **Mutação de estado:** nenhuma escrita direta em campo de `GameState` fora de um handler de evento — toda alteração de estado passa pelo event-bus.
3. **Nomes de evento:** todo evento publicado/assinado bate exatamente (grafia, singular/plural, `:`) com a tabela mestra do Prompt 3.
4. **Arquivo congelado:** nenhuma edição em `core/event-bus.ts` ou `shared/theme.css`; qualquer edição em `core/game-state.types.ts` é estritamente aditiva e comentada com o nome da feature dona; qualquer edição em `core/screen-router.ts` é só append no array.
5. **TODO de asset:** se a feature depende de asset ainda não finalizado, há um `// TODO asset:` explícito e visível no código.
6. **Harness:** `_harness/index.html` roda isolado, sem erro de console.
7. **Autoavaliação da PR:** preenchida item a item contra os critérios de aceite da spec, não vazia nem genérica.
8. **Escopo de arquivos:** nada fora de `src/features/<nome>/` (e opcionalmente a exceção documentada e aprovada de `game-state.types.ts`/`screen-router.ts`) foi tocado.

Cada item é binário (sim/não) — a meta é revisão em poucos minutos por PR.

---

## Protocolo de conflito em arquivo compartilhado

Aplica-se apenas a `core/game-state.types.ts` e `core/screen-router.ts` (os únicos com edição aditiva permitida por agente-feature — `event-bus.ts` e `theme.css` são congelados sem exceção):

1. **Prioridade por ordem de chegada:** entre dois agentes que vão editar o mesmo arquivo compartilhado na mesma janela, quem tiver o PR aberto primeiro na fila do integrador edita e mescla primeiro nesse arquivo.
2. **Serialização preventiva:** o integrador vê, na seção "Arquivos tocados" das PRs abertas/em andamento, quando dois agentes vão colidir num arquivo compartilhado — e avisa o segundo agente **antes** dele começar essa parte do trabalho, não depois de dois PRs prontos conflitando.
3. **Se colidir mesmo assim** (dois PRs abertos simultaneamente sem aviso prévio): o integrador mescla o primeiro PR normalmente; para o segundo, é o **integrador** quem reaplica manualmente o trecho aditivo do segundo agente sobre o arquivo já atualizado — a resolução de conflito de merge nunca volta para a IA, pois ela não tem contexto do que mudou entretanto.
4. Como toda edição em `game-state.types.ts` é obrigatoriamente comentada com o nome da feature dona do campo, na prática o merge textual é quase sempre um append de bloco novo, não uma edição de bloco existente — o que torna o passo 3 raro e de baixo custo quando ocorre.

---

## Protocolo de ambiguidade / gap de spec

1. Agente identifica, durante a implementação, um caso **não coberto** pelos Prompts 2/3.
2. **Não decide sozinho** — implementa até onde a spec cobre e marca o ponto de dúvida.
3. Registra a dúvida de forma padronizada, em dois lugares:
   - Comentário no código, no ponto exato:
     ```
     // AMBIGUIDADE [<nome-da-feature>]: <pergunta objetiva em 1-2 frases>
     // Comportamento assumido temporariamente (se houver): <descrição>
     ```
   - Seção "Pendências / ambiguidades escalonadas" do PR (mesmo formato, resumido).
4. O integrador revisa e **decide** (sozinho, ou consultando o PET Economia se necessário — mas a decisão final registrada é sempre dele).
5. A decisão é registrada num arquivo único, versionado, **estritamente aditivo** (nunca reescrito): `docs/adendo-specs.md`, na raiz do repositório, com uma entrada por decisão:
   ```markdown
   ## [<data>] <feature> — <título curto da dúvida>
   **Pergunta:** ...
   **Decisão:** ...
   **Aplica-se a:** <outras features potencialmente afetadas, ou "somente esta">
   ```
6. A partir do momento em que `docs/adendo-specs.md` existir, sua leitura passa a ser **obrigatória** no kickoff de qualquer agente (junto com a spec do Prompt 3) — assim, a próxima IA que tocar o mesmo tema já encontra a decisão tomada em vez de reabrir a mesma dúvida.

---

## Template de kickoff por agente

Template único, parametrizado por `{{FEATURE}}` — colar em cada uma das (até) 8 conversas de IA:

```markdown
Você é o agente-feature responsável, e exclusivamente responsável, pela feature
`{{FEATURE}}` do projeto "Quanto Vale? 2.0".

## O que você pode ler
- A spec da feature `{{FEATURE}}` dentro do documento de specs do Prompt 3
  (procure pela seção com esse nome de feature — trate como fonte de verdade
  para eventos, campos de GameState e telas).
- Os 4 arquivos já prontos em `core/` (game-state.types.ts, event-bus.ts,
  screen-contract.ts, screen-router.ts).
- Opcionalmente, o HTML antigo do projeto, só como referência de conteúdo.

Não peça e não presuma informação sobre o estado de outras features — se você
sentir que precisa saber "como estão as outras", pare e sinalize isso como uma
ambiguidade/gap, não continue.

## O que você NUNCA faz
- Nunca importa de `src/features/<outra-feature>`.
- Nunca edita `main.ts`, `core/event-bus.ts` ou `shared/theme.css`.
- Só edita `core/game-state.types.ts` ou `core/screen-router.ts` de forma
  estritamente aditiva (novo campo comentado com o nome da sua feature / novo
  item no fim do array), e só se a spec exigir — declare isso explicitamente
  no PR se acontecer.

## Ambiguidade de spec
Se encontrar algo que a spec do Prompt 3 (e, se existir, `docs/adendo-specs.md`
— leia esse arquivo também, se ele existir no repo) não cobre, não decida
sozinho: implemente até onde a spec cobre, marque com um comentário
`// AMBIGUIDADE [{{FEATURE}}]: <pergunta>` no código, e reporte na seção
"Pendências / ambiguidades escalonadas" da sua entrega.

## Harness de desenvolvimento isolado
Crie `src/features/{{FEATURE}}/_harness/index.html` e `harness.ts`. O harness
deve montar um `GameState` parcial mock só com os campos que a spec da sua
feature lista como lidos, instanciar uma `EventBus` de teste (instância nova
da classe real de `core/event-bus.ts`) e chamar `mount()` (assinatura de
`core/screen-contract.ts`) num root local — sem depender de `main.ts` nem de
nenhuma outra feature existir.

## Entrega
- Branch: `feature/{{FEATURE}}`.
- Commits: `feat({{FEATURE}}): <descrição curta em português>`.
- PR seguindo o template padrão (arquivos tocados, eventos publicados/
  assinados, campos de GameState lidos/escritos, confirmação do harness,
  autoavaliação item a item contra os critérios de aceite já definidos na
  spec de `{{FEATURE}}` no Prompt 3, e pendências/ambiguidades escalonadas).
```

---

## Critérios de pronto (DoD por feature + integração final)

*(Seção autocontida — pode ser colada isoladamente em outra conversa.)*

**Contexto mínimo:** 8 features desacopladas do projeto "Quanto Vale? 2.0" (`setup-duplas`, `selecao-objeto`, `captura-palpite`, `cotacoes`, `calculo-pontuacao`, `revelacao-cedulas`, `placar-vitrine`, `configuracoes`), cada uma com harness isolado próprio e PR seguindo template fixo, revisadas por um integrador humano.

### DoD por feature
O DoD funcional primário de cada feature são os **critérios de aceite já definidos na spec dessa feature no Prompt 3** — não redefinidos aqui, só referenciados. Além disso, toda feature, para ser considerada pronta, precisa também de (critérios transversais, iguais para as 8):

- Harness (`_harness/`) funcional, rodando sem erro de console, isolado das outras features.
- PR preenchido conforme a convenção fixa (branch, commit, descrição estruturada), com autoavaliação item a item contra os critérios de aceite da spec Prompt 3 da própria feature.
- Nenhum arquivo fora do escopo permitido tocado (checklist de revisão do integrador aprovado nos 8 itens).
- Todo evento publicado/assinado batendo exatamente com a tabela mestra do Prompt 3.
- Nenhuma ambiguidade pendente sem registro — se houve escalonamento, a decisão do integrador já está em `docs/adendo-specs.md` antes do merge final.

### Critério de integração final
O conjunto (8 features + `core/` + `main.ts`) está pronto para gerar o artefato estático do evento quando:

- Fluxo completo é navegável de ponta a ponta sem erro no console: boas-vindas → `setup-duplas` → N rodadas (`selecao-objeto` → `captura-palpite` → `cotacoes`/`calculo-pontuacao` → `revelacao-cedulas`) → `placar-vitrine`.
- `cotacoes` funciona em modo fallback com a rede desligada (teste manual explícito de queda de rede).
- As 8 features estão mescladas na `main`, cada uma tendo passado pelo checklist de revisão do integrador.
- `npm run build` gera o artefato estático sem erros nem warnings de TypeScript.
- Pelo menos 2 rodadas completas foram jogadas manualmente, com duplas reais, no ambiente físico alvo (notebook + HDMI + TV do evento) — não só no ambiente de dev do integrador.
- `docs/adendo-specs.md`, se existir, não contém nenhuma decisão marcada como pendente/não resolvida.

---

## Plano de contingência

Aplicável às features de risco Alto/Médio da tabela do Prompt 3: `cotacoes` (Alta), `revelacao-cedulas` (Alta), `selecao-objeto` (Média), `captura-palpite` (Média), `calculo-pontuacao` (Média).

| Feature | Stub mínimo aceitável |
|---|---|
| `cotacoes` | Sempre em fallback fixo (valores hardcoded razoáveis para os países de `configuracoes.paisesDestaque`), nunca chama a API externa — remove o risco de rede do dia do evento independentemente do estado real da integração. |
| `revelacao-cedulas` | Placeholder cinza com texto "cédula indisponível" no lugar da imagem real, mantendo a navegação normal para a próxima tela. |
| `selecao-objeto` | Lista fixa de 1 objeto por rodada (sem sorteio dinâmico nem checagem de não repetição), suficiente para a rodada avançar. |
| `captura-palpite` | Campo de input livre sem timer visual/countdown, mantendo só a captura básica do palpite. |
| `calculo-pontuacao` | Fórmula simplificada (ex.: diferença absoluta, sem multiplicadores/escala especial), mantendo o placar funcional ainda que menos refinado. |

**Quem decide ativar:** só o integrador — nenhuma IA decide sozinha trocar sua própria feature por stub.

**Quando decidir:** o corte-limite recomendado é **D-2** (dois dias antes do evento) para congelar em stub qualquer feature de risco Alto/Médio ainda não fechada — o mais tarde possível sem comprometer o dia do evento. Mesmo depois de um stub entrar em uso, a versão real pode substituí-lo até o fim de D-1 se ficar pronta a tempo, já que o stub não altera contrato de eventos/GameState e a troca é local à pasta da feature.
