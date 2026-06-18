"""
FlowCarreiras — Dashboard Streamlit.

Dois modos no mesmo serviço:
  • COM ?token=<JWT> (ou ?email=) → "Minhas Métricas": visão do próprio usuário,
    usada embutida na aba /metricas do sistema (iframe).
  • SEM token → "Dashboard Analítico": visão agregada dos 400 perfis simulados,
    com filtros e abas — comunica os achados da análise.

Camada de estilo (Gestalt): paleta única, cores fixas por categoria recorrente
(Semelhança), figuras com fundo transparente e baixo ruído (Figura-fundo),
KPIs e blocos agrupados em containers (Região comum/Fechamento) e um helper
`estilizar()` que padroniza título, fontes, margens, eixos e hover (Hierarquia).
"""

import base64
import os

import jwt
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_recall_curve, precision_score, recall_score,
                             roc_auc_score, roc_curve)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sqlalchemy import create_engine, text

st.set_page_config(page_title="Métricas — FlowCarreiras", page_icon="📊", layout="wide")

# ---------------------------------------------------------------------------
# Sistema de cores (Semelhança + Acessibilidade)
# Uma cor de marca para destaque; paleta categórica distinguível; escalas
# sequencial (magnitude) e divergente (correlação). Cada categoria recorrente
# tem cor FIXA, reutilizada em todos os gráficos.
# ---------------------------------------------------------------------------
TEMPLATE = "plotly_dark"
COR_DESTAQUE = "#7c3aed"            # roxo da marca — variável principal (engajamento)
PALETA_CAT = ["#7c3aed", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#94a3b8"]
ESCALA_SEQ = "Purples"             # magnitude
ESCALA_DIV = "RdBu_r"              # correlação (centrada em 0)
SEQ = px.colors.sequential.Purples

COR_FILA = {"Entrou": "#10b981", "Não entrou": "#94a3b8"}
COR_STATUS_OBRA = {"PUBLICADA": "#7c3aed", "RASCUNHO": "#f59e0b"}
COR_STATUS_MENTORIA = {"ATIVA": "#10b981", "ENCERRADA": "#94a3b8", "CANCELADA": "#ef4444"}

FONTE = "Inter, system-ui, -apple-system, sans-serif"
COR_TEXTO = "#cbd5e1"
COR_TITULO = "#f1f5f9"
COR_GRID = "rgba(148,163,184,0.12)"


def estilizar(fig, altura=None, grid_y=False):
    """Padroniza uma figura Plotly: baixo ruído, fundo transparente, hierarquia."""
    fig.update_layout(
        font=dict(family=FONTE, size=13, color=COR_TEXTO),
        title_font=dict(family=FONTE, size=16, color=COR_TITULO),
        margin=dict(t=50, b=28, l=12, r=12),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0, title_text=""),
        hoverlabel=dict(font_size=12, font_family=FONTE),
        colorway=PALETA_CAT,
    )
    fig.update_xaxes(showgrid=False, zeroline=False, showline=False)
    fig.update_yaxes(showgrid=grid_y, gridcolor=COR_GRID, zeroline=False, showline=False)
    if altura:
        fig.update_layout(height=altura)
    return fig


@st.cache_resource
def get_engine():
    h = os.getenv("DB_HOST", "db"); p = os.getenv("DB_PORT", "5432")
    n = os.getenv("DB_NAME", "flowcarreiras")
    u = os.getenv("DB_USER", "postgres"); pw = os.getenv("DB_PASSWORD", "postgres")
    return create_engine(f"postgresql+psycopg2://{u}:{pw}@{h}:{p}/{n}", pool_pre_ping=True)


def q(sql, **params):
    with get_engine().connect() as c:
        return pd.read_sql(text(sql), c, params=params)


def scalar(sql, **params):
    df = q(sql, **params)
    return df.iloc[0, 0] if not df.empty else 0


def email_do_token(token):
    try:
        key = base64.b64decode(os.getenv("JWT_SECRET", ""))
        return jwt.decode(token, key, algorithms=["HS256"],
                          options={"verify_aud": False}).get("sub")
    except Exception:
        return None


# =====================================================================
# Carga da tabela analítica (1 linha por perfil simulado)
# =====================================================================
@st.cache_data(ttl=300)
def carregar_perfis():
    base = q("""SELECT p.id AS perfil_id, u.id AS usuario_id, u.nome, u.data_criacao,
                       p.percentual_completude, p.cidade,
                       p.area_artistica_principal AS area_artistica,
                       (p.data_entrada_fila IS NOT NULL) AS entrou_fila,
                       p.bio, p.foto_perfil
                FROM perfis_artistas p JOIN usuarios u ON u.id = p.usuario_id
                WHERE u.email LIKE :s""", s="%@sim.flowcarreiras.dev")
    if base.empty:
        return base

    aggs = {
        "obras": ("""SELECT artista_id AS perfil_id, count(*) AS n_obras,
                     count(*) FILTER (WHERE status='PUBLICADA') AS n_obras_publicadas
                     FROM obras GROUP BY artista_id""", "perfil_id"),
        "curt": ("""SELECT o.artista_id AS perfil_id, count(*) AS curtidas_recebidas
                    FROM curtidas c JOIN obras o ON o.id=c.obra_id GROUP BY o.artista_id""", "perfil_id"),
        "com": ("""SELECT o.artista_id AS perfil_id, count(*) AS comentarios_recebidos
                   FROM comentarios cm JOIN obras o ON o.id=cm.obra_id GROUP BY o.artista_id""", "perfil_id"),
        "texp": ("SELECT perfil_id, count(*) AS n_tags_expertise FROM perfil_tags_expertise GROUP BY perfil_id", "perfil_id"),
        "tnec": ("SELECT perfil_id, count(*) AS n_tags_necessidade FROM perfil_tags_necessidade GROUP BY perfil_id", "perfil_id"),
        "seg": ("SELECT seguido_id AS usuario_id, count(*) AS seguidores FROM seguidores GROUP BY seguido_id", "usuario_id"),
        "sego": ("SELECT seguidor_id AS usuario_id, count(*) AS seguindo FROM seguidores GROUP BY seguidor_id", "usuario_id"),
    }
    df = base
    for sql, key in aggs.values():
        df = df.merge(q(sql), on=key, how="left")

    cont = ["n_obras", "n_obras_publicadas", "curtidas_recebidas", "comentarios_recebidos",
            "n_tags_expertise", "n_tags_necessidade", "seguidores", "seguindo"]
    df[cont] = df[cont].fillna(0).astype(int)
    df["tem_bio"] = (df["bio"].fillna("").astype(str).str.len() > 0).astype(int)
    df["tem_foto"] = (df["foto_perfil"].fillna("").astype(str).str.len() > 0).astype(int)
    df["idade_conta_dias"] = (pd.Timestamp.now() - pd.to_datetime(df["data_criacao"])).dt.days
    df["entrou_fila"] = df["entrou_fila"].astype(int)
    df["area_artistica"] = df["area_artistica"].fillna("Não informado")
    df["cidade"] = df["cidade"].fillna("Não informado")
    return df.drop(columns=["bio", "foto_perfil", "data_criacao"])


