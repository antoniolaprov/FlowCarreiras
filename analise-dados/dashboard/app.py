import streamlit as st
import pandas as pd
import os

st.set_page_config(
    page_title="FlowCarreiras - Analise de Dados",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_data
def load_data():
    base_path = os.path.dirname(os.path.abspath(__file__))
    mapa_pe_path = os.path.normpath(os.path.join(base_path, "../data/processed/mapa_cultural_pe_agentes_enriquecido.csv"))
    contempart_path = os.path.normpath(os.path.join(base_path, "../data/processed/contempart_artists_enriquecido.csv"))
    
    df_mapa = pd.read_csv(mapa_pe_path)
    df_contempart = pd.read_csv(contempart_path)
    
    med_img = df_contempart['img_count'].median()
    med_fol = df_contempart['follower_count'].median()
    df_contempart['risco_estagnacao'] = (df_contempart['img_count'] >= med_img) & (df_contempart['follower_count'] < med_fol)
    
    return df_mapa, df_contempart

try:
    df_mapa, df_contempart = load_data()
    st.session_state['df_mapa'] = df_mapa
    st.session_state['df_contempart'] = df_contempart
except Exception as e:
    st.error(f"Erro ao carregar as bases de dados enriquecidas. Verifique os caminhos: {e}")
    st.stop()

st.sidebar.markdown("### Nota Metodologica")
st.sidebar.warning(
    "Este dashboard apresenta uma analise de dados analitica baseada exclusivamente em datasets publicos "
    "extraidos da internet (Mapa Cultural de PE e contempArt). Nao possui relacao ou integracao direta "
    "com a aplicacao ou banco de dados do FlowCarreiras, servindo apenas como suporte para compreensao "
    "de dores, estatisticas e geracao de insights sobre o ecossistema cultural."
)

st.sidebar.title("Filtros Avancados")

st.sidebar.subheader("Mapa Cultural PE")
areas_disponiveis = sorted(df_mapa['termos_areas'].dropna().unique())
areas_selecionadas = st.sidebar.multiselect("Area Artistica", options=areas_disponiveis)

perfil_estruturado_filtro = st.sidebar.checkbox("Filtrar por perfis minimamente estruturados")

st.sidebar.subheader("Dataset contempArt")
risco_estagnacao = st.sidebar.checkbox("Filtrar por alto volume e baixa visibilidade")

df_mapa_filtrado = df_mapa.copy()
df_contempart_filtrado = df_contempart.copy()

if areas_selecionadas:
    df_mapa_filtrado = df_mapa_filtrado[df_mapa_filtrado['termos_areas'].isin(areas_selecionadas)]

if perfil_estruturado_filtro:
    df_mapa_filtrado = df_mapa_filtrado[df_mapa_filtrado['perfil_minimamente_estruturado'] == True]

if risco_estagnacao:
    df_contempart_filtrado = df_contempart_filtrado[df_contempart_filtrado['risco_estagnacao'] == True]

st.session_state['df_mapa_filtrado'] = df_mapa_filtrado
st.session_state['df_contempart_filtrado'] = df_contempart_filtrado

st.sidebar.divider()
st.sidebar.markdown("### Navegacao")

paginas = {
    "1. Organizacao Profissional": "page1_onboarding.py",
    "2. Categorias do Ecossistema": "page2_ecossistema.py",
    "3. Presenca & Portfolio Digital": "page3_presenca.py",
    "4. Visibilidade & Exposicao Justa": "page4_exposicao.py",
    "5. Aplicacao no Produto & Limites": "page5_decisoes.py"
}

opcao_navegacao = st.sidebar.radio("Ir para a secao:", list(paginas.keys()))

base_path_views = os.path.dirname(os.path.abspath(__file__))
nome_arquivo_visao = paginas[opcao_navegacao]
script_pagina = os.path.normpath(os.path.join(base_path_views, "views", nome_arquivo_visao))

if os.path.exists(script_pagina):
    exec(open(script_pagina, encoding="utf-8").read())
else:
    st.error(f"O arquivo nao foi encontrado no diretorio: {script_pagina}")