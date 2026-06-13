import streamlit as st
import plotly.express as px
import pandas as pd
import numpy as np

if 'df_mapa_filtrado' not in st.session_state:
    st.error("Dados nao inicializados. Execute o dashboard a partir do arquivo app.py.")
    st.stop()

df_mapa = st.session_state['df_mapa_filtrado']

st.markdown("## Pagina 2 - Categorias do Ecossistema e Associacoes")
st.markdown(
    "Esta secao analisa a distribuicao das categorias declaradas pelos agentes culturais no dataset do "
    "Mapa Cultural de Pernambuco. O foco e identificar quais as areas mais frequentes e como as combinacoes "
    "de termos ocorrem simultaneamente nos registros."
)

st.divider()

def expandir_coluna_multivalor(df, coluna):
    """Explode uma coluna que contem strings separadas por ' | ' em uma lista de frequencias."""
    serie_expandida = df[coluna].dropna().astype(str).str.split(r'\s*\|\s*')
    todos_termos = [termo.strip() for sublista in serie_expandida for termo in sublista if termo.strip()]
    return pd.Series(todos_termos)

# ==============================================================================
# GRAFICO 1: BARRAS ORDENADAS DE AREAS E TAGS
# ==============================================================================
st.subheader("Distribuicao de Frequencia das Categorias")
st.markdown(
    "Justificativa visual: A ordenacao decrescente reduz o esforco de busca visual e torna nitidas "
    "as diferencas entre multiplas categorias, sendo mais legivel que graficos de setores para grande volume de dados."
)

if len(df_mapa) > 0:
    col_graf1, col_graf2 = st.columns(2)
    
    with col_graf1:
        st.markdown("**Areas Culturais mais Frequentes**")
        areas_expandidas = expandir_coluna_multivalor(df_mapa, 'termos_areas')
        if not areas_expandidas.empty:
            df_areas = areas_expandidas.value_counts().reset_index()
            df_areas.columns = ['Area', 'Contagem']
            
            fig_areas = px.bar(
                df_areas.head(15),
                x='Contagem',
                y='Area',
                orientation='h',
                color='Contagem',
                color_continuous_scale=px.colors.sequential.Viridis,
                labels={'Contagem': 'Numero de Ocorrencias'}
            )
            fig_areas.update_layout(yaxis_title=None, coloraxis_showscale=False, height=400)
            st.plotly_chart(fig_areas, use_container_width=True)
        else:
            st.text("Nao ha dados de areas preenchidos para os filtros selecionados.")
            
    with col_graf2:
        st.markdown("**Tags mais Frequentes nos Perfis**")
        tags_expandidas = expandir_coluna_multivalor(df_mapa, 'termos_tags')
        if not tags_expandidas.empty:
            df_tags = tags_expandidas.value_counts().reset_index()
            df_tags.columns = ['Tag', 'Contagem']
            
            fig_tags = px.bar(
                df_tags.head(15),
                x='Contagem',
                y='Tag',
                orientation='h',
                color='Contagem',
                color_continuous_scale=px.colors.sequential.Viridis,
                labels={'Contagem': 'Numero de Ocorrencias'}
            )
            fig_tags.update_layout(yaxis_title=None, coloraxis_showscale=False, height=400)
            st.plotly_chart(fig_tags, use_container_width=True)
        else:
            st.text("Nao ha dados de tags preenchidos para os filtros selecionados.")

st.divider()

# ==============================================================================
# GRAFICO 2: MATRIZ DE COOCORRENCIA (HEATMAP)
# ==============================================================================
st.subheader("Matriz de Coocorrencia: Quais categorias aparecem juntas?")
st.markdown(
    "Justificativa visual: O uso da posicao cartesiana combinada a intensidade de cor permite a comparacao "
    "simultanea de multiplos pares de variaveis, destacando agrupamentos recorrentes sem poluir a interface."
)

if len(df_mapa) > 0:
    # Filtro para as top areas para nao sobrecarregar o heatmap
    areas_expandidas = expandir_coluna_multivalor(df_mapa, 'termos_areas')
    
    if not areas_expandidas.empty:
        top_areas = areas_expandidas.value_counts().head(8).index.tolist()
        
        # Inicializa matriz vazia
        matrix = pd.DataFrame(0, index=top_areas, columns=top_areas)
        
        # Calcula as interseccoes
        for _, row in df_mapa['termos_areas'].dropna().astype(str).to_frame().iterrows():
            lista_areas = [a.strip() for a in row['termos_areas'].split('|') if a.strip() in top_areas]
            for i in range(len(lista_areas)):
                for j in range(len(lista_areas)):
                    matrix.loc[lista_areas[i], lista_areas[j]] += 1
                    
        fig_heatmap = px.imshow(
            matrix,
            text_auto=True,
            labels=dict(x="Area Cultural", y="Area Cultural", color="Coocorrencias"),
            color_continuous_scale=px.colors.sequential.Viridis
        )
        fig_heatmap.update_layout(height=450)
        st.plotly_chart(fig_heatmap, use_container_width=True)
    else:
        st.text("Dados insuficientes para geracao da matriz de coocorrencia.")

st.divider()

# INTERPRETACOES DO REPOSITORIO
st.markdown("### Observacoes Estatisticas")
st.text(
    "1. Interseccao de saberes: A analise do dataset revela que o termo Producao Cultural aparece frequentemente "
    "combinado com Musica, Culturas Populares e Gestao Cultural. Isso demonstra empiricamente a sobreposicao "
    "de funcoes no arranjo produtivo local.\n"
    "2. Risco de segmentacao: O fato de as categorias se concentrarem fortemente em clusters especificos reforca "
    "que ferramentas de busca ou catalogos baseados exclusivamente em filtros simples podem isolar subareas de menor "
    "densidade, caso nao haja cruzamento taxonomico automatizado."
)