@st.cache_data(ttl=300)
def carregar_eventos():
    """Eventos com timestamp para as séries temporais (cadastros, curtidas, seguidores)."""
    s = "%@sim.flowcarreiras.dev"
    cad = q("SELECT id AS usuario_id, data_criacao FROM usuarios WHERE email LIKE :s", s=s)
    curt = q("""SELECT o.artista_id AS perfil_id, c.data_criacao
                FROM curtidas c JOIN obras o ON o.id=c.obra_id
                JOIN perfis_artistas p ON p.id=o.artista_id JOIN usuarios u ON u.id=p.usuario_id
                WHERE u.email LIKE :s""", s=s)
    com = q("""SELECT o.artista_id AS perfil_id, cm.data_criacao
               FROM comentarios cm JOIN obras o ON o.id=cm.obra_id
               JOIN perfis_artistas p ON p.id=o.artista_id JOIN usuarios u ON u.id=p.usuario_id
               WHERE u.email LIKE :s""", s=s)
    seg = q("""SELECT s.seguido_id AS usuario_id, s.data_criacao
               FROM seguidores s JOIN usuarios u ON u.id=s.seguido_id
               WHERE u.email LIKE :s""", s=s)
    return cad, curt, com, seg


# =====================================================================
# MODO 1 — Minhas Métricas (por usuário)
# =====================================================================
def pagina_usuario(usuario):
    uid = usuario["id"]
    perfil_df = q("SELECT * FROM perfis_artistas WHERE usuario_id = :uid", uid=uid)
    perfil = perfil_df.iloc[0] if not perfil_df.empty else None
    pid = perfil["id"] if perfil is not None else None

    info = q("SELECT nome, email, data_criacao, ativo FROM usuarios WHERE id = :uid", uid=uid).iloc[0]
    dias = (pd.Timestamp.now() - pd.to_datetime(info["data_criacao"])).days
    st.title(f"📊 Métricas de {info['nome']}")
    cab = st.columns([3, 1])
    cab[0].caption(f"✉️ {info['email']} · conta há {dias} dias · "
                   f"{'🟢 ativa' if info['ativo'] else '🔴 inativa'}")
    if perfil is not None and perfil.get("url_publica"):
        cab[1].caption(f"🔗 /portfolio/{perfil['url_publica']}")
    if perfil is None:
        st.warning("Usuário sem perfil de artista — métricas indisponíveis.")
        return

    total = scalar("SELECT count(*) FROM obras WHERE artista_id=:p", p=pid)
    pub = scalar("SELECT count(*) FROM obras WHERE artista_id=:p AND status='PUBLICADA'", p=pid)
    curt = scalar("SELECT count(*) FROM curtidas c JOIN obras o ON o.id=c.obra_id WHERE o.artista_id=:p", p=pid)
    com = scalar("SELECT count(*) FROM comentarios cm JOIN obras o ON o.id=cm.obra_id WHERE o.artista_id=:p", p=pid)
    seg = scalar("SELECT count(*) FROM seguidores WHERE seguido_id=:u", u=uid)
    sego = scalar("SELECT count(*) FROM seguidores WHERE seguidor_id=:u", u=uid)
    curt_d = scalar("SELECT count(*) FROM curtidas WHERE usuario_id=:u", u=uid)
    com_f = scalar("SELECT count(*) FROM comentarios WHERE autor_id=:u", u=uid)
    comp = int(perfil["percentual_completude"])

    # KPIs agrupados (Região comum / Fechamento)
    st.subheader("Visão geral")
    with st.container(border=True):
        k = st.columns(6)
        k[0].metric("Completude", f"{comp}%")
        k[1].metric("Obras", int(total), help=f"{int(pub)} publicadas · {int(total)-int(pub)} rascunhos")
        k[2].metric("Curtidas recebidas", int(curt))
        k[3].metric("Comentários recebidos", int(com))
        k[4].metric("Seguidores", int(seg))
        k[5].metric("Seguindo", int(sego))
    st.divider()

    # --- Comparação com a plataforma (benchmark) ---
    pop = carregar_perfis()
    if not pop.empty:
        st.subheader("📈 Comparação com a plataforma")

        def _pct(valor, serie):
            return float((serie < valor).mean() * 100) if len(serie) else 0.0

        with st.container(border=True):
            b = st.columns(3)
            b[0].metric("Completude", f"{comp}%")
            b[0].caption(f"melhor que **{_pct(comp, pop['percentual_completude']):.0f}%** dos artistas")
            b[1].metric("Curtidas recebidas", int(curt))
            b[1].caption(f"melhor que **{_pct(curt, pop['curtidas_recebidas']):.0f}%** dos artistas")
            b[2].metric("Seguidores", int(seg))
            b[2].caption(f"melhor que **{_pct(seg, pop['seguidores']):.0f}%** dos artistas")
        st.caption("Percentil do artista frente aos demais perfis da plataforma.")
        st.divider()

    # --- Perfil & Onboarding ---
    st.subheader("👤 Perfil & Onboarding")
    c1, c2 = st.columns([1, 1])
    gauge = go.Figure(go.Indicator(
        mode="gauge+number", value=comp, number={"suffix": "%"},
        gauge={"axis": {"range": [0, 100], "tickcolor": COR_TEXTO}, "bar": {"color": COR_DESTAQUE},
               "bgcolor": "rgba(148,163,184,0.10)", "borderwidth": 0},
        title={"text": "Completude do perfil"}))
    c1.plotly_chart(estilizar(gauge, altura=240), use_container_width=True)
    etapas = {"Área": perfil["status_etapa_area"], "Cidade": perfil["status_etapa_cidade"],
              "Bio": perfil["status_etapa_bio"], "Tags": perfil["status_etapa_tags"],
              "Foto": perfil["status_etapa_foto"], "Links": perfil["status_etapa_links"]}
    icone = {"CONCLUIDA": "✅", "PULADA": "⏭️", "PENDENTE": "⬜"}
    with c2.container(border=True):
        st.markdown("**Etapas do onboarding**")
        for nome_e, s in etapas.items():
            st.markdown(f"{icone.get(s, '⬜')} {nome_e} — `{s}`")
        st.markdown(f"**Onboarding concluído:** {'Sim' if perfil['onboarding_concluido'] else 'Não'}")
    if perfil["data_entrada_fila"] is not None:
        st.success(f"🚀 Entrou na fila de descoberta em "
                   f"{pd.to_datetime(perfil['data_entrada_fila']).strftime('%d/%m/%Y')}")
    else:
        st.caption("Ainda não entrou na fila de descoberta.")
    st.divider()

    # --- Portfólio ---
    st.subheader("🎨 Portfólio")
    obras = q("SELECT id, titulo, status, tipo_midia, data_publicacao FROM obras WHERE artista_id=:p", p=pid)
    if obras.empty:
        st.info("Nenhuma obra cadastrada.")
    else:
        g = st.columns(3)
        dst = obras["status"].value_counts().reset_index(); dst.columns = ["status", "qtd"]
        g[0].plotly_chart(estilizar(px.bar(
            dst, x="status", y="qtd", text="qtd", title="Obras por status",
            color="status", color_discrete_map=COR_STATUS_OBRA).update_layout(
            showlegend=False, xaxis_title=None, yaxis_title="obras"), grid_y=True),
            use_container_width=True)
        dmid = obras["tipo_midia"].value_counts().reset_index(); dmid.columns = ["tipo", "qtd"]
        g[1].plotly_chart(estilizar(px.pie(
            dmid, names="tipo", values="qtd", hole=0.5, title="Tipo de mídia").update_traces(
            textposition="inside", textinfo="percent+label").update_layout(showlegend=False)),
            use_container_width=True)
        tags = q("""SELECT t.nome FROM obra_tags ot JOIN tags t ON t.id=ot.tag_id
                    JOIN obras o ON o.id=ot.obra_id WHERE o.artista_id=:p""", p=pid)
        if not tags.empty:
            dt = tags["nome"].value_counts().head(8).reset_index(); dt.columns = ["tag", "qtd"]
            g[2].plotly_chart(estilizar(px.bar(
                dt, x="qtd", y="tag", orientation="h", title="Tags mais usadas",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                yaxis={"categoryorder": "total ascending", "title": None}, xaxis_title="usos"), grid_y=False),
                use_container_width=True)
        pubs = obras.dropna(subset=["data_publicacao"]).copy()
        if not pubs.empty:
            pubs["mes"] = pd.to_datetime(pubs["data_publicacao"]).dt.to_period("M").dt.to_timestamp()
            serie = pubs.groupby("mes").size().reset_index(name="qtd")
            st.plotly_chart(estilizar(px.bar(
                serie, x="mes", y="qtd", title="Publicações ao longo do tempo",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                xaxis_title=None, yaxis_title="publicações"), grid_y=True),
                use_container_width=True)
    st.divider()

    # --- Engajamento recebido ---
    st.subheader("❤️ Engajamento recebido")
    with st.container(border=True):
        m = st.columns(3)
        m[0].metric("Curtidas recebidas", int(curt))
        m[1].metric("Comentários recebidos", int(com))
        m[2].metric("Média de curtidas / obra publicada", f"{(curt/pub) if pub else 0:.1f}")
    cA, cB = st.columns(2)
    rk = q("""SELECT o.titulo, count(c.id) AS curtidas FROM obras o
              LEFT JOIN curtidas c ON c.obra_id=o.id WHERE o.artista_id=:p
              GROUP BY o.id, o.titulo ORDER BY curtidas DESC LIMIT 8""", p=pid)
    if rk["curtidas"].sum() > 0:
        cA.plotly_chart(estilizar(px.bar(
            rk, x="curtidas", y="titulo", orientation="h", title="Obras mais curtidas",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            yaxis={"categoryorder": "total ascending", "title": None})), use_container_width=True)
    else:
        cA.info("Nenhuma curtida recebida ainda.")
    ct = q("""SELECT c.data_criacao FROM curtidas c JOIN obras o ON o.id=c.obra_id
              WHERE o.artista_id=:p ORDER BY c.data_criacao""", p=pid)
    if not ct.empty:
        ct["data"] = pd.to_datetime(ct["data_criacao"]).dt.date
        serie = ct.groupby("data").size().cumsum().reset_index(name="acumulado")
        cB.plotly_chart(estilizar(px.area(
            serie, x="data", y="acumulado", title="Curtidas acumuladas no tempo",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            xaxis_title=None, yaxis_title="curtidas"), grid_y=True), use_container_width=True)
    else:
        cB.info("Sem histórico de curtidas.")
    st.divider()

    # --- Rede ---
    st.subheader("🌐 Rede")
    with st.container(border=True):
        r = st.columns(3)
        r[0].metric("Seguidores", int(seg))
        r[1].metric("Seguindo", int(sego))
        r[2].metric("Razão seguidores/seguindo", f"{(seg/sego) if sego else float(seg):.2f}")
    sgr = q("SELECT data_criacao FROM seguidores WHERE seguido_id=:u ORDER BY data_criacao", u=uid)
    if not sgr.empty:
        sgr["data"] = pd.to_datetime(sgr["data_criacao"]).dt.date
        serie = sgr.groupby("data").size().cumsum().reset_index(name="acumulado")
        st.plotly_chart(estilizar(px.area(
            serie, x="data", y="acumulado", title="Crescimento de seguidores",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            xaxis_title=None, yaxis_title="seguidores"), grid_y=True), use_container_width=True)
    st.divider()

    # --- Atividade própria ---
    st.subheader("✍️ Minha atividade")
    with st.container(border=True):
        a = st.columns(3)
        a[0].metric("Curtidas que dei", int(curt_d))
        a[1].metric("Comentários que fiz", int(com_f))
        a[2].metric("Perfis que sigo", int(sego))
    st.divider()

    # --- Mentoria ---
    st.subheader("🤝 Mentoria")
    with st.container(border=True):
        im = st.columns(4)
        im[0].metric("Disponível p/ mentorar", "Sim" if perfil["disponivel_para_mentorar"] else "Não")
        im[1].metric("Perfil de mentor", "Configurado" if perfil["perfil_mentor_configurado"] else "Não")
        im[2].metric("Modalidade", perfil["modalidade_mentoria"] or "—")
        valor = perfil["valor_hora_mentoria"]
        im[3].metric("Valor/hora", "Gratuita" if perfil["mentoria_gratuita"]
                     else (f"R$ {float(valor):.2f}" if valor is not None else "—"))
    mentor = q("SELECT status, count(*) AS qtd FROM mentorias WHERE mentor_id=:p GROUP BY status", p=pid)
    art = q("SELECT status, count(*) AS qtd FROM mentorias WHERE artista_id=:p GROUP BY status", p=pid)
    cm = st.columns(2)
    if not mentor.empty:
        cm[0].plotly_chart(estilizar(px.bar(
            mentor, x="status", y="qtd", text="qtd", title="Como mentor",
            color="status", color_discrete_map=COR_STATUS_MENTORIA).update_layout(
            showlegend=False, xaxis_title=None, yaxis_title="mentorias"), grid_y=True),
            use_container_width=True)
    else:
        cm[0].info("Nenhuma mentoria como mentor.")
    if not art.empty:
        cm[1].plotly_chart(estilizar(px.bar(
            art, x="status", y="qtd", text="qtd", title="Como mentorado",
            color="status", color_discrete_map=COR_STATUS_MENTORIA).update_layout(
            showlegend=False, xaxis_title=None, yaxis_title="mentorias"), grid_y=True),
            use_container_width=True)
    else:
        cm[1].info("Nenhuma mentoria como mentorado.")
    msgs = scalar("""SELECT count(*) FROM mensagens_mentoria WHERE mentoria_id IN
                     (SELECT id FROM mentorias WHERE mentor_id=:p OR artista_id=:p)""", p=pid)
    st.caption(f"💬 Mensagens trocadas nas suas mentorias: **{int(msgs)}**")
    st.divider()

    # --- Oportunidades ---
    st.subheader("📢 Oportunidades")
    tn = scalar("SELECT count(*) FROM notificacoes_oportunidades WHERE perfil_id=:p", p=pid)
    li = scalar("SELECT count(*) FROM notificacoes_oportunidades WHERE perfil_id=:p AND lida=true", p=pid)
    with st.container(border=True):
        o = st.columns(3)
        o[0].metric("Recebe notificações", "Sim" if perfil["receber_notificacoes_oportunidades"] else "Não")
        o[1].metric("Notificações recebidas", int(tn))
        o[2].metric("Não lidas", int(tn) - int(li))


