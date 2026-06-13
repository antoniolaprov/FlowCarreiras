import streamlit as st
import plotly.express as px
import pandas as pd
import numpy as np

if 'df_contempart_filtrado' not in st.session_state:
    st.error("Dados nao inicializados. Execute o dashboard a partir do arquivo app.py.")
    st.stop()

df_art = st.session_state['df_contempart_filtrado']

st.markdown("## Pagina 4 - Visibilidade e Exposicao Justa")
st.markdown(
    "Esta secao investiga a distribuicao de alcance do dataset contempArt, avaliando a assimetria "
    "nas metricas de seguidores, a relacao entre volume e engajamento e a concentracao de visibilidade."
)

st.divider()

st.subheader("Indicadores de Concentracao")

total_artistas = len(df_art)
if total_artistas > 0 and 'follower_count' in df_art.columns:
    seguidores_ordenados = df_art['follower_count'].dropna().sort_values(ascending=False)
    total_seguidores = seguidores_ordenados.sum()
    
    top_10_corte = int(np.ceil(0.10 * len(seguidores_ordenados)))
    top_20_corte = int(np.ceil(0.20 * len(seguidores_ordenados)))
    
    pct_top10 = (seguidores_ordenados.head(top_10_corte).sum() / total_seguidores) * 100 if total_seguidores > 0 else 0
    pct_top20 = (seguidores_ordenados.head(top_20_corte).sum() / total_seguidores) * 100 if total_seguidores > 0 else 0
    
    mediana_seguidores = df_art['follower_count'].median()
    total_estagnados = df_art['risco_estagnacao'].sum()
else:
    pct_top10 = pct_top20 = mediana_seguidores = total_estagnados = 0

col1, col2, col3, col4 = st.columns(4)
col1.metric(label="Mediana de Seguidores", value=f"{mediana_seguidores:,.0f}")
col2.metric(label="Concentracao nos 10% Maiores", value=f"{pct_top10:.1f}%")
col3.metric(label="Concentracao nos 20% Maiores", value=f"{pct_top20:.1f}%")
col4.metric(label="Perfis com Alto Volume e Baixa Visibilidade", value=f"{total_estagnados}")

st.divider()

st.subheader("Distribuicao de Seguidores em Escala Logaritmica")
st.markdown(
    "Justificativa visual: A escala logaritmica reduz a distorcao causada por poucos perfis com contagens "
    "extremamente altas, permitindo visualizar a forma da distribuicao real da maioria dos artistas."
)

if total_artistas > 0 and df_art['follower_count'].notna().sum() > 0:
    df_log = df_art.copy()
    df_log['follower_count_log'] = np.log10(df_log['follower_count'] + 1)
    
    fig_hist_log = px.histogram(
        df_log,
        x='follower_count_log',
        labels={'follower_count_log': 'Seguidores (Escala Log10)', 'count': 'Numero de Artistas'},
        color_discrete_sequence=[px.colors.sequential.Viridis[2]]
    )
    fig_hist_log.update_layout(yaxis_title="Numero de Artistas", height=300)
    st.plotly_chart(fig_hist_log, use_container_width=True)

st.divider()

st.subheader("Scatterplot com Tendencia: Volume Registrado vs Visibilidade")
st.markdown(
    "Justificativa visual: A posicao bivariada evidencia associacoes e dispersao. A linha de tendencia "
    "linear resume o comportamento geral sem ocultar a variacao individual dos registros."
)

if total_artistas > 0:
    df_clean = df_art.dropna(subset=['posts_count', 'follower_count'])
    if len(df_clean) > 0:
        fig_scatter_trend = px.scatter(
            df_clean,
            x='posts_count',
            y='follower_count',
            trendline='ols',
            labels={'posts_count': 'Quantidade de Posts', 'follower_count': 'Quantidade de Seguidores'},
            color_discrete_sequence=[px.colors.sequential.Viridis[4]],
            opacity=0.6
        )
        fig_scatter_trend.update_layout(height=400)
        st.plotly_chart(fig_scatter_trend, use_container_width=True)

st.divider()

st.subheader("Quadrantes de Visibilidade e Volume de Acervo")
st.markdown(
    "Justificativa visual: A segmentacao por quadrantes divide duas medidas continuas com base em suas medianas, "
    "tornando imediatamente identificaveis os subgrupos subexpostos ou superexpostos."
)

if total_artistas > 0:
    med_img = df_art['img_count'].median()
    med_fol = df_art['follower_count'].median()
    
    df_quadrantes = df_art.copy()
    
    def rotular_quadrante(row):
        if row['img_count'] >= med_img and row['follower_count'] >= med_fol:
            return 'Alto Volume / Alta Visibilidade'
        elif row['img_count'] >= med_img and row['follower_count'] < med_fol:
            return 'Alto Volume / Baixa Visibilidade'
        elif row['img_count'] < med_img and row['follower_count'] >= med_fol:
            return 'Baixo Volume / Alta Visibilidade'
        else:
            return 'Baixo Volume / Baixa Visibilidade'
            
    df_quadrantes['Quadrante'] = df_quadrantes.apply(rotular_quadrante, axis=1)
    
    fig_quad = px.scatter(
        df_quadrantes,
        x='img_count',
        y='follower_count',
        color='Quadrante',
        labels={'img_count': 'Volume de Imagens', 'follower_count': 'Seguidores'},
        color_discrete_map={
            'Alto Volume / Alta Visibilidade': px.colors.sequential.Viridis[0],
            'Alto Volume / Baixa Visibilidade': px.colors.sequential.Viridis[3],
            'Baixo Volume / Alta Visibilidade': px.colors.sequential.Viridis[5],
            'Baixo Volume / Baixa Visibilidade': px.colors.sequential.Viridis[8]
        },
        opacity=0.7
    )
    fig_quad.add_hline(y=med_fol, line_dash="dash", line_color="gray")
    fig_quad.add_vline(x=med_img, line_dash="dash", line_color="gray")
    fig_quad.update_layout(height=450)
    st.plotly_chart(fig_quad, use_container_width=True)

st.divider()

st.markdown("### Observacoes de Distribuicao")
st.text(
    "1. Assimetria e desigualdade: Os calculos demonstram uma acentuada concentracao de audiencia, onde "
    "os 10% maiores perfis detem 44.6% do alcance acumulado, enquanto a mediana geral e de apenas 302 seguidores.\n"
    "2. Oportunidade de descoberta: O quadrante Alto Volume e Baixa Visibilidade isola com precisao os artistas "
    "que possuem densidade de portfolio documental, mas nao encontram correspondencia em termos de alcance algoritmico "
    "nas redes externas."
)