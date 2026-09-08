# Roadmap & Backlog — "Quanto Vale? 2.0"

> Notação **D-X** = dias antes do evento (sem data de calendário definida em nenhum documento anterior). Substitua por datas reais quando o evento for marcado. Nada neste documento redefine conceito, arquitetura, specs, papéis, DoD ou plano de contingência — tudo aqui só sequencia e prioriza o que já foi fechado nos Prompts 1–4. Onde um critério é citado, a fonte é sempre um dos 4 documentos anteriores.

---

## Backlog priorizado

| # | Item de trabalho | Tipo | Responsável | Pré-requisitos | Critério de pronto | D-X |
|---|---|---|---|---|---|---|
| 1 | Setup inicial: `package.json`, `vite.config.ts`, `tsconfig.json`, os 4 arquivos de `core/`, `shared/theme.css` v1, `main.ts` | Setup inicial | Integrador | Nenhum | Protocolo — seção "Papéis › Integrador" (commitado antes de qualquer agente-feature começar) | D-14 |
| 2 | Envio do kickoff parametrizado às (até) 8 conversas de agente-feature | Setup inicial | Integrador | Item 1 concluído | Protocolo — "Template de kickoff por agente" | D-14 |
| 3 | Codificação: `cotacoes` | Feature | Agente-feature | `core/` pronto (item 1) | Protocolo — "DoD por feature" + Prompt 3, critérios de aceite de `cotacoes` | Início D-14 → revisão D-12 |
| 4 | Codificação: `calculo-pontuacao` | Feature | Agente-feature | `core/` pronto | idem, critérios de aceite de `calculo-pontuacao` | Início D-14 → revisão D-12 |
| 5 | Codificação: `setup-duplas` | Feature | Agente-feature | `core/` pronto | idem, critérios de aceite de `setup-duplas` | Início D-14 → revisão D-10 |
| 6 | Codificação: `selecao-objeto` | Feature | Agente-feature | `core/` pronto | idem, critérios de aceite de `selecao-objeto` | Início D-14 → revisão D-10 |
| 7 | Codificação: `configuracoes` | Feature | Agente-feature | `core/` pronto | idem, critérios de aceite de `configuracoes` | Início D-14 → revisão D-9 |
| 8 | Codificação: `captura-palpite` | Feature | Agente-feature | `core/` pronto (código independe; teste manual de ponta a ponta fica mais fácil após `selecao-objeto` mesclada) | idem, critérios de aceite de `captura-palpite` | Início D-14 → revisão D-7 |
| 9 | Codificação: `revelacao-cedulas` | Feature | Agente-feature | `core/` pronto (código independe; teste manual completo depende de `cotacoes`/`calculo-pontuacao` já na main) | idem, critérios de aceite de `revelacao-cedulas` | Início D-14 → revisão D-6 |
| 10 | Codificação: `placar-vitrine` | Feature | Agente-feature | `core/` pronto (teste manual visual depende de `historicoRodadas` real acumulado) | idem, critérios de aceite de `placar-vitrine` | Início D-14 → revisão D-5 |
| 11 | Revisão/merge de cada PR (×8) contra o checklist do integrador | Integração | Integrador | PR aberto pelo agente-feature correspondente | Protocolo — "Checklist de revisão (integrador)", 8 itens binários aprovados | Contínuo, D-12 a D-5 (fila de prioridade do Protocolo) |
| 12 | Curadoria de assets de cédulas (busca/padronização das fotos reais + preenchimento do manifesto) | Trabalho humano (fora do backlog de codificação) | Integrador / PET Economia | Schema do manifesto (Prompt 3) e convenção de pasta/nome (Prompt 2) já definidos | Fotos reais em `public/assets/cedulas/` seguindo a convenção + `cedulas.manifest.json` atualizado | Prazo: D-4 (ver checklist consolidado abaixo) |
| 13 | Resolução de ambiguidades escalonadas + fechamento de `docs/adendo-specs.md` | Integração | Integrador | Qualquer `AMBIGUIDADE [...]` reportada em PR | Protocolo — "Critério de integração final" (nenhuma decisão pendente/não resolvida) | Contínuo, fechado até D-3 |
| 14 | Ponto de decisão de contingência (stub vs. versão real, feature a feature) | Integração | Integrador | Features de risco Alto/Médio ainda não fechadas nesta data | Protocolo — "Plano de contingência" | D-2 (fixo) |
| 15 | Build de produção + validação física completa | Integração final | Integrador | 8 features mescladas na main + `core/` + `main.ts` | Protocolo — "Critério de integração final" | D-1 |
| 16 | Execução ao vivo no estande | Evento | Integrador / equipe PET | Build validado em D-1 | Protocolo — "Critério de integração final" (todos os itens satisfeitos) | D-0 |

