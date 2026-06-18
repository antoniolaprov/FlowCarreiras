"""
Simulação de dataset volumoso para a trilha de análise de dados.

Gera usuários/perfis/obras/curtidas/seguidores/comentários/mentorias/
oportunidades sintéticos diretamente no Postgres do projeto, com correlações
PROPOSITAIS embutidas (perfis mais "ativos" tendem a ter perfil mais completo,
mais obras, mais curtidas e mais seguidores, e maior chance de entrar na fila de
descoberta). Isso dá substância para EDA, regressão e classificação.

Dados simulados são marcados pelo domínio de e-mail "@sim.flowcarreiras.dev"
(e oportunidades por link "https://sim.flowcarreiras.dev/..."), o que torna o
script idempotente: cada execução limpa os simulados anteriores e recria.

Uso (dentro do container do dashboard, que já tem psycopg2 e acesso ao banco):
    SIM_USERS=400 python seed_simulado.py        # limpa + gera 400 usuários
    SIM_ACTION=clean python seed_simulado.py      # apenas remove os simulados
"""

import os
import random
import unicodedata
import uuid
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import execute_values, register_uuid

register_uuid()  # permite passar uuid.UUID direto nos inserts
random.seed(42)  # reprodutível

SIM_EMAIL_DOMAIN = "sim.flowcarreiras.dev"
SIM_LIKE = f"%@{SIM_EMAIL_DOMAIN}"
SIM_OP_LINK_PREFIX = "https://sim.flowcarreiras.dev/op/"

N_USERS = int(os.getenv("SIM_USERS", "400"))
ACTION = os.getenv("SIM_ACTION", "seed")

NOW = datetime.now()
INICIO = NOW - timedelta(days=730)

AREAS = ["Música", "Teatro", "Dança", "Artes Visuais", "Fotografia",
         "Audiovisual", "Literatura", "Circo", "Artesanato", "Performance"]
CIDADES = ["Recife", "Olinda", "Caruaru", "Jaboatão dos Guararapes", "Paulista",
           "Petrolina", "Garanhuns", "Cabo de Santo Agostinho", "Camaragibe",
           "São Paulo", "Rio de Janeiro", "Salvador", "Fortaleza", "Belo Horizonte"]
PRIMEIROS = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe", "Gabriela",
             "Hugo", "Isabela", "João", "Karla", "Lucas", "Mariana", "Nuno",
             "Olívia", "Pedro", "Quésia", "Rafael", "Sofia", "Tiago", "Úrsula",
             "Vitor", "Wesley", "Xênia", "Yuri", "Zélia", "Beatriz", "Caio"]
ULTIMOS = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa",
           "Almeida", "Nascimento", "Araújo", "Ribeiro", "Carvalho", "Gomes",
           "Martins", "Rocha", "Barbosa", "Mendes", "Freitas", "Cavalcanti"]
ADJ = ["Ecos", "Reflexos", "Fragmentos", "Memórias", "Horizonte", "Silêncio",
       "Travessia", "Raízes", "Vertigem", "Aurora", "Maré", "Sertão"]
SUB = ["do Tempo", "Urbano", "em Azul", "Nº 7", "da Cidade", "Noturno",
       "Imperfeito", "ao Vivo", "em Movimento", "Coletivo", "Solo"]
YT = ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=9bZkp7q19f0",
      "https://vimeo.com/76979871", "https://youtu.be/3JZ_D3ELwOQ"]
TIPOS_MIDIA = (["IMAGEM"] * 5 + ["VIDEO"] * 2 + ["AUDIO"] * 2 + ["EMBED"] * 1)
TEXTOS_COMENT = [
    "Trabalho incrível!", "Adorei a estética.", "Que sensibilidade.", "Inspirador.",
    "Curti demais o conceito.", "Forte e original.", "Parabéns pela obra!", "Sensacional 👏",
    "Que paleta de cores incrível!", "A composição ficou equilibrada.", "O uso da luz está impecável.",
    "Trabalho corajoso, fugiu do óbvio.", "A narrativa visual é forte.", "Que técnica refinada!",
    "Muito original, nunca vi nada parecido.", "Visualmente coeso e maduro.", "Esse trabalho respira.",
    "A direção de arte está impecável.", "Tem uma honestidade que conecta.", "Belíssimo, do conceito à execução.",
    "Identidade nordestina com força.", "Sensível e potente ao mesmo tempo.", "Que achado estético!"]