# =====================================================================
# MODO 2 — Dashboard Analítico (agregado)
# =====================================================================
FEATS_MODELO = ["percentual_completude", "n_obras", "n_obras_publicadas", "curtidas_recebidas",
                "comentarios_recebidos", "seguidores", "n_tags_expertise", "n_tags_necessidade",
                "idade_conta_dias", "tem_foto", "tem_bio"]
FEATS_CLUSTER = ["percentual_completude", "n_obras", "n_obras_publicadas", "curtidas_recebidas",
                 "comentarios_recebidos", "seguidores", "seguindo", "n_tags_expertise"]
LOG_COLS = ["n_obras", "n_obras_publicadas", "curtidas_recebidas", "comentarios_recebidos",
            "seguidores", "seguindo"]

DICIONARIO = [
    ("percentual_completude", "0–100", "Completude do perfil (fórmula do sistema)"),
    ("n_obras / n_obras_publicadas", "contagem", "Tamanho do portfólio"),
    ("curtidas_recebidas", "contagem", "Engajamento recebido nas obras"),
    ("comentarios_recebidos", "contagem", "Comentários nas obras"),
    ("seguidores / seguindo", "contagem", "Rede do artista"),
    ("n_tags_expertise / n_tags_necessidade", "contagem", "Tags do perfil"),
    ("idade_conta_dias", "dias", "Antiguidade da conta"),
    ("tem_bio / tem_foto", "0/1", "Indicadores de preenchimento"),
    ("area_artistica / cidade", "categórica", "Segmentação do artista"),
    ("entrou_fila", "0/1", "Alvo: entrou na fila de descoberta"),
]