---

## Roadmap por marcos

### D-14 — Kickoff
Setup inicial do integrador concluído e commitado (item 1 do backlog); kickoff enviado às 8 conversas de agente-feature; as 8 features começam a codificar **em paralelo**. Justificativa: esta é a única dependência bloqueante real do projeto (Protocolo — "Papéis"); nada mais pode começar antes.

### D-12 — Primeira leva de revisão (risco mais alto primeiro)
PRs de `cotacoes` e `calculo-pontuacao` chegam ao integrador e são revisados com prioridade. Justificativa: são as posições 1 e 2 da fila de revisão do Protocolo — maximiza o tempo de reação a problema de rede/API (`cotacoes`) e a erro de fórmula (`calculo-pontuacao`) antes do prazo.

### D-10 — Trecho inicial do fluxo navegável
Merge de `cotacoes` e `calculo-pontuacao` (se prontas); revisão/merge de `setup-duplas` e `selecao-objeto`. Justificativa: posições 3–4 da fila do Protocolo; libera um trecho navegável manualmente do início do fluxo (boas-vindas → duplas → objeto) sem depender de mocks no harness.

### D-8/D-9 — Configuração real disponível para testes
Merge de `configuracoes`. Justificativa: posição 5 da fila do Protocolo — mesclada cedo, permite ao integrador ajustar `numeroDeRodadas`/`tempoLimiteSegundosPorPalpite`/`paisesDestaque` de verdade ao testar as demais features, em vez de depender de valores fixos no mock do harness.

### D-7 — Captura de palpite
Revisão/merge de `captura-palpite`. Justificativa: posição 6 da fila — tecnicamente pode ser revisada a qualquer momento, mas seu teste manual de ponta a ponta fica mais fácil com `selecao-objeto` já mesclada (há um objeto real para dar palpite).

### D-6 — Revelação de cédulas com dados reais
Revisão/merge de `revelacao-cedulas`, priorizada **depois** de `cotacoes` e `calculo-pontuacao` já estarem na main, para que o teste manual de ponta a ponta use dados reais, não mockados (Protocolo, posição 7). Os assets reais de cédulas podem ainda não estar prontos neste ponto — a feature usa o placeholder cinza definido na sua própria spec (Prompt 3) até lá.

### D-5 — Placar
Revisão/merge de `placar-vitrine`, usando `historicoRodadas` real acumulado de rodadas já mescladas (Protocolo, posição 8, última da fila — só fica visualmente interessante de testar quando há dados reais de várias rodadas).

### D-4 — Prazo dos assets reais + primeiro fluxo completo mesclável
Prazo-limite para as fotos reais de cédulas estarem no repositório e no manifesto (checklist consolidado abaixo), dando 2 dias de folga antes do corte fixo de contingência em D-2 — tempo suficiente para trocar o placeholder de `revelacao-cedulas` pela versão com fotos reais e revalidar manualmente. Com as 8 features potencialmente já mescladas, este é o primeiro ponto em que o fluxo completo pode ser testado ponta a ponta.

### D-3 — Fechamento de pendências
Fluxo completo (8 features + `core/` + `main.ts`) navegável sem erro de console; toda `AMBIGUIDADE` escalonada resolvida e registrada em `docs/adendo-specs.md`, sem nenhuma pendência aberta. Justificativa: pré-condição para que a decisão de contingência de D-2 seja tomada com informação completa — nenhuma feature "quase pronta" sem status claro.

### D-2 — Corte de contingência (fixo)
Decisão final do integrador, feature a feature, entre versão real e stub, para toda feature de risco Alto/Médio ainda não fechada (ver seção dedicada abaixo). Justificativa: corte já definido no Protocolo como o mais tarde possível sem comprometer o dia do evento — não é redefinido aqui, só posicionado na timeline.

