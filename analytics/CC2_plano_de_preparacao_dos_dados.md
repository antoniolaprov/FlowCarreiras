# CC2 — Plano de Preparação dos Dados

**Projeto:** FlowCarreiras — análise de métricas de perfil
**Complementa:** [CC1 — Plano de Análise](CC1_plano_de_analise.md)

---

## 1. Fontes de dados

A fonte é **própria + simulada**: o banco **PostgreSQL do próprio sistema**,
populado com um **dataset simulado** de 400 perfis gerado pelo script
[`scripts/seed_simulado.py`](../scripts/seed_simulado.py).

Por que simulado? Em produção o sistema tinha ~5 usuários — volume insuficiente
para correlação, agrupamento e modelos. O critério avaliativo permite
explicitamente dados **simulados**. O gerador foi desenhado para ser **realista
e não-trivial**: embute correlações propositais (perfis mais "ativos" tendem a
ter perfil mais completo, mais obras, mais curtidas e mais seguidores), com
**ruído** — para que padrões existam sem serem determinísticos.

Garantias de qualidade da fonte:
- **Reprodutível:** `random.seed(42)`.
- **Rastreável:** todo registro simulado é marcado (e-mail `@sim.flowcarreiras.dev`).
- **Idempotente:** cada execução limpa o conjunto simulado anterior e recria.
- **Íntegro:** respeita as chaves estrangeiras e restrições do schema real
  (mesmas tabelas que o sistema usa em produção).

## 2. Formatos disponíveis

| Etapa | Formato |
|---|---|
| Origem | Tabelas relacionais PostgreSQL (normalizadas) |
| Extração | Consultas SQL → **`pandas.DataFrame`** |
| Persistência intermediária | **CSV/Parquet** (`analytics/dados/perfil_features.csv`) para reprodutibilidade dos notebooks |
| Consumo | Notebooks (EDA/regressão/classificação) e dashboard Streamlit |

## 3. Da forma relacional para a tabela analítica

Os dados nascem **normalizados** (curtidas, obras, seguidores em tabelas
separadas). A análise precisa de **uma linha por perfil**. A transformação
central é, portanto, de **agregação**: contagens e razões por perfil via
`JOIN` + `GROUP BY`, materializadas numa **tabela analítica achatada**.

## 4. Dicionário de variáveis (tabela analítica `perfil_features`)

| Variável | Tipo | Origem / cálculo | Característica | Tratamento previsto |
|---|---|---|---|---|
| `percentual_completude` | numérica [0,100] | `perfis_artistas` | assimétrica à esquerda (~80) | escala p/ clustering |
| `n_obras`, `n_obras_publicadas`, `n_rascunhos` | contagem | `count(obras)` | assimétrica à direita | `log1p` |
| `diversidade_midia` | contagem (0–4) | distinct `tipo_midia` | discreta | — |
| `curtidas_recebidas` | contagem | `curtidas ⋈ obras` | cauda longa (máx 157) | `log1p`; alvo de regressão |
| `comentarios_recebidos` | contagem | `comentarios ⋈ obras` | cauda longa, muitos zeros | `log1p` |
| `media_curtidas_por_obra` | razão | curtidas / publicadas | indefinida se 0 obras | preencher 0 quando den.=0 |
| `seguidores`, `seguindo` | contagem | `seguidores` | assimétrica | `log1p` |
| `razao_seg` | razão | seguidores / seguindo | indefinida / extremos | clip + tratar den.=0 |
| `curtidas_dadas`, `comentarios_feitos` | contagem | atividade do usuário | assimétrica | `log1p` |
| `n_tags_necessidade`, `n_tags_expertise`, `n_links` | contagem | tabelas de junção | discreta | — |
| `tem_bio`, `tem_foto`, `tem_cidade`, `tem_area` | booleana | `NOT NULL` dos campos | binária | já 0/1 |
| `disponivel_para_mentorar`, `perfil_mentor_configurado`, `recebe_notificacoes`, `onboarding_concluido` | booleana | `perfis_artistas` | binária | já 0/1 |
| `area_artistica` | categórica (~10) | `perfis_artistas` | nominal | **one-hot** p/ modelos |
| `cidade` | categórica (~14) | `perfis_artistas` | nominal, cardinalidade média | one-hot ou agrupar raras |
| `idade_conta_dias` | numérica | `now - data_criacao` | contínua | — |
| `entrou_fila` | booleana | `data_entrada_fila IS NOT NULL` | **alvo de classificação** (59/41) | — |

