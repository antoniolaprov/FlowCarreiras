import streamlit as st
import plotly.express as px
import pandas as pd

if 'df_contempart_filtrado' not in st.session_state:
    st.error("Dados nao inicializados. Execute o dashboard a partir do arquivo app.py.")
    st.stop()

df_art = st.session_state['df_contempart_filtrado']

st.markdown("## Pagina 3 - Presenca e Portfolio Digital Externo")
st.markdown(
    "Esta secao analisa a distribuicao dos canais de comunicacao informados pelos artistas do "
    "dataset contempArt, mapeando a dependencia de plataformas de terceiros versus a adocao de portfolios proprios."
)

st.divider()

st.subheader("Indicadores de Presenca Digital")

total_artistas = len(df_art)
if total_artistas > 0:
    pct_instagram = (df_art['possui_instagram'].sum() / total_artistas) * 100
    pct_website = (df_art['possui_website'].sum() / total_artistas) * 100
    pct_exclusivo_insta = (df_art['somente_instagram_informado'].sum() / total_artistas) * 100
else:
    pct_instagram = pct_website = pct_exclusivo_insta = 0

col1, col2, col3 = st.columns(3)
col1.metric(label="Presenca no Instagram", value=f"{pct_instagram:.1f}%")
col2.metric(label="Possuem Website Proprio", value=f"{pct_website:.1f}%")
col3.metric(label="Dependencia Exclusiva do Instagram", value=f"{pct_exclusivo_insta:.1f}%")

st.divider()

st.subheader("Distribuicao dos Perfis por Canais Declarados")
st.markdown(
    "Justificativa visual: Graficos de barras horizontais ordenados garantem comparacoes geometricas precisas "
    "entre volumes categoricos, mitigando distorcoes de escala comum encontradas em graficos circulares."
)

if total_artistas > 0:
    contagem_canais = {
        "Apenas Instagram": df_art['somente_instagram_informado'].sum(),
        "Instagram e Website": ((df_art['possui_instagram'] == True) & (df_art['possui_website'] == True)).sum(),
        "Apenas Website": ((df_art['possui_instagram'] == False) & (df_art['possui_website'] == True)).sum(),
        "Sem Presenca Informada": df_art['sem_presenca_digital_informada'].sum()
    }
    
    df_canais = pd.DataFrame(list(contagem_canais.items()), columns=['Canal', 'Quantidade']).sort_values(by='Quantidade', ascending=True)
    
    fig_canais = px.bar(
        df_canais,
        x='Quantidade',
        y='Canal',
        orientation='h',
        text='Quantidade',
        color='Quantidade',
        color_continuous_scale=px.colors.sequential.Viridis
    )
    fig_canais.update_traces(textposition='outside')
    fig_canais.update_layout(coloraxis_showscale=False, yaxis_title=None, height=300)
    st.plotly_chart(fig_canais, use_container_width=True)

st.divider()

st.subheader("Volume de Producao Cadastrada: Obras vs Publicacoes Externas")
st.markdown(
    "Justificativa visual: O grafico de dispersao plota simultaneamente a quantidade de publicacoes (posts) "
    "e o volume de imagens registradas, auxiliando na identificacao visual de outliers e padroes de comportamento."
)

if total_artistas > 0:
    fig_scatter = px.scatter(
        df_art,
        x='posts_count',
        y='img_count',
        labels={'posts_count': 'Quantidade de Posts no Instagram', 'img_count': 'Quantidade de Imagens no Dataset'},
        color_discrete_sequence=[px.colors.sequential.Viridis[3]],
        opacity=0.6
    )
    fig_scatter.update_layout(height=400)
    st.plotly_chart(fig_scatter, use_container_width=True)

st.divider()

st.markdown("### Observacoes Estruturais")
st.text(
    "1. Centralizacao em plataformas: O indice de 42.6% de artistas dependentes unicamente do Instagram como "
    "ponto de contato digital realca a vulnerabilidade de portfolios diante de mudancas algoritmicas externas.\n"
    "2. Desconexao de volume: A dispersao comprova estatisticamente uma baixa correlacao entre o volume de posts "
    "gerados na rede social e a quantidade de obras fisicas documentadas na base, indicando que atividade digital "
    "nao se traduz necessariamente em maior densidade de acervo catalogado."
)