### D-1 — Build e validação física
Runbook completo de validação no ambiente físico do evento (seção dedicada abaixo). Última janela para trocar um stub ativado em D-2 pela versão real, caso ela fique pronta a tempo — o Protocolo permite essa troca até o fim de D-1, já que o stub não altera contrato de eventos/`GameState`.

### D-0 — Evento
Execução ao vivo. Nenhuma mudança de código neste dia — apenas o smoke test rápido pré-abertura descrito no runbook.

---

## Checklist consolidado — assets de cédulas

- **Quantidade:** mínimo 5 países-destaque (default de `ESTADO_INICIAL` no Prompt 3: `us`, `jp`, `gb`, `ar`, `mx`), ideal 5–8 conforme o conceito escolhido (Prompt 1); respeitar os limites de `configuracoes.paisesDestaque` definidos na spec de `configuracoes` (Prompt 3): mínimo 3, máximo = total de países cadastrados no manifesto. Cada país precisa de pelo menos 1 cédula fotografada (1 denominação); se houver mais de uma denominação por país no manifesto, a primeira declarada é a usada em `revelacao-cedulas` (regra já fixada no Prompt 3).
- **Convenção de nome de arquivo:** `{país-ISO 3166-1 alpha-2}_{moeda-ISO 4217}_{denominação}.jpg`, tudo minúsculo, sem acento, sem espaço (Prompt 2). Ex.: `us_usd_100.jpg`, `jp_jpy_10000.jpg`.
- **Formato/resolução:** JPG, orientação paisagem, ~900–1000px de largura, até ~300KB por arquivo (Prompt 2).
- **Pasta de destino:** `public/assets/cedulas/` (Prompt 2).
- **Manifesto:** `public/assets/cedulas/cedulas.manifest.json`, schema já fixado no Prompt 3 (`paisISO`, `nomePais`, `codigoISO4217`, `denominacao`, `arquivo`) — cada foto adicionada precisa de uma entrada correspondente.
- **Prazo:** pronto até **D-4**, coerente com a ordem de merge do Prompt 4 (`revelacao-cedulas` é revisada por volta de D-6, já com placeholder se necessário; D-4 dá folga de 2 dias antes do corte fixo de contingência em D-2 para trocar o placeholder pela versão real e revalidar manualmente).
- **Instrução resumida de busca:** localizar fotos reais de cédulas (paisagem, alta resolução) dos países definidos em `configuracoes.paisesDestaque`/manifesto; fonte sugerida no Prompt 3 (colnect.com/br); padronizar conforme a convenção acima e adicionar a entrada correspondente no manifesto para cada arquivo. **Isso é trabalho humano de curadoria, fora do escopo de qualquer agente-feature** (já declarado como TODO de asset na spec de `revelacao-cedulas`, Prompt 3).

---

## Runbook D-1 / D-0

### D-1 — Build e validação física completa
1. **Janela final de troca stub → real:** confirmar se alguma feature ativada como stub em D-2 já tem a versão real pronta; se sim, trocar agora (Protocolo permite até o fim de D-1).
2. **Build de produção:** rodar `npm run build`; confirmar que gera o artefato estático sem erros nem warnings de TypeScript (Protocolo — "Critério de integração final").
3. **Deploy local:** copiar o artefato gerado para o notebook físico que será usado no evento (sem depender de servidor).
4. **Ambiente físico real:** conectar o notebook ao HDMI/TV que serão efetivamente usados no estande — não o monitor de desenvolvimento do integrador.
5. **Rede desligada:** desligar wifi/ethernet do notebook, simulando a condição real do estande; confirmar que `cotacoes` opera em fallback sem travar a inicialização (Protocolo — teste manual explícito de queda de rede).
6. **≥ 2 rodadas completas jogadas manualmente**, com duplas reais (não sozinho), cobrindo o fluxo de ponta a ponta: boas-vindas → `setup-duplas` → N rodadas (`selecao-objeto` → `captura-palpite` → `cotacoes`/`calculo-pontuacao` → `revelacao-cedulas`) → `placar-vitrine` (Protocolo — "Critério de integração final").
7. **Verificações específicas durante as rodadas:** cédula exibida (real ou placeholder, conforme decisão de D-2) sem travar a navegação; ranking final correto em `placar-vitrine`, incluindo caso de empate; retorno automático a `boas-vindas` após 30s de inatividade.
8. **Console limpo:** nenhum erro de console durante toda a sequência.
9. **`docs/adendo-specs.md` sem pendência:** confirmar que nenhuma decisão está marcada como pendente/não resolvida (Protocolo — "Critério de integração final").

