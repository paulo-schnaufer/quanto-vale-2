# Conceitos para a atração do estande — PET Economia

## Opção 1 — "Quanto Vale? 2.0" (evolução da versão anterior)

**Pitch:** Chute o preço de um objeto e veja ele se transformar, em tempo real, em pilhas de dinheiro de outros países crescendo na tela.

**Mecânica central:** Nos primeiros 15s, a dupla vê um objeto (emoji hoje, mas dá pra evoluir pra ícone/ilustração) e precisa digitar/apontar um palpite de preço em reais. O que mantém jogando é a comparação social imediata: pontuação por proximidade, bônus pra quem chegou mais perto, e o "reveal" visual — em vez do grid de cartõezinhos atual, uma parede de cédulas digitais (5 a 8 países-destaque bem ilustrados) se "empilhando" ou se organizando lado a lado conforme o valor é convertido.

**Gancho de atenção:** Dinheiro é universalmente hipnotizante — ver uma pilha crescer na tela, com cores e bandeiras diferentes, é um gatilho visual forte mesmo pra quem só está passando e olha de longe.

**Conexão com Economia:** Explícita — câmbio, poder de compra comparado entre países. É reconhecível como "coisa de Economia" sem precisar explicar nada.

**Amplitude etária:** Funciona bem em toda a faixa — a mecânica de "chutar um preço" não exige conhecimento prévio. A dificuldade se ajusta sozinha pela escolha dos itens (um Big Mac vs. um apartamento), então dá pra calibrar por turma sem mudar o jogo.

**Complexidade técnica estimada:** Média — a base de jogo já existe e funciona; o esforço concentra em produzir/curar as ilustrações de cédulas (ou uma abordagem estilizada que não exija realismo de banco de imagens) e redesenhar a tela de revelação.

**Dependência de asset externo:** Ilustrações de cédulas de ~5-8 países; cotações de câmbio (já resolvido via API com fallback).

---

## Opção 2 — "Duelo de Ofertas"

**Pitch:** Duas duplas leiloam contra a outra por itens absurdos, com orçamento limitado, e quem estoura o orçamento perde tudo.

**Mecânica central:** Nos primeiros 15s, cada dupla vê seu orçamento fictício e um item em leilão (pode ser algo engraçado/exagerado pra prender atenção — "um ano de sorvete grátis", "o direito de pular a fila do RU"). O que mantém jogando é a tensão de decisão em tempo real: dar lance, blefar, ou desistir — com um cronômetro visível pra todo o corredor ver a disputa.

**Gancho de atenção:** Confronto direto entre duas duplas, ao vivo, com um relógio correndo — isso é drama social, o tipo de coisa que faz gente parar pra ver "quem vai ganhar".

**Conexão com Economia:** Implícita mas didaticamente rica — escassez, orçamento, custo de oportunidade, comportamento de leilão. Exige um pouco mais de "tradução" pro adolescente entender que aquilo é economia, mas o mecanismo em si (leilão) já é culturalmente reconhecível.

**Amplitude etária:** Boa, mas desigual — alunos mais velhos (EM) tendem a captar a estratégia de blefe/orçamento com mais nuance; os mais novos (6º-7º ano) provavelmente vão jogar mais por impulso do que por cálculo, o que ainda diverte mas dilui um pouco o aprendizado pretendido.

**Complexidade técnica estimada:** Média-Alta — precisa de lógica de leilão em tempo real, estado de duas duplas simultâneas, e uma boa curadoria de itens engraçados pra sustentar o humor sem ficar repetitivo.

**Dependência de asset externo:** Nenhuma essencial (pode rodar só com texto/ícones simples), mas ilustração dos itens em leilão ajuda bastante o visual.

---

## Opção 3 — "Reação em Cadeia da Economia"

**Pitch:** Um evento acontece (seca, greve, alta do dólar) e a dupla precisa montar, contra o relógio, a sequência correta de consequências até o "efeito final".

**Mecânica central:** Nos primeiros 15s, aparece uma manchete/evento inicial (ex.: "Geada atinge lavouras de café") e um conjunto embaralhado de cartões-consequência na tela. Usando o mouse, a dupla arrasta/clica pra ordenar a cadeia causal correta antes do tempo acabar. O que mantém jogando é a mistura de quebra-cabeça lógico com "aha" — ver a cadeia se montar e fazer sentido.

**Gancho de atenção:** Menor que as outras duas — é mais um jogo de raciocínio do que um espetáculo visual, então atrai menos quem só está de passagem rápida, mas prende bem quem já parou.

**Conexão com Economia:** Muito explícita — é literalmente sobre entender causa-efeito em cenários econômicos reais (oferta e demanda, inflação, câmbio). É o conceito mais "ensinável" das três opções.

**Amplitude etária:** Se sustenta mal na ponta mais nova — para alunos de 11-12 anos, entender por que "seca → menos café → preço sobe → consumidor paga mais" exige um raciocínio abstrato em cadeia que nem todo mundo nessa idade tem consolidado. Funciona melhor a partir do 9º ano/EM.

**Complexidade técnica estimada:** Média — drag-and-drop ou clique sequencial não é complexo tecnicamente, mas escrever cadeias causais que sejam claras, corretas e ainda assim não óbvias demais é um trabalho de conteúdo não-trivial.

**Dependência de asset externo:** Nenhuma essencial — funciona bem só com texto/ícones simples nos cartões.

---

## Recomendação

**Escolha: Opção 1 — "Quanto Vale? 2.0".**

Justificativa objetiva, pelos três critérios da seção 2:

- **Atenção:** dinheiro empilhando na tela é o gancho visual mais forte e mais imediato das três opções — não depende de o transeunte entender uma regra antes de se interessar, como acontece nas Opções 2 e 3.
- **Conexão com PET Economia:** é a conexão mais direta e legível das três — câmbio e dinheiro são reconhecidos como "Economia" instantaneamente, sem precisar de explicação por um monitor do estande.
- **Viabilidade para público amplo (11-18 anos):** é a única das três que se sustenta igualmente bem em toda a faixa etária sem perder qualidade pra nenhuma ponta, porque a dificuldade é regulável pela escolha dos itens, não pela complexidade do raciocínio exigido.

Como critério adicional (não pedido, mas relevante pra quem for ler isto isoladamente): esta opção também é a de menor risco de execução, porque reaproveita uma base de código já funcional (`quanto-vale.html`), concentrando o esforço da próxima etapa em decisão de arquitetura para as cédulas digitais — que é exatamente o gap já identificado no documento de status anterior. As Opções 2 e 3 exigiriam construir a lógica de jogo do zero, o que é um risco maior dado que não há indicação de prazo folgado até o evento.