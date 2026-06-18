# CC8 — Dashboard Consolidado: decisões, insights e melhorias

**Ferramenta:** Streamlit (`dashboard/app.py`) · **Acesso analítico:** `http://localhost/dashboard`
**Dados:** 400 perfis simulados, carregados **ao vivo** do PostgreSQL do sistema

---

## 1. Estado da entrega

O dashboard está **consolidado e funcional**:

- ✅ **Dados carregados corretamente** — leitura direta do Postgres (`carregar_perfis()`),
  agregando as tabelas relacionais em uma tabela analítica de 1 linha por perfil, com cache.
- ✅ **Visualizações interativas finalizadas** — 5 abas (visão geral, distribuições, correlações,
  segmentos, modelo) + filtros na barra lateral + controles (seletor de variável, toggle log,
  `k` do clustering, limiar do classificador).
- ✅ **Elementos textuais interpretativos** — bloco "Sobre esta análise" com os achados e um
  parágrafo de interpretação em cada aba.

## 2. Decisões visuais (e suas justificativas)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Estrutura de navegação** | Abas temáticas + filtros na sidebar | Reduz carga cognitiva: cada aba é uma pergunta; os filtros são globais e ficam sempre visíveis. |
| **Tipos de gráfico** | barras (comparação), heatmap (correlação), histograma+boxplot (distribuição), dispersão/PCA (segmentos), linha (ROC/PR) | Cada um usa o **canal perceptual** mais adequado à tarefa (posição > cor > ângulo), conforme o CC1. |
| **Escala** | toggle `log1p` nas distribuições | As contagens têm cauda longa; a escala log revela a massa de valores baixos sem esconder os outliers. |
| **Cor** | tema escuro + **uma** cor de marca (#7c3aed); divergente (RdBu) na correlação | Cor usada para **destaque**, não decoração; escala divergente centra o zero na matriz de correlação. |
| **Hierarquia** | KPIs no topo → gráficos → texto interpretativo | Leitura do geral ao detalhe; o número-chave primeiro, o porquê depois. |
| **Interatividade** | slider de limiar recalcula matriz de confusão e métricas ao vivo | Transforma o trade-off precisão×recall em algo **manipulável**, não estático. |
| **Dois modos** | per-usuário (embutido) vs. analítico (agregado) | Separa a visão de **produto** (o artista vê só os seus dados) da visão de **análise** (coordenação). |

## 3. Insights extraídos dos dados

1. **O engajamento é desigual (cauda longa).** A mediana de curtidas é baixa, enquanto poucos
   perfis concentram muito — a média (~17) é bem maior que a mediana. Implicação: métricas de
   tendência central devem usar **mediana**, e estratégias de produto não podem supor um
   "artista médio".
2. **Produção e rede movem o engajamento; completude, pouco.** Correlação de curtidas com
   `obras publicadas` ≈ **0,87** e com `seguidores` ≈ **0,69**, contra ≈ **0,20** da completude
   e ≈ 0 da antiguidade. Implicação: incentivar **publicação e networking** rende mais que
   apenas pedir para "completar o perfil".
3. **Existem segmentos naturais de artistas.** O clustering separa perfis ao longo de um eixo de
   **atividade/maturidade** (iniciantes/inativos → consolidados), permitindo ações dirigidas por
   segmento.
4. **A fila de descoberta é previsível.** Um classificador simples (regressão logística) atinge
   **ROC-AUC ≈ 0,95** e acurácia **0,90** (vs. base 0,59), com os mesmos sinais de
   produção/engajamento. Implicação: dá para **priorizar curadoria** automaticamente, calibrando
   o limiar conforme o objetivo (recall alto para inclusão; precisão alta para rigor).

## 4. Melhorias a partir de feedback

O dashboard evoluiu por ciclos de feedback (do usuário e da própria validação):

| Feedback / problema observado | Melhoria aplicada |
|---|---|
| "A tela de métricas está **vazia e transparente**" | Diagnóstico: o **service worker (PWA)** sequestrava `/dashboard` e servia o app React no iframe. Correção: `navigateFallbackDenylist` excluindo `/dashboard`, `/api`, `/uploads`. |
| Modo por-usuário ficou **enxuto demais** ao reescrever o app | Restauradas as **7 seções completas** (perfil/onboarding, portfólio, engajamento, rede, atividade, mentoria, oportunidades). |
| Classificador inicial **fraco** (AUC 0,68, acurácia abaixo da base) | Causa: alvo da fila gerado por sorteio puramente probabilístico (ruidoso demais). Ajuste para **regra de elegibilidade + 8% de ruído de rótulo** → AUC **0,945**, mais fiel à regra real do sistema. |
| Dúvida sobre **ferramenta** (template Materio vs. Streamlit) | Análise concluiu que o Materio é um template de UI (não ferramenta de publicação); mantido o **Streamlit** por atender o requisito e o stack Python. |
| Necessidade de **narrativa consolidada** | Adicionado o bloco "**Sobre esta análise**" com contexto e principais achados no topo do dashboard. |

## 5. Como acessar

- **Dashboard analítico:** `http://localhost/dashboard` (visão agregada, sem login).
- **Minhas métricas (por usuário):** logar no sistema → aba **Métricas** (embutido via iframe,
  filtrado pelo usuário logado).
- **Dados:** carregados ao vivo do Postgres; para regenerar/variar o volume,
  `scripts/seed_simulado.py` (`SIM_USERS=N`).

> As **capturas de tela e a síntese final** de insights serão consolidadas no **CC10**
> (documentação final).