## 5. Estratégias de limpeza

- **Valores ausentes (NULL):** campos como `bio`, `foto_perfil`, `cidade`,
  `area`, `valor_hora_mentoria` são nulos quando o artista **não preencheu**.
  Aqui a ausência **é informação** (perfil incompleto), não um buraco aleatório:
  por isso **não se imputa** — converte-se em **indicador booleano**
  (`tem_bio` etc.) e os campos numéricos nulos viram 0 onde fizer sentido.
- **Razões indefinidas:** `media_curtidas_por_obra` e `razao_seg` têm divisão
  por zero quando o denominador é 0 → definidas como **0** (regra explícita),
  evitando `inf`/`NaN` que quebram modelos e gráficos.
- **Outliers:** valores extremos de engajamento (ex.: 157 curtidas) são
  **reais e relevantes** (a cauda longa é o fenômeno de interesse) → **não são
  removidos**. Para visualização, usa-se **escala log**; para modelos sensíveis,
  avalia-se **winsorização** apenas se necessário.
- **Duplicatas:** inexistentes por construção (chaves únicas, geração controlada);
  ainda assim, verificação por `usuario_id`.
- **Consistência:** `percentual_completude` é recalculado com a mesma fórmula do
  sistema e conferido; `entrou_fila` validado contra `data_entrada_fila`.

## 6. Normalização e transformações

| Técnica | Onde se aplica | Por quê (característica da variável) |
|---|---|---|
| **`log1p`** | contagens (`curtidas`, `obras`, `seguidores`, …) | distribuições com **forte assimetria à direita** e muitos zeros; o `log1p` comprime a cauda, lineariza relações e melhora dispersão/regressão. O `+1` trata o zero. |
| **Padronização (z-score)** | features numéricas para **clustering** | algoritmos baseados em distância (k-means) são **sensíveis à escala**; sem padronizar, `curtidas` dominaria `completude`. |
| **One-hot encoding** | `area_artistica`, `cidade` | variáveis **nominais** não têm ordem; rotular como inteiro introduziria ordem falsa. Categorias raras de `cidade` podem ser agrupadas em "Outras". |
| **Min-Max (opcional)** | gráficos comparativos | quando se quer comparar variáveis em [0,1] na mesma escala visual. |
| **Engenharia de atributos** | derivadas | `idade_conta_dias`, razões e indicadores de preenchimento tornam explícitos sinais que estão implícitos nas tabelas. |

## 7. Justificativa do pré-processamento (síntese por tipo de variável)

- **Contagens assimétricas** → `log1p` + estatísticas robustas (mediana/IQR):
  porque a média e o desvio são puxados pela cauda, e modelos lineares assumem
  relações aproximadamente lineares/homocedásticas.
- **Booleanas** → mantidas como 0/1: já estão no formato ideal para modelos e
  para segmentação.
- **Categóricas nominais** → one-hot: preserva a ausência de ordem e evita viés.
- **NULL com significado** → indicador, não imputação: a incompletude é um sinal
  preditivo (e correlaciona com a fila de descoberta), então preservá-la importa.
- **Razões** → regra explícita para denominador zero: garante robustez numérica.

## 8. Pipeline resumido e reprodutibilidade

```
seed_simulado.py  →  PostgreSQL (tabelas normalizadas)
        │
        ├─ extração SQL (JOIN + GROUP BY)  →  perfil_features (1 linha/perfil)
        │
        ├─ limpeza (NULL→indicador, razões, consistência)
        ├─ transformação (log1p, z-score, one-hot, derivadas)
        │
        └─ perfil_features.csv  →  notebooks (CC3/4/5) + dashboard (CC6+)
```

Toda a cadeia é **reprodutível** (seed fixo, script versionado, dados marcados),
permitindo regenerar o dataset e reexecutar a análise do zero com um comando.