TEXTOS_MSG = ["Olá! Podemos marcar?", "Obrigado pelo retorno.", "Que tal terça?",
              "Vou revisar seu portfólio.", "Combinado!", "Tenho algumas dicas."]


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return "".join(c.lower() if c.isalnum() else "-" for c in s).strip("-")


def rand_dt(a, b):
    if b <= a:
        return a
    return a + timedelta(seconds=random.randint(0, int((b - a).total_seconds())))


def conectar():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"), port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "flowcarreiras"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"))


def limpar(cur):
    perfis_sub = ("SELECT id FROM perfis_artistas WHERE usuario_id IN "
                  "(SELECT id FROM usuarios WHERE email LIKE %s)")
    obras_sub = f"SELECT id FROM obras WHERE artista_id IN ({perfis_sub})"
    stmts = [
        (f"DELETE FROM mensagens_mentoria WHERE mentoria_id IN (SELECT id FROM mentorias "
         f"WHERE mentor_id IN ({perfis_sub}) OR artista_id IN ({perfis_sub}))", (SIM_LIKE, SIM_LIKE)),
        (f"DELETE FROM mentorias WHERE mentor_id IN ({perfis_sub}) OR artista_id IN ({perfis_sub})",
         (SIM_LIKE, SIM_LIKE)),
        (f"DELETE FROM notificacoes_oportunidades WHERE perfil_id IN ({perfis_sub})", (SIM_LIKE,)),
        ("DELETE FROM oportunidades WHERE link_externo LIKE %s", (SIM_OP_LINK_PREFIX + "%",)),
        (f"DELETE FROM curtidas WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE %s) "
         f"OR obra_id IN ({obras_sub})", (SIM_LIKE, SIM_LIKE)),
        (f"DELETE FROM comentarios WHERE autor_id IN (SELECT id FROM usuarios WHERE email LIKE %s) "
         f"OR obra_id IN ({obras_sub})", (SIM_LIKE, SIM_LIKE)),
        ("DELETE FROM seguidores WHERE seguidor_id IN (SELECT id FROM usuarios WHERE email LIKE %s) "
         "OR seguido_id IN (SELECT id FROM usuarios WHERE email LIKE %s)", (SIM_LIKE, SIM_LIKE)),
        (f"DELETE FROM obra_tags WHERE obra_id IN ({obras_sub})", (SIM_LIKE,)),
        (f"DELETE FROM fila_descoberta_log WHERE perfil_id IN ({perfis_sub})", (SIM_LIKE,)),
        (f"DELETE FROM obras WHERE artista_id IN ({perfis_sub})", (SIM_LIKE,)),
        (f"DELETE FROM perfil_tags_necessidade WHERE perfil_id IN ({perfis_sub})", (SIM_LIKE,)),
        (f"DELETE FROM perfil_tags_expertise WHERE perfil_id IN ({perfis_sub})", (SIM_LIKE,)),
        (f"DELETE FROM perfil_links_externos WHERE perfil_id IN ({perfis_sub})", (SIM_LIKE,)),
        ("DELETE FROM perfis_artistas WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE %s)",
         (SIM_LIKE,)),
        ("DELETE FROM usuarios WHERE email LIKE %s", (SIM_LIKE,)),
    ]
    for sql, params in stmts:
        cur.execute(sql, params)


def insert(cur, table, cols, rows):
    if not rows:
        return
    execute_values(cur, f"INSERT INTO {table} ({','.join(cols)}) VALUES %s", rows, page_size=1000)


