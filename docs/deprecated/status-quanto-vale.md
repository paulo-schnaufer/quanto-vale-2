# Status — "Quanto Vale?" (estande do PET Economia)

> Documento vivo. Ideia: você preenche o Formulário (seção 3), e depois cola este arquivo inteiro numa conversa com IA (Claude ou outra) pra gerar o próximo passo de desenvolvimento. Vá atualizando a seção 5 (log) a cada rodada de mudanças.

## 1. Contexto do projeto

- Evento presencial: alunos passam por estandes de vários PETs.
- Objetivo: o estande do PET Economia precisa ter algo visualmente diferenciado em relação aos outros PETs.
- Ideia central da solução: exibir digitalmente as cédulas de cada país, lado a lado com uma competição entre duplas para adivinhar o preço de itens variados — comparando o valor em moedas de diferentes países.

## 2. Estado atual da implementação (`quanto-vale.html`)

### Fluxo do jogo, hoje
1. Tela inicial com botão "Toquem para começar".
2. Configuração: escolhe quantas duplas vão jogar (2 a 6).
3. Escolha do objeto: grade com 60 itens (emoji + nome), ou botão "Sortear" aleatório.
4. Alguém digita o preço real do objeto num teclado numérico na tela.
5. Cada dupla tem sua vez, com 15s de cronômetro visual, para chutar o preço.
6. Resultado da rodada: pontuação por proximidade percentual do chute (100/90/70/50/25/10 pts conforme o erro) + bônus de 20 pts para quem mais acertou. Tem confete se alguém acertar bem perto.
7. Placar geral acumulado entre rodadas.
8. Tela de "revelação": mostra o preço real convertido em 44 moedas de outros países — cada uma num cartãozinho com bandeira (emoji), nome do país e valor.
9. Configurações: busca cotações ao vivo numa API pública (open.er-api.com) ao abrir a página; se não tiver internet, usa uma tabela de cotações fixa salva no código como reserva.

### Aspectos técnicos e visuais
- HTML/CSS/JS puro em arquivo único, sem framework nem build.
- Layout pensado para tela cheia tipo totem/tablet em modo paisagem (unidades em vh/vw).
- Paleta verde + dourado, fontes Fredoka (títulos) e Inter (texto corrido).
- Nenhuma persistência: tudo reinicia se a página recarregar (sem localStorage nem backend).
- Objetos representados por emoji, não por imagens/fotos reais.
- 60 objetos cadastrados; 44 moedas cadastradas na conversão.

### O que ainda NÃO está implementado (o principal gap)
A ideia das **cédulas digitais de cada país lado a lado com a competição** ainda não existe visualmente. Hoje a tela de "revelação" mostra só um grid de cartõezinhos de texto com bandeira emoji — não há ilustração nenhuma de cédula/nota de dinheiro. Esse é o ponto mais importante a decidir e construir para a ferramenta ficar como você descreveu.

## 3. Formulário de decisões pendentes

Preencha cada resposta abaixo — vale rascunho ou palpite, o objetivo é ter algo concreto pra iterar depois.

### A. Contexto físico do estande
- Quantas telas/estações vão rodar o jogo ao mesmo tempo?
  **Resposta:** Apenas uma.
- Qual dispositivo será usado? (tablet touch / monitor touch / notebook+mouse / TV+controle remoto)
  **Resposta:** Notebook.
- Orientação e tamanho aproximado da tela?
  **Resposta:**1920x1080
- Vai ter Wi-Fi estável no local? (isso afeta se as cotações vêm ao vivo ou da tabela fixa)
  **Resposta:** Não contaremos com isso.
- Quanto tempo cada dupla deve ficar jogando, considerando a fila de quem está esperando a vez?
  **Resposta:** 30 segundos - 1 minuto