### D-0 — Dia do evento
1. **Smoke test rápido pré-abertura**, já na posição física definitiva do estande (antes do público chegar): notebook + HDMI + TV, rede desligada, 1 rodada completa jogada manualmente.
2. **Nenhuma mudança de código neste dia** — se algo falhar ao vivo, a resposta é operacional (reiniciar o app, restaurar o build validado em D-1), nunca um novo deploy improvisado.

---

## Pontos de decisão de contingência na timeline

Todos ancorados no corte fixo **D-2** já definido no Protocolo (Plano de contingência) — o roadmap não cria um corte novo, só posiciona a consequência de cada feature não fechada a tempo.

| Feature de risco | D-X do corte | Consequência se não decidido a tempo |
|---|---|---|
| `cotacoes` (Alto) | D-2 | Sem decisão explícita até D-2, a versão real incompleta continua em produção sem rede de segurança — risco de a inicialização travar no dia do evento se a API cair. Ativar o stub (fallback fixo, nunca chama API externa) remove esse risco por completo. |
| `revelacao-cedulas` (Alto) | D-2 | Sem decisão, a tela pode chegar ao evento com bug de exibição não capturado a tempo, ou sem asset avisado ao integrador. Stub = placeholder cinza "cédula indisponível", mantendo a navegação normal para a próxima tela. |
| `selecao-objeto` (Médio) | D-2 | Sorteio dinâmico com checagem de não repetição pode falhar silenciosamente sob uso real. Stub = lista fixa de 1 objeto por rodada, suficiente para a rodada avançar. |
| `captura-palpite` (Médio) | D-2 | Timer visual com bug pode travar a tela sem permitir input. Stub = campo de input livre sem timer/countdown, mantendo só a captura básica do palpite. |
| `calculo-pontuacao` (Médio) | D-2 | Fórmula com multiplicadores/escala incorreta gera placar sem sentido no dia do evento. Stub = diferença absoluta simplificada, mantendo o placar funcional ainda que menos refinado. |

**Quem decide e quando:** só o integrador, nenhuma IA decide sozinha (Protocolo). A decisão de D-2 não é definitiva até D-1 — a troca de stub por versão real continua permitida até o fim de D-1 se a versão real ficar pronta a tempo (ver runbook D-1, passo 1).

---

## Riscos residuais

Riscos que o plano de contingência do Prompt 4 **não** cobre (ele é escopado só a `cotacoes`, `revelacao-cedulas`, `selecao-objeto`, `captura-palpite`, `calculo-pontuacao`):

1. **`setup-duplas` e `placar-vitrine` (risco Baixo) não têm stub definido.** O plano de contingência do Prompt 4 cobre explicitamente só as features de risco Alto/Médio. Se uma dessas duas atrasar inesperadamente perto de D-2, não há stub pronto para ativar. Mitigação: dado o risco baixo já declarado no Protocolo, a probabilidade é pequena; se ocorrer, a decisão de como proceder é ad hoc do integrador (fora do que os 4 documentos anteriores cobrem) e deve ser registrada em `docs/adendo-specs.md` seguindo o mesmo formato usado para as demais decisões.
2. **Falha de hardware/ambiente físico no dia do evento** (notebook, cabo HDMI, energia, incompatibilidade com a TV do local) não é escopo do Protocolo de coordenação multi-IA, que cobre software/features, não logística do estande. Mitigação: o runbook D-1 já testa o ambiente físico real, mas não substitui uma verificação prévia do local (se houver acesso antes de D-1) nem a existência de um cabo/notebook backup — isso é responsabilidade operacional da equipe PET, fora do escopo desta sequência de documentos.
3. **Integrador como ponto único de falha de revisão.** Nenhum dos 4 documentos anteriores define um revisor substituto caso o integrador fique indisponível (doença, imprevisto) num dia crítico de merge entre D-12 e D-5. Mitigação: não há uma formalizada nos documentos anteriores; este risco fica registrado aqui como aceito explicitamente, cabendo ao integrador decidir informalmente se quer indicar um substituto de confiança — decisão fora do escopo desta sequência de prompts.
