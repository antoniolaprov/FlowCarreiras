# CC7 — Proposta de Integração Visual da Solução

**Projeto:** FlowCarreiras — análise e visualização de métricas de perfil
**Ferramenta de publicação:** **Streamlit** (citada no CC7/CC8)
**Contexto de publicação:** web, **embutida no próprio sistema** + visão analítica autônoma

---

## 1. Ferramenta escolhida e justificativa

A ferramenta de publicação é o **Streamlit**, escolhido entre as opções nomeadas no
enunciado (Streamlit, Power BI Web, Tableau Public, Looker Studio, Metabase). A
justificativa é técnica e de contexto:

| Critério | Por que Streamlit |
|---|---|
| **Publicação em contexto web** | Serve uma aplicação web interativa; roda atrás do Nginx do projeto em `/dashboard`. |
| **Lê a própria base** | Conecta direto ao PostgreSQL do sistema pela rede interna do `docker-compose` — sem gateway nem exportação. |
| **Deploy self-hosted** | Sobe como **mais um serviço** no mesmo `docker-compose`; onde o sistema é hospedado, o dashboard vai junto (sem nuvem de terceiros). |
| **Coesão com a análise** | Usa o **mesmo stack Python** dos notebooks (pandas/scikit-learn), então clustering, regressão e métricas de classificação são exibidos **nativamente**. |
| **Filtro por usuário** | Valida o **JWT** do usuário logado (mesmo segredo do backend) e segmenta os dados. |

> Alternativas como Power BI/Looker foram descartadas por exigirem nuvem externa,
> gateway para alcançar o Postgres e custo/limitações para o filtro por usuário —
> incompatíveis com o requisito de **deploy próprio** e leitura da **base do sistema**.

## 2. Estrutura da aplicação final

A solução é um **único serviço Streamlit** (`dashboard/`) com **dois modos**, selecionados
pela presença de um token na URL:

```
┌─────────────────────────────────────────────────────────────┐
│ docker-compose                                               │
│                                                             │
│  db (PostgreSQL) ─────────────┐                             │
│  backend (Spring Boot)        │ rede interna                │
│  dashboard (Streamlit) ───────┤  lê db:5432                 │
│  frontend (Nginx + React) ────┘                             │
│        │                                                    │
│        ├─ /              → app React (sistema)              │
│        ├─ /metricas      → aba que embute o dashboard (iframe)│
│        └─ /dashboard     → proxy p/ Streamlit (com WebSocket)│
└─────────────────────────────────────────────────────────────┘
```

- **Modo "Minhas Métricas" (com `?token=`):** acessado pela aba **/metricas** do sistema,
  via `<iframe src="/dashboard/?embed=true&token=JWT">`. Mostra **apenas os dados do usuário
  logado**. É a entrega de produto voltada ao artista.
- **Modo "Dashboard Analítico" (sem token):** acessado em **`/dashboard`**. Visão **agregada**
  dos 400 perfis, voltada à coordenação/análise — é onde os achados dos CCs 3–5 são
  comunicados. É a entrega analítica avaliada.

Ambos os modos são servidos pelo **mesmo container**, atrás do **mesmo domínio** (Nginx faz o
proxy reverso com suporte a WebSocket), o que elimina problemas de CORS/iframe de terceiros.

## 3. Organização visual das páginas/seções

### 3.1 Dashboard Analítico (`/dashboard`)

Barra lateral fixa de **filtros** (segmentação global) + **abas** temáticas:

| Seção | Conteúdo | Função na narrativa |
|---|---|---|
| **Filtros (sidebar)** | área artística, cidade, completude mínima, "só fila" | segmentar todas as visões |
| **Aba 1 — Visão geral** | KPIs (nº perfis, % na fila, medianas) + perfis por área + texto-narrativa | abertura: o panorama |
| **Aba 2 — Distribuições** | histograma + boxplot (seletor de variável, toggle log) | mostrar a desigualdade (cauda longa) |
| **Aba 3 — Correlações** | heatmap de Pearson | revelar o que move o engajamento |
| **Aba 4 — Segmentos** | k-means (k ajustável) + projeção PCA + perfil dos clusters | agrupar artistas em perfis acionáveis |
| **Aba 5 — Modelo de descoberta** | matriz de confusão, métricas, ROC, PR, **slider de limiar** | avaliar a previsão da fila |

### 3.2 Minhas Métricas (`/metricas`, embutido)

Página única em rolagem, com **hierarquia do geral ao detalhe**: KPIs no topo, depois seções de
Perfil/Onboarding, Portfólio, Engajamento, Rede, Atividade, Mentoria e Oportunidades.

### 3.3 Princípios de design aplicados (transversais)

- **Hierarquia visual:** KPIs grandes no topo → gráficos de apoio → texto interpretativo.
- **Contraste:** tema escuro com **uma cor de marca** (#7c3aed) usada só para destaque.
- **Consistência:** mesma paleta e mesmos tipos de gráfico do CC1 (barras para comparação,
  heatmap para matriz, dispersão/área para relações e tempo).
- **Usabilidade:** filtros agrupados na sidebar; abas para reduzir carga cognitiva; rótulos e
  títulos em português; interatividade (seletores, sliders) sem recarregar a página.
- **Narrativa:** cada aba traz um bloco de **interpretação textual** ligando o gráfico ao insight.

## 4. Publicação e usabilidade em contexto web

- **Publicação:** o Streamlit é publicado pelo Nginx em `/dashboard` (mesmo host do sistema),
  com upgrade de WebSocket configurado. Em produção, sobe no mesmo `docker-compose` do deploy.
- **Service worker:** o `/dashboard` foi adicionado ao `navigateFallbackDenylist` do PWA para
  não ser interceptado pelo app React.
- **Responsividade:** layout `wide` do Streamlit + colunas que se adaptam; uso em desktop e
  tablet.
- **Segurança/segmentação:** o modo embutido recebe o JWT do usuário logado e filtra os dados;
  o modo analítico é a visão agregada (sem dados individuais sensíveis).

## 5. Próximos passos (CC8 → CC10)

- **CC8:** consolidar o dashboard com textos interpretativos finais e documentação de decisões.
- **CC9:** validação funcional (dados carregados, interatividade) antes da apresentação.
- **CC10:** documentação final com histórico de decisões, capturas e síntese de insights.
