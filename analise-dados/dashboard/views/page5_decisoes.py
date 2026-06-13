import streamlit as st

if 'df_contempart_filtrado' not in st.session_state or 'df_mapa_filtrado' not in st.session_state:
    st.error("Dados nao inicializados. Execute o dashboard a partir do arquivo app.py.")
    st.stop()

st.markdown("## Pagina 5 - Aplicacao no Produto e Limites da Analise")
st.markdown(
    "Esta secao consolida as tomadas de decisao estrategicas derivadas das analises dos datasets publicos, "
    "mapeia os limites estatisticos observados e propoem indicadores futuros para o ecossistema."
)

st.divider()

st.subheader("Decisoes de Produto Apoiadas pelos Dados")
st.text(
    "1. Mecanismo de Onboarding: Implementacao de fluxos assistidos para o preenchimento de tags, funcoes "
    "e subareas, combatendo a lacuna de definicao de perfil identificada no dataset do Mapa Cultural PE.\n"
    "2. Arquitetura Multidisciplinar: Suporte nativo a selecao de multiplas areas concomitantes no cadastro, "
    "respeitando a taxa de 63.5% de agentes multidisciplinares mensurada na base.\n"
    "3. Exposicao Justa: Desenvolvimento de algoritmos de recomendacao e busca que considerem o preenchimento "
    "estrutural do perfil e o volume de acervo documentado, em detrimento de metricas de popularidade externa "
    "(seguidores e curtidas), mitigando a concentracao de alcance observada no dataset contempArt.\n"
    "4. Independencia de Portfolio: Oferta de uma pagina publica de portfolio unificada, reduzindo a "
    "dependencia exclusiva de plataformas de terceiros para 42.6% dos artistas que nao possuem website."
)

st.divider()

st.subheader("Limitacoes Mapeadas dos Datasets")
st.text(
    "1. Desconexao de Contexto: As bases de dados representam realidades e recortes geograficos totalmente "
    "distintos (Agentes culturais de Pernambuco versus artistas vinculados a escolas de arte alemas). As bases "
    "foram analisadas separadamente e nao devem ser fundidas.\n"
    "2. Ausencia de Variaveis Comportamentais: O dataset do Mapa Cultural PE nao expoem variaveis sobre localizacao municipal "
    "especifica no recorte utilizado, demandas por mentoria ou interacao real entre usuarios.\n"
    "3. Restricao de Escopo do contempArt: Os dados de redes sociais refletem um nicho europeu especifico e nao "
    "mapeiam o comportamento de engajamento do mercado de arte brasileiro.\n"
    "4. Natureza das Conexoes: Graficos de rede ou calculos de similaridade representam proximidade matematica "
    "por metadados compartilhados, nao correspondendo a lacos sociais reais ou classificacao de qualidade artistica."
)

st.divider()

st.subheader("Indicadores Futuros de Acompanhamento")
st.text(
    "1. Taxa de completude media dos perfis ativos na plataforma.\n"
    "2. Percentual de usuarios em risco de estagnacao (alto volume de obras cadastradas com zero interacoes).\n"
    "3. Proporcao de sessoes de mentoria iniciadas por meio de correspondencia de tags de subareas.\n"
    "4. Indice de Gini ou curva de concentracao de visualizacoes dentro do catalogo para afericao de exposicao justa."
)