def main():
    conn = conectar()
    cur = conn.cursor()

    print(f"Limpando dados simulados anteriores...")
    limpar(cur)
    conn.commit()
    if ACTION == "clean":
        print("Limpeza concluída.")
        conn.close()
        return

    # Referências do banco real
    cur.execute("SELECT id FROM tags")
    tag_ids = [r[0] for r in cur.fetchall()]
    cur.execute("SELECT senha FROM usuarios WHERE email NOT LIKE %s LIMIT 1", (SIM_LIKE,))
    row = cur.fetchone()
    if not row:
        raise SystemExit("Não há usuário real para reaproveitar o hash de senha.")
    senha_hash = row[0]
    cur.execute("SELECT DISTINCT tipo, status, area_artistica FROM oportunidades")
    op_amostra = cur.fetchall()

    print(f"Gerando {N_USERS} usuários simulados...")
    usuarios, perfis = [], []
    links_rows, tnec_rows, texp_rows = [], [], []
    users_meta = []  # dicts auxiliares

    for i in range(N_USERS):
        atividade = random.random() ** 1.6  # assimétrico: muitos pouco ativos
        uid, pid = uuid.uuid4(), uuid.uuid4()
        nome = f"{random.choice(PRIMEIROS)} {random.choice(ULTIMOS)}"
        email = f"{slug(nome)}.{i}@{SIM_EMAIL_DOMAIN}"
        criado = rand_dt(INICIO, NOW - timedelta(days=30))

        tem_area = random.random() < 0.92
        tem_cidade = random.random() < 0.85
        tem_bio = random.random() < (0.35 + atividade * 0.55)
        tem_foto = random.random() < (0.25 + atividade * 0.55)
        n_links = random.choices([0, 1, 2, 3], weights=[1 - atividade, 0.4, 0.3, atividade])[0]
        n_nec = random.randint(0, 4)
        n_exp = random.choices([0, 1, 2, 3, 4], weights=[1, 1, 1, atividade + 0.2, atividade])[0]

        area = random.choice(AREAS) if tem_area else None
        cidade = random.choice(CIDADES) if tem_cidade else None
        bio = ("Artista de " + (area or "múltiplas linguagens") +
               " explorando novas formas de expressão.") if tem_bio else None
        foto = f"/uploads/perfil/sim-{i}.jpg" if tem_foto else None

        # Completude — mesma fórmula do PerfilArtista.calcularPercentualCompletude
        comp = (30 if area else 0) + (25 if n_nec > 0 else 0) + (20 if cidade else 0) \
               + (10 if bio else 0) + (10 if foto else 0) + (5 if n_links > 0 else 0)

        # Mentoria
        disp = random.random() < (0.12 + atividade * 0.4)
        config = disp and random.random() < 0.7
        gratuita = (random.random() < 0.5) if config else True
        valor = None if (gratuita or not config) else round(random.uniform(50, 300), 2)
        modalidade = random.choice(["REMOTA", "PRESENCIAL", "HIBRIDA"]) if config else None
        cidade_ment = cidade if (modalidade in ("PRESENCIAL", "HIBRIDA")) else None
        desc_ment = "Mentoria focada em portfólio e carreira." if config else None

        receber = random.random() < 0.8

        def etapa(filled):
            return "CONCLUIDA" if filled else random.choices(["PENDENTE", "PULADA"], weights=[3, 1])[0]

        onboarding = random.random() < (comp / 100.0)

        usuarios.append((uid, nome, email, senha_hash, criado, True))
        perfis.append((
            pid, uid, bio, foto, cidade, area, comp, None,  # data_entrada_fila definido depois
            receber, disp, config, gratuita, valor, desc_ment, modalidade, cidade_ment,
            onboarding, etapa(area), etapa(cidade), etapa(bio), etapa(n_nec > 0),
            etapa(foto), etapa(n_links > 0), f"{slug(nome)}-{i}",
        ))
        for k in range(n_links):
            links_rows.append((pid, f"https://portfolio.exemplo/{slug(nome)}/{k}"))
        for t in random.sample(tag_ids, min(n_nec, len(tag_ids))):
            tnec_rows.append((pid, t))
        for t in random.sample(tag_ids, min(n_exp, len(tag_ids))):
            texp_rows.append((pid, t))

        users_meta.append(dict(uid=uid, pid=pid, atividade=atividade, criado=criado,
                               comp=comp, config=config, receber=receber, cidade=cidade))

    # Obras + correlações de engajamento
    obras, obra_tags_rows = [], []
    obras_meta = []
    for u in users_meta:
        n_obras = max(0, int(random.gauss(u["atividade"] * 9, 2)))
        publicadas = 0
        for _ in range(n_obras):
            oid = uuid.uuid4()
            tipo = random.choice(TIPOS_MIDIA)
            if tipo == "EMBED":
                url = random.choice(YT)
            elif tipo == "IMAGEM":
                # imagem placeholder real (distinta por obra) — evita thumbnail quebrada
                url = f"https://picsum.photos/seed/{oid}/600/600"
            else:
                url = f"/uploads/sim/{oid}.bin"
            dt_pub = rand_dt(u["criado"], NOW)
            status = "PUBLICADA" if random.random() < 0.8 else "RASCUNHO"
            if status == "PUBLICADA":
                publicadas += 1
            titulo = f"{random.choice(ADJ)} {random.choice(SUB)}"
            desc = "Obra que investiga texturas, ritmo e identidade." if random.random() < 0.7 else None
            obras.append((oid, titulo, desc, tipo, url, dt_pub, status, u["pid"]))
            for t in random.sample(tag_ids, random.randint(1, 3)):
                obra_tags_rows.append((oid, t))
            obras_meta.append(dict(oid=oid, uid=u["uid"], dt_pub=dt_pub, status=status,
                                   atividade=u["atividade"]))
        u["publicadas"] = publicadas

        # Fila de descoberta (alvo de classificação) — regra de elegibilidade do
        # sistema (publicar ao menos 1 obra com perfil minimamente completo e ativo),
        # com ~8% de ruído de rótulo. Mais separável e fiel à regra real do que um
        # sorteio puramente probabilístico.
        elegivel = (publicadas >= 1) and (u["comp"] >= 55) and (u["atividade"] > 0.12)
        if random.random() < 0.08:  # ruído de rótulo
            elegivel = not elegivel
        u["data_fila"] = rand_dt(u["criado"], NOW) if elegivel else None

    # Atualiza data_entrada_fila nos perfis já montados (mesma ordem)
    perfis = [p[:7] + (m["data_fila"],) + p[8:] for p, m in zip(perfis, users_meta)]

    all_uids = [u["uid"] for u in users_meta]

    # Curtidas — obras de autores mais ativos recebem mais
    curtidas = []
    for o in obras_meta:
        if o["status"] != "PUBLICADA":
            continue
        n_likes = int(o["atividade"] * random.random() * 22)
        if n_likes <= 0:
            continue
        pool = [x for x in all_uids if x != o["uid"]]
        for liker in random.sample(pool, min(n_likes, len(pool))):
            curtidas.append((uuid.uuid4(), o["oid"], liker, rand_dt(o["dt_pub"], NOW)))

    # Comentários
    comentarios = []
    for o in obras_meta:
        if o["status"] != "PUBLICADA" or random.random() > 0.3:
            continue
        pool = [x for x in all_uids if x != o["uid"]]
        for autor in random.sample(pool, min(random.randint(1, 4), len(pool))):
            comentarios.append((uuid.uuid4(), o["oid"], autor,
                                random.choice(TEXTOS_COMENT), rand_dt(o["dt_pub"], NOW)))

    # Seguidores — alvos ponderados pela atividade (popularidade)
    pesos = [u["atividade"] + 0.05 for u in users_meta]
    seguidores, vistos = [], set()
    criado_por_uid = {u["uid"]: u["criado"] for u in users_meta}
    for u in users_meta:
        k = int(u["atividade"] * random.random() * 14)
        if k <= 0:
            continue
        alvos = random.choices(all_uids, weights=pesos, k=k * 2)
        for alvo in alvos:
            if alvo == u["uid"] or (u["uid"], alvo) in vistos:
                continue
            vistos.add((u["uid"], alvo))
            base = max(u["criado"], criado_por_uid[alvo])
            seguidores.append((uuid.uuid4(), u["uid"], alvo, rand_dt(base, NOW)))

    # Mentorias + mensagens
    mentores = [u for u in users_meta if u["config"]]
    perfis_todos = [u["pid"] for u in users_meta]
    mentorias, mensagens = [], []
    for m in mentores:
        for _ in range(random.randint(0, 5)):
            artista_pid = random.choice(perfis_todos)
            if artista_pid == m["pid"]:
                continue
            mid = uuid.uuid4()
            status = random.choices(["ATIVA", "ENCERRADA", "CANCELADA"], weights=[5, 3, 2])[0]
            dt_cri = rand_dt(m["criado"], NOW)
            dt_enc = rand_dt(dt_cri, NOW) if status != "ATIVA" else None
            mentorias.append((mid, m["pid"], artista_pid, status, dt_cri, dt_enc))
            for _ in range(random.randint(0, 8)):
                rem = random.choice([m["pid"], artista_pid])
                mensagens.append((uuid.uuid4(), mid, rem, random.choice(TEXTOS_MSG),
                                  rand_dt(dt_cri, NOW)))

    # Oportunidades simuladas + notificações
    oportunidades, notificacoes = [], []
    if op_amostra:
        op_ids = []
        for j in range(20):
            opid = uuid.uuid4()
            tipo, status, area = random.choice(op_amostra)
            oportunidades.append((
                opid, f"Edital {random.choice(ADJ)} {j}", "Chamada pública simulada.",
                tipo, area or random.choice(AREAS),
                (NOW + timedelta(days=random.randint(5, 120))).date(),
                f"{SIM_OP_LINK_PREFIX}{opid}", status, rand_dt(INICIO, NOW)))
            op_ids.append((opid, tipo))
        for u in users_meta:
            if not u["receber"]:
                continue
            for _ in range(random.randint(0, 4)):
                opid, tipo = random.choice(op_ids)
                notificacoes.append((
                    uuid.uuid4(), u["pid"], opid, f"Nova oportunidade: {tipo}", tipo,
                    (NOW + timedelta(days=random.randint(5, 90))).date(),
                    random.random() < 0.5, rand_dt(u["criado"], NOW)))

    # ---- Inserts em ordem segura de FK ----
    print("Inserindo no banco...")
    insert(cur, "usuarios", ["id", "nome", "email", "senha", "data_criacao", "ativo"], usuarios)
    insert(cur, "perfis_artistas",
           ["id", "usuario_id", "bio", "foto_perfil", "cidade", "area_artistica_principal",
            "percentual_completude", "data_entrada_fila", "receber_notificacoes_oportunidades",
            "disponivel_para_mentorar", "perfil_mentor_configurado", "mentoria_gratuita",
            "valor_hora_mentoria", "descricao_mentoria", "modalidade_mentoria", "cidade_mentoria",
            "onboarding_concluido", "status_etapa_area", "status_etapa_cidade", "status_etapa_bio",
            "status_etapa_tags", "status_etapa_foto", "status_etapa_links", "url_publica"], perfis)
    insert(cur, "perfil_links_externos", ["perfil_id", "link"], links_rows)
    insert(cur, "perfil_tags_necessidade", ["perfil_id", "tag_id"], tnec_rows)
    insert(cur, "perfil_tags_expertise", ["perfil_id", "tag_id"], texp_rows)
    insert(cur, "obras",
           ["id", "titulo", "descricao", "tipo_midia", "url_midia", "data_publicacao",
            "status", "artista_id"], obras)
    insert(cur, "obra_tags", ["obra_id", "tag_id"], obra_tags_rows)
    insert(cur, "curtidas", ["id", "obra_id", "usuario_id", "data_criacao"], curtidas)
    insert(cur, "comentarios", ["id", "obra_id", "autor_id", "texto", "data_criacao"], comentarios)
    insert(cur, "seguidores", ["id", "seguidor_id", "seguido_id", "data_criacao"], seguidores)
    insert(cur, "oportunidades",
           ["id", "titulo", "descricao", "tipo", "area_artistica", "data_encerramento",
            "link_externo", "status", "data_criacao"], oportunidades)
    insert(cur, "notificacoes_oportunidades",
           ["id", "perfil_id", "oportunidade_id", "titulo", "tipo", "data_encerramento",
            "lida", "data_criacao"], notificacoes)
    insert(cur, "mentorias",
           ["id", "mentor_id", "artista_id", "status", "data_criacao", "data_encerramento"], mentorias)
    insert(cur, "mensagens_mentoria",
           ["id", "mentoria_id", "remetente_id", "conteudo", "data_envio"], mensagens)

    conn.commit()
    print("=" * 50)
    print(f"  usuários:      {len(usuarios)}")
    print(f"  obras:         {len(obras)}")
    print(f"  curtidas:      {len(curtidas)}")
    print(f"  comentários:   {len(comentarios)}")
    print(f"  seguidores:    {len(seguidores)}")
    print(f"  mentorias:     {len(mentorias)}")
    print(f"  mensagens:     {len(mensagens)}")
    print(f"  oportunidades: {len(oportunidades)}")
    print(f"  notificações:  {len(notificacoes)}")
    print("=" * 50)
    print("Concluído.")
    conn.close()


if __name__ == "__main__":
    main()
