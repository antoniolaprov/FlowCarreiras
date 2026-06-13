import streamlit as st
import plotly.express as px
import pandas as pd

if 'df_mapa_filtrado' not in st.session_state:
    st.error("Dados nao inicializados. Execute o dashboard a partir do arquivo app.py.")
    st.stop()

df_mapa = st.session_state['df_mapa_filtrado']

st.markdown("## Pagina 1 - Organizacao Profissional e Diagnostico de Campos")
st.markdown(
    "Esta secao apresenta o nivel de preenchimento dos registros contidos no dataset do Mapa Cultural "
    "de Pernambuco. O objetivo e mensurar estatisticamente quais dados estruturais estao ausentes na "
    "apresentacao publica dos agentes culturais analisados."
)

st.divider()

# METRICAS PRINCIPAIS
st.subheader("Indicadores de Estruturacao do Dataset")

total_agentes = len(df_mapa)
if total_agentes > 0:
    pct_estruturado = (df_mapa['perfil_minimamente_estruturado'].sum() / total_agentes) * 100
    pct_multidisciplinar = (df_mapa['perfil_multidisciplinar'].sum() / total_agentes) * 100
    media_areas = df_mapa['quantidade_areas'].mean()
else:
    pct_estruturado = pct_multidisciplinar = media_areas = 0

col1, col2, col3 = st.columns(3)
col1.metric(label="Total de Agentes Analisados", value=f"{total_agentes:,}")
col2.metric(label="Perfis Minimamente Estruturados (Contem descricao e area + tags ou funcoes)", value=f"{pct_estruturado:.1f}%")
col3.metric(label="Agentes com Atuacao Multidisciplinar", value=f"{pct_multidisciplinar:.1f}%")

st.divider()

# GRAFICO 1: BARRAS DE COBERTURA
st.subheader("Analise de Cobertura por Campo Declarado")
st.markdown(
    "Justificativa visual: O uso do comprimento de barras horizontais em escala comum de 0 a 100% "
    "permite a comparacao direta e precisa entre os indices de preenchimento de cada variavel."
)

if total_agentes > 0:
    campos = {
        "Descricao Curta": df_mapa['possui_descricao'].mean() * 100,
        "Tags de Interesse": df_mapa['possui_tags'].mean() * 100,
        "Funcoes Culturais": df_mapa['possui_funcoes'].mean() * 100,
        "Subareas Artisticas": df_mapa['possui_subareas'].mean() * 100
    }
    
    df_cobertura = pd.DataFrame(list(campos.items()), columns=['Campo', 'Percentual']).sort_values(by='Percentual', ascending=True)
    
    fig_cobertura = px.bar(
        df_cobertura,
        x='Percentual',
        y='Campo',
        orientation='h',
        text='Percentual',
        labels={'Percentual': 'Preenchimento (%)'},
        color='Percentual',
        color_continuous_scale=px.colors.sequential.Viridis
    )
    
    fig_cobertura.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
    fig_cobertura.update_layout(
        xaxis=dict(range=[0, 110]), 
        yaxis_title=None,
        coloraxis_showscale=False,
        height=300,
        margin=dict(l=0, r=50, t=10, b=10)
    )
    
    st.plotly_chart(fig_cobertura, use_container_width=True)
else:
    st.warning("Nenhum registro encontrado para os filtros selecionados.")

st.divider()

# GRAFICO 2: HISTOGRAMA DE MULTIDISCIPLINARIDADE
st.subheader("Distribuicao da Quantidade de Areas Declaradas")
st.markdown(
    "Justificativa visual: O histograma agrupa a variavel discreta em intervalos unitarios, explicitando "
    "graficamente a concentracao e a dispersao da atuacao multipla sem resumir o comportamento a uma media simples."
)

if total_agentes > 0:
    fig_histograma = px.histogram(
        df_mapa,
        x='quantidade_areas',
        nbins=int(df_mapa['quantidade_areas'].max() - df_mapa['quantidade_areas'].min() + 1),
        labels={'quantidade_areas': 'Quantidade de Areas', 'count': 'Numero de Agentes'},
        color_discrete_sequence=[px.colors.sequential.Viridis[4]]
    )
    
    fig_histograma.update_layout(
        yaxis_title="Numero de Agentes",
        xaxis=dict(tickmode='linear', tick0=1, dtick=1),
        height=300,
        margin=dict(l=0, r=10, t=10, b=10)
    )
    
    st.plotly_chart(fig_histograma, use_container_width=True)

st.divider()

# INFEENCIAS E INSIGHTS PARA O PRODUTO
st.markdown("### Implicacoes para o Modelo de Dados do Aplicativo")
st.text(
    "1. Demanda por preenchimento guiado: O dataset aponta que dados subjetivos (tags e funcoes) possuem baixissima "
    "taxa de preenchimento espontaneo (apenas 28.2% possuem tags e 10.6% possuem funcoes), sugerindo a necessidade "
    "de etapas obrigatorias ou assistidas no onboarding do produto.\n"
    "2. Flexibilidade cadastral: Dado que a maioria expressiva (63.5%) dos agentes declara mais de uma area de atuacao, "
    "o mapeamento de requisitos deve prever suporte a perfis multidisciplinares, evitando categorizacoes unicas e restritivas."
)