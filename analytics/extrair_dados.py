"""
Extração da tabela analítica `perfil_features` (uma linha por perfil).

Implementa a transformação descrita no CC2: parte das tabelas relacionais
(normalizadas) do sistema e produz uma tabela achatada por perfil, via
agregações (JOIN + GROUP BY) e engenharia de atributos derivados.

Filtra apenas os perfis SIMULADOS (e-mail @sim.flowcarreiras.dev).

Logs vão para STDERR; o CSV é escrito em STDOUT:
    docker compose exec -T dashboard python - < extrair_dados.py > dados/perfil_features.csv
"""

import os
import sys

import pandas as pd
from sqlalchemy import create_engine, text

SIM_LIKE = "%@sim.flowcarreiras.dev"


def log(*a):
    print(*a, file=sys.stderr)


def engine():
    u = os.getenv("DB_USER", "postgres"); p = os.getenv("DB_PASSWORD", "postgres")
    h = os.getenv("DB_HOST", "db"); pt = os.getenv("DB_PORT", "5432")
    n = os.getenv("DB_NAME", "flowcarreiras")
    return create_engine(f"postgresql+psycopg2://{u}:{p}@{h}:{pt}/{n}")


def main():
    eng = engine()

    def q(sql, **params):
        with eng.connect() as c:
            return pd.read_sql(text(sql), c, params=params)

    log("Extraindo base de perfis simulados...")
    base = q("""
        SELECT p.id AS perfil_id, u.id AS usuario_id, u.data_criacao,
               p.percentual_completude, p.onboarding_concluido,
               p.bio, p.foto_perfil, p.cidade, p.area_artistica_principal AS area_artistica,
               p.disponivel_para_mentorar, p.perfil_mentor_configurado,
               p.receber_notificacoes_oportunidades AS recebe_notificacoes,
               (p.data_entrada_fila IS NOT NULL) AS entrou_fila
        FROM perfis_artistas p JOIN usuarios u ON u.id = p.usuario_id
        WHERE u.email LIKE :s
    """, s=SIM_LIKE)

    # Agregações por perfil
    obras = q("""SELECT artista_id AS perfil_id, count(*) AS n_obras,
                 count(*) FILTER (WHERE status='PUBLICADA') AS n_obras_publicadas,
                 count(DISTINCT tipo_midia) AS diversidade_midia
                 FROM obras GROUP BY artista_id""")
    curt_rec = q("""SELECT o.artista_id AS perfil_id, count(*) AS curtidas_recebidas
                    FROM curtidas c JOIN obras o ON o.id=c.obra_id GROUP BY o.artista_id""")
    com_rec = q("""SELECT o.artista_id AS perfil_id, count(*) AS comentarios_recebidos
                   FROM comentarios cm JOIN obras o ON o.id=cm.obra_id GROUP BY o.artista_id""")
    links = q("SELECT perfil_id, count(*) AS n_links FROM perfil_links_externos GROUP BY perfil_id")
    tnec = q("SELECT perfil_id, count(*) AS n_tags_necessidade FROM perfil_tags_necessidade GROUP BY perfil_id")
    texp = q("SELECT perfil_id, count(*) AS n_tags_expertise FROM perfil_tags_expertise GROUP BY perfil_id")
    m_ment = q("SELECT mentor_id AS perfil_id, count(*) AS n_mentorias_mentor FROM mentorias GROUP BY mentor_id")
    m_art = q("SELECT artista_id AS perfil_id, count(*) AS n_mentorias_artista FROM mentorias GROUP BY artista_id")
    notif = q("SELECT perfil_id, count(*) AS n_notificacoes FROM notificacoes_oportunidades GROUP BY perfil_id")

    # Agregações por usuário
    seg = q("SELECT seguido_id AS usuario_id, count(*) AS seguidores FROM seguidores GROUP BY seguido_id")
    sego = q("SELECT seguidor_id AS usuario_id, count(*) AS seguindo FROM seguidores GROUP BY seguidor_id")
    curt_dad = q("SELECT usuario_id, count(*) AS curtidas_dadas FROM curtidas GROUP BY usuario_id")
    com_feit = q("SELECT autor_id AS usuario_id, count(*) AS comentarios_feitos FROM comentarios GROUP BY autor_id")

    df = base
    for t in [obras, curt_rec, com_rec, links, tnec, texp, m_ment, m_art, notif]:
        df = df.merge(t, on="perfil_id", how="left")
    for t in [seg, sego, curt_dad, com_feit]:
        df = df.merge(t, on="usuario_id", how="left")

    # Preenche contagens ausentes com 0
    cont = ["n_obras", "n_obras_publicadas", "diversidade_midia", "curtidas_recebidas",
            "comentarios_recebidos", "n_links", "n_tags_necessidade", "n_tags_expertise",
            "n_mentorias_mentor", "n_mentorias_artista", "n_notificacoes",
            "seguidores", "seguindo", "curtidas_dadas", "comentarios_feitos"]
    df[cont] = df[cont].fillna(0).astype(int)

    # Indicadores de preenchimento (NULL com significado -> indicador, não imputação)
    for col, novo in [("bio", "tem_bio"), ("foto_perfil", "tem_foto"),
                      ("cidade", "tem_cidade"), ("area_artistica", "tem_area")]:
        df[novo] = (df[col].fillna("").astype(str).str.len() > 0).astype(int)

    # Derivadas
    df["data_criacao"] = pd.to_datetime(df["data_criacao"])
    df["idade_conta_dias"] = (pd.Timestamp.now() - df["data_criacao"]).dt.days
    df["n_rascunhos"] = df["n_obras"] - df["n_obras_publicadas"]
    df["media_curtidas_por_obra"] = df.apply(
        lambda r: r["curtidas_recebidas"] / r["n_obras_publicadas"] if r["n_obras_publicadas"] > 0 else 0.0, axis=1)
    df["razao_seg"] = df.apply(
        lambda r: r["seguidores"] / r["seguindo"] if r["seguindo"] > 0 else 0.0, axis=1)

    # Booleanas -> int
    for col in ["onboarding_concluido", "disponivel_para_mentorar",
                "perfil_mentor_configurado", "recebe_notificacoes", "entrou_fila"]:
        df[col] = df[col].astype(int)

    df["area_artistica"] = df["area_artistica"].fillna("Não informado")
    df["cidade"] = df["cidade"].fillna("Não informado")

    df = df.drop(columns=["bio", "foto_perfil", "data_criacao"])

    log(f"Tabela analítica: {df.shape[0]} perfis x {df.shape[1]} colunas")
    df.to_csv(sys.stdout, index=False)


if __name__ == "__main__":
    main()