### B. O diferencial: cédulas digitais
- As cédulas devem ser: (i) reprodução realista das notas de cada país, (ii) ilustração própria estilizada, (iii) fotos de banco de imagens?
  **Resposta:** fotos de banco de imagens, mas vamos deixar em uma pasta junto.
- Quantos países ganham destaque visual com cédula própria (ex.: 5 a 8 principais) versus os que ficam só na listinha em texto (as 44 atuais)?
  **Resposta:** 5 principais.
- Onde as cédulas aparecem: (i) sempre visíveis numa área fixa da tela durante o jogo todo, (ii) só na tela de resultado/revelação, (iii) reveladas progressivamente conforme os palpites vão sendo mostrados?
  **Resposta:** Só no resultado.
- Quer uma curiosidade/fato rápido sobre o país ou a moeda do lado de cada cédula?
  **Resposta:** Pode ter a curiosidade.

### C. Dinâmica do jogo
- Quantas rodadas cada dupla joga antes de passar a vez pra próxima da fila?
  **Resposta:** 1 rodada. Se a pessoa quiser jogar de novo, ela joga.
- O cronômetro de 15s por palpite está bom pro ritmo do estande, ou precisa mudar?
  **Resposta:** Tá ótimo.
- Faz sentido ter uma tela "vitrine" pública (placar) visível pra quem está esperando, enquanto outra dupla joga?
  **Resposta:** Simm.
- Vai ter algum prêmio ou reconhecimento pra quem pontuar mais no dia?
  **Resposta:** Uma bala de chocolate.

### D. Conteúdo
- A lista atual de 60 objetos está adequada ao público (faixa etária, poder de compra)?
  **Resposta:** decida você: 6ª ano ao terceiro do médio.
- Qual é a faixa etária esperada de quem vai jogar (ensino médio, calouros, público geral do evento)?
  **Resposta:** falei acima.
- Mantém as 44 moedas atuais na conversão, ou reduz pra um conjunto menor e mais didático?
  **Resposta:** Menor e mais didático.

### E. Identidade visual e marca
- Precisa entrar logo/cores oficiais do PET Economia (hoje o jogo usa uma paleta verde/dourado própria, sem identidade do PET)?
  **Resposta:** sim.
- Vale ter uma tela de "atração" (parada, chamativa) enquanto ninguém está jogando, pra chamar atenção de quem passa no estande?
  **Resposta:** Sim.
- Vale incluir um QR code levando pras redes sociais/site do PET Economia?
  **Resposta:** Sim.

### F. Dados e acompanhamento
- Precisa registrar quantas pessoas jogaram e as pontuações, pra usar num relatório do evento depois?
  **Resposta:** Sim, todas.
- Se sim, tem preferência de onde guardar isso? (hoje não existe nenhuma persistência — tudo reinicia a cada carregamento de página)
  **Resposta:** Não, mas deve ser guardado, será local, então é tranquilo.

### G. Robustez técnica
- Em qual navegador/dispositivo exatamente o jogo vai rodar no dia do evento?
  **Resposta:** Pensa você, mas será notebook.
- Precisa funcionar 100% offline (zero dependência de internet), ou o fallback atual de cotações salvas já resolve?
  **Resposta:** Pode ter internet se facilitar pra você, é tranquilo conseguir, só prefiro não deployar porque será dinâmico e gratuito.
- Alguém vai testar o fluxo inteiro antes do evento, de preferência no mesmo aparelho/tela do dia?
  **Resposta:** Claro que sim.

## 4. Próximos passos

_A preencher depois que as respostas da seção 3 estiverem prontas — aqui entra o backlog priorizado de desenvolvimento._

## 5. Log de iterações

- **2026-09-08** — Recebido `quanto-vale.html` com fluxo de jogo completo (duplas, escolha de objeto, palpites cronometrados, pontuação, placar, conversão de moedas com cotação ao vivo/fallback). Identificado que o diferencial das "cédulas digitais" ainda não está implementado. Criado este documento de status e o formulário de decisões pendentes.
