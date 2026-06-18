# CC1 — Plano de Análise

**Projeto:** FlowCarreiras — análise de métricas de perfil de artistas
**Fonte dos dados:** base do próprio sistema (PostgreSQL), populada com dataset **simulado** de 400 perfis (ver [CC2](CC2_plano_de_preparacao_dos_dados.md))
**Unidade de análise:** o **perfil de artista** (uma linha por usuário)

---

## 1. Contexto e objetivo

O FlowCarreiras coleta, ao longo do uso, um conjunto rico de sinais sobre cada
artista: completude do perfil, portfólio de obras, engajamento recebido
(curtidas, comentários), rede (seguidores), atividade de mentoria e
oportunidades. O objetivo da análise é **transformar esses sinais em
entendimento**: descobrir o que diferencia artistas mais engajados, identificar
segmentos de perfis e antecipar quais artistas têm potencial de entrar na
**fila de descoberta** da plataforma.

A unidade de análise é o **perfil**. Cada perfil vira uma linha de uma tabela
analítica com métricas agregadas — o que concilia a visão individual ("minhas
métricas", já entregue no dashboard embutido) com a visão agregada exigida pela
análise (correlações, agrupamentos, modelos).

## 2. Dados utilizados

Origem relacional (tabelas do sistema): `usuarios`, `perfis_artistas`, `obras`,
`curtidas`, `comentarios`, `seguidores`, `tags` (e tabelas de junção),
`mentorias`, `mensagens_mentoria`, `oportunidades`, `notificacoes_oportunidades`.

A partir delas, é construída **uma tabela analítica por perfil** (granularidade =
1 perfil). Volume atual: **400 perfis simulados**. Métricas previstas para
extração, agrupadas por dimensão:

| Dimensão | Métricas extraídas |
|---|---|
| **Perfil / completude** | `percentual_completude`, `onboarding_concluido`, indicadores de preenchimento (`tem_bio`, `tem_foto`, `tem_cidade`, `tem_area`), `n_links`, `n_tags_necessidade`, `n_tags_expertise`, `area_artistica`, `cidade`, `idade_conta_dias` |
| **Portfólio** | `n_obras`, `n_obras_publicadas`, `n_rascunhos`, `diversidade_midia` |
| **Engajamento recebido** | `curtidas_recebidas`, `comentarios_recebidos`, `media_curtidas_por_obra` |
| **Rede** | `seguidores`, `seguindo`, `razao_seg` |
| **Atividade própria** | `curtidas_dadas`, `comentarios_feitos` |
| **Mentoria** | `disponivel_para_mentorar`, `perfil_mentor_configurado`, `n_mentorias_mentor`, `n_mentorias_artista` |
| **Oportunidades** | `recebe_notificacoes`, `n_notificacoes` |
| **Alvos de modelagem** | `entrou_fila` (classificação, binário); `curtidas_recebidas`/`seguidores` (regressão, contínuo) |

> Estatísticas observadas no dataset: completude média **80,2** (dp 15,8); obras
> média **3,4** (máx 13); curtidas recebidas média **17,1** (dp **23,0**, máx
> **110** → forte assimetria à direita); fila de descoberta com **59%** positivos.
> Correlação de curtidas com obras publicadas **0,87**, com seguidores **0,69**,
> com completude **0,20**.

## 3. Perguntas de análise

1. **Quais atributos do perfil mais se associam ao engajamento recebido?**
   (completude, nº de obras, nº de tags, etc. → curtidas/seguidores)
2. **Perfis mais completos produzem e engajam mais?**
3. **Como o engajamento se distribui entre os artistas?** Há concentração
   (poucos artistas com muito engajamento — cauda longa)?
4. **Existem segmentos naturais de artistas?** (ex.: "iniciantes incompletos",
   "ativos em ascensão", "consolidados") via agrupamento.
5. **Quais variáveis melhor predizem a entrada na fila de descoberta?**
6. **Há diferença de desempenho por área artística e por cidade?**
7. **Como evoluem cadastros, curtidas e seguidores ao longo do tempo?**

## 4. Visualizações planejadas

| # | Pergunta | Métricas | Gráfico planejado |
|---|---|---|---|
| 1 | Distribuição do engajamento (3) | `curtidas_recebidas`, `seguidores` | **Histograma** + **boxplot** (escala log) |
| 2 | Relações com engajamento (1,2) | features × `curtidas_recebidas` | **Dispersão + linha de tendência**; **heatmap de correlação** |
| 3 | Segmentos de artistas (4) | features padronizadas | **Dispersão colorida por cluster** (após redução/clustering) |
| 4 | Predição da fila (5) | features → `entrou_fila` | **Matriz de confusão**, **curva ROC**, **precision-recall** |
| 5 | Desempenho por categoria (6) | `area`, `cidade` × métricas | **Barras ordenadas** (e boxplots por categoria) |
| 6 | Evolução temporal (7) | datas de cadastro/curtidas/seguidores | **Linha/área** (acumulado no tempo) |
| 7 | Composição do portfólio | `tipo_midia`, status | **Barras**; rosca apenas p/ ≤ 3 fatias |

## 5. Objetivos da comunicação visual

- **Revelar a desigualdade do engajamento** (cauda longa) — comunicar que a
  média engana e a mediana descreve melhor o artista típico.
- **Tornar visíveis as relações** entre completar/produzir e ser engajado,
  sustentando recomendações de produto (ex.: incentivar completude).
- **Comunicar segmentos** acionáveis de artistas.
- **Apoiar decisão** sobre a fila de descoberta, mostrando o desempenho do
  classificador de forma honesta (erros incluídos).
- Tudo com **leitura rápida**: hierarquia clara (KPIs → distribuições →
  relações → modelos), alto contraste e mínimo de "tinta" decorativa.

## 6. Justificativa dos tipos de gráfico (percepção e design visual)

As escolhas seguem a **hierarquia de canais perceptuais de Cleveland & McGill**
(posição em escala comum > comprimento > ângulo/área > cor), os princípios de
**pré-atenção** (cor/ tamanho para destacar o essencial) e a **razão
dado-tinta de Tufte** (remover o que não informa).

- **Histograma e boxplot (distribuições):** variáveis de contagem
  (`curtidas`, `obras`, `seguidores`) são fortemente **assimétricas à direita**.
  O histograma mostra a forma; o boxplot resume **mediana, IQR e outliers** —
  ideal quando média e desvio são distorcidos pela cauda. Uso de **escala
  logarítmica** para que a massa de valores baixos não fique comprimida.
- **Dispersão + linha de tendência (correlações):** relação entre duas
  quantitativas é melhor lida por **posição 2D** (canal mais preciso). A linha
  de tendência comunica direção e força sem exigir leitura ponto a ponto;
  resíduos complementam (CC4).
- **Heatmap de correlação:** para a matriz NxN, o objetivo é o **padrão geral**,
  não o valor exato — então o uso de **cor** (canal menos preciso) é adequado;
  emprega-se **escala divergente** centrada em zero para distinguir correlações
  positivas/negativas.
- **Barras (comparação entre categorias):** comprimento sobre eixo alinhado
  permite comparação precisa. Barras serão **ordenadas por valor** (não
  alfabética), reduzindo carga cognitiva. **Barras horizontais** para rankings
  com rótulos longos (tags, cidades).
- **Pizza/rosca:** restrita a **≤ 3 categorias** (ângulo é canal impreciso);
  para `tipo_midia` com 4 níveis, a barra é preferida.
- **Linha/área (séries temporais):** a continuidade da linha codifica a
  continuidade do tempo; o acumulado evidencia crescimento.
- **Matriz de confusão (heatmap) e ROC/PR (linha):** convenções consolidadas do
  domínio de classificação; comunicam o **trade-off** entre acertos e erros de
  forma direta.
- **Design transversal:** tema escuro com **uma cor de marca** (#7c3aed) usada
  só para destaque (não decoração); hierarquia visual KPIs → detalhe; ausência
  de 3D e de eixos truncados enganosos.

## 7. Resumo (pergunta → métrica → gráfico → princípio)

A seção 4 consolida o encadeamento. Em síntese, **cada visualização nasce de uma
pergunta**, usa as **métricas extraídas no CC2** e adota o **canal perceptual
mais preciso** disponível para a tarefa (comparar, relacionar, distribuir ou
evoluir), garantindo que a forma sirva à mensagem.