def _logtransform(X):
    X = X.copy()
    for c in [c for c in LOG_COLS if c in X.columns]:
        X[c] = np.log1p(X[c])
    return X


@st.cache_resource
def treinar_modelo(df):
    X = _logtransform(df[FEATS_MODELO])
    y = df["entrou_fila"].values
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    scaler = StandardScaler().fit(Xtr)
    clf = LogisticRegression(max_iter=1000).fit(scaler.transform(Xtr), ytr)
    proba = clf.predict_proba(scaler.transform(Xte))[:, 1]
    return yte, proba


@st.cache_data(ttl=300)
def coeficientes_modelo(df):
    """Coeficientes padronizados da regressão logística (importância das variáveis)."""
    X = _logtransform(df[FEATS_MODELO])
    y = df["entrou_fila"].values
    scaler = StandardScaler().fit(X)
    clf = LogisticRegression(max_iter=1000).fit(scaler.transform(X), y)
    return pd.DataFrame({"variavel": FEATS_MODELO, "coef": clf.coef_[0].round(3)})


def dashboard_analitico(df):
    st.title("🎨 FlowCarreiras — Dashboard Analítico")
    st.caption(f"{len(df)} perfis · visão agregada da coordenação · dados simulados")

    # ---- Filtros (sidebar) ----
    with st.sidebar:
        st.header("⚙️ Filtros")
        st.caption("Comece sem filtros (todos os perfis) e **adicione** áreas/cidades para segmentar.")
        areas = sorted(df["area_artistica"].unique())
        cidades = sorted(df["cidade"].unique())
        sel_area = st.multiselect("Área artística", areas, default=[],
                                  placeholder="Todas — clique para adicionar")
        sel_cidade = st.multiselect("Cidade", cidades, default=[],
                                    placeholder="Todas — clique para adicionar")
        comp_min = st.slider("Preenchimento mínimo de perfil (%)", 0, 100, 0, 5)
        so_fila = st.checkbox("Apenas quem entrou na fila", value=False)

    # Filtro vazio = sem restrição naquela dimensão (mostra todos)
    f = df.copy()
    if sel_area:
        f = f[f["area_artistica"].isin(sel_area)]
    if sel_cidade:
        f = f[f["cidade"].isin(sel_cidade)]
    f = f[f["percentual_completude"] >= comp_min]
    if so_fila:
        f = f[f["entrou_fila"] == 1]
    if f.empty:
        st.warning("Nenhum perfil com os filtros atuais.")
        return
    st.sidebar.caption(f"{len(f)} de {len(df)} perfis selecionados")

    aba_inicio, aba_dados, aba_dash, aba_doc = st.tabs(
        ["🏠 Início", "🗃️ Dados", "📊 Dashboard", "📖 Documentação"])

    # ============================ INÍCIO ============================
    with aba_inicio:
        st.subheader("Visão geral do projeto")
        st.markdown(
            "Este dashboard analisa as **métricas de perfil** dos artistas do FlowCarreiras. "
            "A **unidade de análise** é o perfil (1 linha por usuário); a fonte é a base "
            "PostgreSQL do sistema, populada com um **dataset simulado** de 400 perfis. "
            "O objetivo é entender **o que diferencia artistas mais engajados** e **antecipar a "
            "entrada na fila de descoberta**.")
        st.subheader("Perguntas de análise")
        st.markdown(
            "1. Quais atributos do perfil mais se associam ao engajamento recebido?\n"
            "2. Perfis mais completos produzem e engajam mais?\n"
            "3. Como o engajamento se distribui entre os artistas (concentração)?\n"
            "4. Existem segmentos naturais de artistas?\n"
            "5. Quais variáveis melhor preveem a entrada na fila de descoberta?\n"
            "6. Há diferença de desempenho por área artística e cidade?")
        st.subheader("Como usar")
        st.markdown(
            "Navegue pelas abas: **Dados** (tabela analítica), **Dashboard** (gráficos e modelo) "
            "e **Documentação** (metodologia). Use os **filtros** na barra lateral para segmentar.")
        st.markdown("**O que cada filtro faz:**")
        st.markdown(
            "- **Área artística / Cidade** — começam vazios (todos os perfis); **adicione** itens "
            "para restringir a análise a essas categorias.\n"
            "- **Preenchimento mínimo de perfil (%)** — mostra apenas perfis cujo preenchimento é "
            "**maior ou igual** ao valor escolhido. O preenchimento soma: área 30 + tags 25 + cidade "
            "20 + bio 10 + foto 10 + links 5 (até 100%). Ex.: **80%** mantém só os perfis bem "
            "preenchidos; **0%** mostra todos. Serve para isolar artistas mais completos.\n"
            "- **Apenas quem entrou na fila** — restringe aos perfis que entraram na fila de descoberta.\n\n"
            "_Os filtros afetam as abas descritivas. A aba **Modelo de descoberta** usa sempre o "
            "conjunto completo (por isso seus números não mudam com os filtros)._")
        st.success(
            "**Principais achados:** o engajamento é **desigual** (cauda longa); **produzir e "
            "construir rede** o move muito mais que completar o perfil; há **segmentos** de "
            "artistas; e a **fila de descoberta** é previsível (ROC-AUC ~0,95).")

    # ============================ DADOS ============================
    with aba_dados:
        st.subheader("Tabela analítica (perfil_features)")
        with st.container(border=True):
            k = st.columns(4)
            k[0].metric("Perfis (filtro)", len(f))
            k[1].metric("Variáveis", f.shape[1])
            k[2].metric("% na fila", f"{100*f['entrou_fila'].mean():.0f}%")
            k[3].metric("Completude mediana", f"{f['percentual_completude'].median():.0f}%")
        mostrar = [c for c in f.columns if c not in ("perfil_id", "usuario_id")]
        st.dataframe(f[mostrar], use_container_width=True, height=380)
        st.download_button("⬇️ Baixar CSV (filtro atual)", f[mostrar].to_csv(index=False),
                           file_name="perfil_features.csv", mime="text/csv")
        with st.expander("📖 Dicionário de variáveis"):
            st.dataframe(pd.DataFrame(DICIONARIO, columns=["Variável", "Tipo", "Descrição"]),
                         use_container_width=True, hide_index=True)

    # ============================ DASHBOARD ============================
    with aba_dash:
        # --- KPIs (Região comum) ---
        with st.container(border=True):
            k = st.columns(5)
            k[0].metric("Perfis", len(f))
            k[1].metric("% na fila de descoberta", f"{100*f['entrou_fila'].mean():.0f}%")
            k[2].metric("Mediana de curtidas", int(f["curtidas_recebidas"].median()))
            k[3].metric("Mediana de seguidores", int(f["seguidores"].median()))
            k[4].metric("Completude mediana", f"{f['percentual_completude'].median():.0f}%")
        st.markdown("---")

        # --- Composição: por área + fila ---
        a1, a2 = st.columns(2)
        por_area = f["area_artistica"].value_counts().reset_index()
        por_area.columns = ["área", "perfis"]
        a1.plotly_chart(estilizar(px.bar(
            por_area, x="perfis", y="área", orientation="h", title="Perfis por área artística",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            yaxis={"categoryorder": "total ascending", "title": None}, xaxis_title="perfis")),
            use_container_width=True)
        fila_comp = f["entrou_fila"].map({1: "Entrou", 0: "Não entrou"}).value_counts().reset_index()
        fila_comp.columns = ["fila", "perfis"]
        a2.plotly_chart(estilizar(px.pie(
            fila_comp, names="fila", values="perfis", hole=0.5, title="Composição da fila de descoberta",
            color="fila", color_discrete_map=COR_FILA).update_traces(
            textposition="inside", textinfo="percent+label").update_layout(showlegend=False)),
            use_container_width=True)
        st.markdown(
            "**Narrativa.** Produzir e construir rede — não apenas completar o perfil — é o que move "
            "o engajamento, e esses mesmos sinais preveem bem a entrada na fila de descoberta.")
        st.markdown("---")

        # --- Ranking de artistas ---
        st.markdown("##### Ranking de artistas")
        rcol = st.columns(2)
        top_curt = f.nlargest(10, "curtidas_recebidas")[["nome", "curtidas_recebidas"]]
        rcol[0].plotly_chart(estilizar(px.bar(
            top_curt, x="curtidas_recebidas", y="nome", orientation="h", title="Mais curtidas",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            yaxis={"categoryorder": "total ascending", "title": None}, xaxis_title="curtidas")),
            use_container_width=True)
        top_seg = f.nlargest(10, "seguidores")[["nome", "seguidores"]]
        rcol[1].plotly_chart(estilizar(px.bar(
            top_seg, x="seguidores", y="nome", orientation="h", title="Mais seguidores",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            yaxis={"categoryorder": "total ascending", "title": None}, xaxis_title="seguidores")),
            use_container_width=True)
        st.markdown("---")

        # --- Séries temporais ---
        st.markdown("##### Evolução no tempo")
        cad, curt_ev, com_ev, seg_ev = carregar_eventos()
        uids = set(f["usuario_id"]); pids = set(f["perfil_id"])
        cad_f = cad[cad["usuario_id"].isin(uids)].copy()
        if not cad_f.empty:
            cad_f["mes"] = pd.to_datetime(cad_f["data_criacao"]).dt.to_period("M").dt.to_timestamp()
            serie = cad_f.groupby("mes").size().reset_index(name="cadastros")
            st.plotly_chart(estilizar(px.bar(
                serie, x="mes", y="cadastros", title="Novos cadastros por mês",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                xaxis_title=None, yaxis_title="cadastros"), grid_y=True), use_container_width=True)
        tcol = st.columns(2)
        curt_f = curt_ev[curt_ev["perfil_id"].isin(pids)].copy()
        if not curt_f.empty:
            curt_f["data"] = pd.to_datetime(curt_f["data_criacao"]).dt.date
            sc = curt_f.groupby("data").size().cumsum().reset_index(name="acumulado")
            tcol[0].plotly_chart(estilizar(px.area(
                sc, x="data", y="acumulado", title="Curtidas acumuladas",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                xaxis_title=None, yaxis_title="curtidas"), grid_y=True), use_container_width=True)
        seg_f = seg_ev[seg_ev["usuario_id"].isin(uids)].copy()
        if not seg_f.empty:
            seg_f["data"] = pd.to_datetime(seg_f["data_criacao"]).dt.date
            ss = seg_f.groupby("data").size().cumsum().reset_index(name="acumulado")
            tcol[1].plotly_chart(estilizar(px.area(
                ss, x="data", y="acumulado", title="Seguidores acumulados",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                xaxis_title=None, yaxis_title="seguidores"), grid_y=True), use_container_width=True)
        st.markdown(
            "**Interpretação.** Cadastros, curtidas e seguidores crescem ao longo do período — "
            "a base acumula adoção e engajamento com o tempo.")
        st.markdown("---")

        # --- Distribuições ---
        st.markdown("##### Distribuições")
        cc = st.columns([1, 1, 2])
        var = cc[0].selectbox("Variável", ["curtidas_recebidas", "n_obras", "seguidores",
                                           "comentarios_recebidos", "percentual_completude"])
        usar_log = cc[1].checkbox("Escala log (log1p)", value=var != "percentual_completude")
        serie = np.log1p(f[var]) if usar_log else f[var]
        sufixo = " (log1p)" if usar_log else ""
        d1, d2 = st.columns(2)
        d1.plotly_chart(estilizar(px.histogram(
            serie, nbins=30, title=f"Histograma — {var}{sufixo}",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            showlegend=False, xaxis_title=var, yaxis_title="perfis"), grid_y=True),
            use_container_width=True)
        d2.plotly_chart(estilizar(px.box(
            serie, title=f"Boxplot — {var}{sufixo}", points="outliers",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            showlegend=False, yaxis_title=var)), use_container_width=True)
        st.markdown(
            "**Interpretação.** As contagens de engajamento são **assimétricas à direita** (muitos "
            "com pouco, poucos com muito). A escala **log1p** revela melhor a massa de valores baixos.")
        st.markdown("---")

        # --- Correlações ---
        st.markdown("##### Correlações")
        cols = ["percentual_completude", "n_obras", "n_obras_publicadas", "n_tags_expertise",
                "seguidores", "seguindo", "curtidas_recebidas", "comentarios_recebidos",
                "idade_conta_dias", "entrou_fila"]
        corr = f[cols].corr().round(2)
        heat = px.imshow(corr, text_auto=True, aspect="auto", color_continuous_scale=ESCALA_DIV,
                         zmin=-1, zmax=1, title="Matriz de correlação (Pearson)")
        heat.update_xaxes(showgrid=False).update_yaxes(showgrid=False)
        st.plotly_chart(estilizar(heat, altura=520), use_container_width=True)
        st.markdown(
            "**Interpretação.** Curtidas correlacionam **forte** com obras publicadas (~0,9) e "
            "**moderada-forte** com seguidores (~0,7); a **completude** tem efeito **fraco** (~0,2) e "
            "a **antiguidade**, quase nulo.")
        st.markdown("---")

        # --- Relação: obras publicadas × curtidas ---
        st.markdown("##### Relação: obras publicadas × curtidas")
        sc = f.copy()
        sc["fila"] = sc["entrou_fila"].map({1: "Entrou", 0: "Não entrou"})
        fig_sc = px.scatter(
            sc, x="n_obras_publicadas", y="curtidas_recebidas", color="fila",
            color_discrete_map=COR_FILA, opacity=0.6, title="Obras publicadas × curtidas recebidas",
            labels={"n_obras_publicadas": "obras publicadas", "curtidas_recebidas": "curtidas",
                    "fila": "fila de descoberta"})
        x = sc["n_obras_publicadas"].to_numpy(float)
        y = sc["curtidas_recebidas"].to_numpy(float)
        if len(x) >= 2 and x.std() > 0:
            b1, b0 = np.polyfit(x, y, 1)
            xs = np.array([x.min(), x.max()])
            fig_sc.add_scatter(x=xs, y=b0 + b1 * xs, mode="lines", name="tendência",
                               line=dict(color="#f59e0b", width=2.5))
        st.plotly_chart(estilizar(fig_sc, grid_y=True), use_container_width=True)
        st.markdown(
            "**Interpretação.** A nuvem sobe da esquerda para a direita: **mais obras publicadas → "
            "mais curtidas**. A linha de tendência resume a relação, e os pontos de quem **entrou na "
            "fila** concentram-se na região de maior produção e engajamento.")
        st.markdown("---")

        # --- Comentários ---
        st.markdown("##### Comentários")
        with st.container(border=True):
            kc = st.columns(3)
            kc[0].metric("Total de comentários", int(f["comentarios_recebidos"].sum()))
            kc[1].metric("Mediana por perfil", int(f["comentarios_recebidos"].median()))
            kc[2].metric("Perfis comentados", int((f["comentarios_recebidos"] > 0).sum()))
        cc1, cc2 = st.columns(2)
        topc = f.nlargest(10, "comentarios_recebidos")[["nome", "comentarios_recebidos"]]
        cc1.plotly_chart(estilizar(px.bar(
            topc, x="comentarios_recebidos", y="nome", orientation="h", title="Artistas mais comentados",
            color_discrete_sequence=[COR_DESTAQUE]).update_layout(
            yaxis={"categoryorder": "total ascending", "title": None}, xaxis_title="comentários")),
            use_container_width=True)
        rel = f.copy()
        rel["fila"] = rel["entrou_fila"].map({1: "Entrou", 0: "Não entrou"})
        fig_rc = px.scatter(
            rel, x="comentarios_recebidos", y="curtidas_recebidas", color="fila",
            color_discrete_map=COR_FILA, opacity=0.6, title="Comentários × curtidas",
            labels={"comentarios_recebidos": "comentários", "curtidas_recebidas": "curtidas",
                    "fila": "fila de descoberta"})
        xx = rel["comentarios_recebidos"].to_numpy(float)
        yy = rel["curtidas_recebidas"].to_numpy(float)
        if len(xx) >= 2 and xx.std() > 0:
            a1, a0 = np.polyfit(xx, yy, 1)
            xs2 = np.array([xx.min(), xx.max()])
            fig_rc.add_scatter(x=xs2, y=a0 + a1 * xs2, mode="lines", name="tendência",
                               line=dict(color="#f59e0b", width=2.5))
        cc2.plotly_chart(estilizar(fig_rc, grid_y=True), use_container_width=True)
        com_f = com_ev[com_ev["perfil_id"].isin(pids)].copy()
        if not com_f.empty:
            com_f["data"] = pd.to_datetime(com_f["data_criacao"]).dt.date
            sc_com = com_f.groupby("data").size().cumsum().reset_index(name="acumulado")
            st.plotly_chart(estilizar(px.area(
                sc_com, x="data", y="acumulado", title="Comentários acumulados no tempo",
                color_discrete_sequence=[COR_DESTAQUE]).update_layout(
                xaxis_title=None, yaxis_title="comentários"), grid_y=True), use_container_width=True)
        st.markdown(
            "**Interpretação.** Os comentários **acompanham as curtidas** — quem recebe mais curtidas "
            "também recebe mais comentários — e crescem ao longo do tempo. O engajamento, em ambas as "
            "formas, concentra-se nos perfis mais ativos.")
        st.markdown("---")

        # --- Segmentos ---
        st.markdown("##### Segmentos (clustering)")
        if len(f) < 20:
            st.info("Selecione ao menos 20 perfis para o agrupamento.")
        else:
            X = StandardScaler().fit_transform(_logtransform(f[FEATS_CLUSTER]))
            kk = st.slider("Número de segmentos (k)", 2, 6, 3)
            km = KMeans(n_clusters=kk, random_state=42, n_init=10).fit(X)
            proj = PCA(n_components=2).fit_transform(X)
            plot_df = pd.DataFrame({"PC1": proj[:, 0], "PC2": proj[:, 1],
                                    "segmento": ("Segmento " + (km.labels_ + 1).astype(str))})
            s1, s2 = st.columns([3, 2])
            s1.plotly_chart(estilizar(px.scatter(
                plot_df, x="PC1", y="PC2", color="segmento", title=f"Perfis em 2D (PCA) — {kk} segmentos",
                color_discrete_sequence=PALETA_CAT).update_traces(marker=dict(size=8, opacity=0.8))),
                use_container_width=True)
            perfil_clusters = f.assign(segmento=("Segmento " + (km.labels_ + 1).astype(str))).groupby("segmento")[
                ["percentual_completude", "n_obras_publicadas", "curtidas_recebidas",
                 "seguidores", "entrou_fila"]].mean().round(1)
            s2.markdown("**Perfil médio por segmento**")
            s2.dataframe(perfil_clusters, use_container_width=True)
            st.markdown(
                "**Interpretação.** Os segmentos se ordenam num eixo de **atividade/maturidade** — de "
                "iniciantes/inativos a consolidados (estes com maior taxa de entrada na fila).")
        st.markdown("---")

        # --- Modelo ---
        st.markdown("##### Modelo de descoberta (classificação)")
        st.caption("Classificador treinado sobre o conjunto completo (não afetado pelos filtros).")
        yte, proba = treinar_modelo(df)
        thr = st.slider("Limiar de decisão", 0.10, 0.90, 0.50, 0.05)
        pred = (proba >= thr).astype(int)
        with st.container(border=True):
            m = st.columns(5)
            m[0].metric("Acurácia", f"{accuracy_score(yte, pred):.2f}")
            m[1].metric("Precisão", f"{precision_score(yte, pred, zero_division=0):.2f}")
            m[2].metric("Recall", f"{recall_score(yte, pred, zero_division=0):.2f}")
            m[3].metric("F1", f"{f1_score(yte, pred, zero_division=0):.2f}")
            m[4].metric("ROC-AUC", f"{roc_auc_score(yte, proba):.2f}")
        e1, e2 = st.columns(2)
        cm = confusion_matrix(yte, pred)
        conf = px.imshow(cm, text_auto=True, color_continuous_scale=ESCALA_SEQ,
                         x=["prev. não", "prev. sim"], y=["real não", "real sim"],
                         title="Matriz de confusão")
        conf.update_xaxes(showgrid=False).update_yaxes(showgrid=False)
        conf.update_coloraxes(showscale=False)
        e1.plotly_chart(estilizar(conf, altura=360), use_container_width=True)
        fpr, tpr, _ = roc_curve(yte, proba)
        prec, rec, _ = precision_recall_curve(yte, proba)
        roc_fig = go.Figure()
        roc_fig.add_scatter(x=fpr, y=tpr, mode="lines", line=dict(color=COR_DESTAQUE, width=2.5), name="ROC")
        roc_fig.add_scatter(x=[0, 1], y=[0, 1], mode="lines",
                            line=dict(dash="dash", color="#64748b"), name="acaso")
        roc_fig.update_layout(title=f"Curva ROC (AUC={roc_auc_score(yte, proba):.2f})",
                              xaxis_title="Falsos positivos", yaxis_title="Verdadeiros positivos")
        e2.plotly_chart(estilizar(roc_fig, altura=360, grid_y=True), use_container_width=True)
        pr_fig = go.Figure()
        pr_fig.add_scatter(x=rec, y=prec, mode="lines", line=dict(color=COR_DESTAQUE, width=2.5), name="PR")
        pr_fig.add_hline(y=yte.mean(), line_dash="dash", line_color="#64748b")
        pr_fig.update_layout(title="Curva Precision-Recall", xaxis_title="Recall", yaxis_title="Precisão")
        st.plotly_chart(estilizar(pr_fig, grid_y=True), use_container_width=True)
        st.markdown(
            "**Interpretação.** O modelo prevê bem a entrada na fila (AUC alta). O **limiar** equilibra "
            "**recall** (não perder bons artistas) vs. **precisão** (destacar só os fortes), conforme a "
            "estratégia de curadoria.")
        st.markdown("---")

        # --- Importância das variáveis ---
        st.markdown("##### Importância das variáveis (no modelo)")
        imp = coeficientes_modelo(df).sort_values("coef")
        imp["efeito"] = np.where(imp["coef"] >= 0, "aumenta a chance", "reduz a chance")
        fig_imp = px.bar(
            imp, x="coef", y="variavel", orientation="h", color="efeito",
            color_discrete_map={"aumenta a chance": "#10b981", "reduz a chance": "#ef4444"},
            title="Peso de cada variável na entrada da fila (coeficiente padronizado)")
        fig_imp.update_layout(yaxis={"title": None}, xaxis_title="coeficiente")
        st.plotly_chart(estilizar(fig_imp), use_container_width=True)
        st.markdown(
            "**Interpretação.** Coeficientes padronizados: barras à direita (verde) **aumentam** a "
            "probabilidade de entrar na fila; à esquerda (vermelho) **reduzem**. As variáveis de "
            "**produção e engajamento** dominam — coerente com a EDA e a regressão.")

    # ============================ DOCUMENTAÇÃO ============================
    with aba_doc:
        st.subheader("Metodologia e arquitetura")
        st.markdown(
            "**Fluxo dos dados (pipeline):**\n"
            "```\n"
            "seed_simulado.py → PostgreSQL (tabelas normalizadas)\n"
            "      └─ extração SQL (JOIN + GROUP BY) → perfil_features (1 linha/perfil)\n"
            "            └─ limpeza + transformação (log1p, z-score, one-hot)\n"
            "                  └─ notebooks (EDA/regressão/classificação) + este dashboard\n"
            "```")
        st.markdown(
            "**Ferramenta de publicação:** Streamlit, lendo o PostgreSQL do sistema ao vivo e "
            "publicado pelo Nginx em `/dashboard`. Roda embutido no sistema (aba *Métricas*, por "
            "usuário) e de forma autônoma (esta visão agregada).")
        st.markdown(
            "**Entregáveis da análise (no repositório, pasta `analytics/`):**\n"
            "- CC1 — Plano de análise · CC2 — Plano de preparação dos dados\n"
            "- CC3 — EDA · CC4 — Regressão · CC5 — Classificação\n"
            "- CC6/CC7/CC8 — Dashboard, proposta de integração e consolidação")
        st.markdown(
            "**Decisões visuais (Gestalt):** cor de marca única para destaque e **cores fixas por "
            "categoria** (Semelhança); fundo transparente e gridlines suaves só no eixo de valor "
            "(Figura-fundo); KPIs e blocos em containers (Região comum/Fechamento); tipos de gráfico "
            "escolhidos pelo canal perceptual da tarefa; hierarquia KPIs → gráfico → texto.")


# =====================================================================
# Roteamento
# =====================================================================
params = st.query_params
email = None
if "token" in params:
    email = email_do_token(params["token"])
    if not email:
        st.error("Sessão inválida ou expirada. Faça login novamente no sistema.")
        st.stop()
elif "email" in params:
    email = params["email"]

if email:
    u = q("SELECT id, nome, email FROM usuarios WHERE email = :e", e=email)
    if u.empty:
        st.error(f"Usuário não encontrado: {email}")
        st.stop()
    pagina_usuario(u.iloc[0])
else:
    dados = carregar_perfis()
    if dados.empty:
        st.warning("Não há perfis simulados. Rode scripts/seed_simulado.py.")
    else:
        dashboard_analitico(dados)
