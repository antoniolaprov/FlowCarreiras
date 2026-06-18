# FlowCarreiras — Trilha de Análise e Visualização de Dados

Solução analítica sobre as **métricas de perfil** dos artistas do FlowCarreiras.
Unidade de análise: **o perfil** (uma linha por usuário). Fonte: banco PostgreSQL
do sistema, populado com dataset **simulado** (400 perfis) — ver CC2.

## Entregáveis (CCs)

| CC | Entregável | Status |
|---|---|---|
| 1 | [Plano de análise](CC1_plano_de_analise.md) | ✅ |
| 2 | [Plano de preparação dos dados](CC2_plano_de_preparacao_dos_dados.md) | ✅ |
| 3 | [EDA (notebook)](CC3_eda.ipynb) | ✅ |
| 4 | [Regressão (notebook)](CC4_regressao.ipynb) | ✅ |
| 5 | [Classificação (notebook)](CC5_classificacao.ipynb) | ✅ |
| 6 | Dashboard interativo v1 (Streamlit) — `dashboard/app.py` (modo analítico) | ✅ |
| 7 | [Proposta de integração + ferramenta](CC7_proposta_integracao.md) | ✅ |
| 8 | [Dashboard consolidado](CC8_dashboard_consolidado.md) | ✅ |
| 9 | Versão quase final | ⏳ a fazer |
| 10 | Documentação final | ⏳ a fazer |

## Stack

- **Dados:** PostgreSQL (sistema) + `scripts/seed_simulado.py` (geração simulada)
- **Análise:** Python (pandas, scikit-learn, matplotlib/plotly) em notebooks
- **Publicação:** **Streamlit**, embutido no app em `/metricas` (ver `dashboard/`)
