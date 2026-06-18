"""
Adiciona comentários VARIADOS e distintos nas obras publicadas simuladas.

Os comentários do seed original repetiam ~8 frases; aqui usamos um pool grande
e amostramos sem reposição por obra, de modo que cada obra recebe comentários
distintos entre si. Autores são outros usuários simulados (nunca o próprio autor
da obra), com data entre a publicação e agora.

Uso (no container do dashboard, que tem psycopg2 e acesso ao banco):
    docker compose exec -T dashboard python - < scripts/seed_comentarios.py
"""

import os
import random
import uuid
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values, register_uuid

register_uuid()
random.seed(7)

SIM = "%@sim.flowcarreiras.dev"
NOW = datetime.now()

COMENTARIOS = [
    "Que paleta de cores incrível!", "A composição ficou equilibrada demais.",
    "Senti uma atmosfera melancólica, muito bom.", "O uso da luz aqui está impecável.",
    "Isso me lembrou a arte de rua de Recife.", "A textura transmite muita emoção.",
    "Trabalho corajoso, fugiu do óbvio.", "Adorei o contraste entre o claro e o escuro.",
    "O ritmo da peça é hipnótico.", "Ficou com uma pegada bem autoral.",
    "A narrativa visual é forte.", "Que técnica refinada!",
    "Esse enquadramento conta uma história.", "Muito original, nunca vi nada parecido.",
    "A simplicidade aqui é a força do trabalho.", "Dá pra sentir o movimento mesmo parado.",
    "O som casou perfeitamente com a proposta.", "Emocionante do início ao fim.",
    "Você tem uma identidade visual muito clara.", "Esse projeto merece mais visibilidade.",
    "A escolha dos materiais foi certeira.", "Ficou poético sem ser pretensioso.",
    "A edição está limpa e precisa.", "Curti a ousadia na mistura de estilos.",
    "Transmite identidade nordestina com força.", "O detalhe no fundo faz toda a diferença.",
    "Sensível e potente ao mesmo tempo.", "Que domínio de espaço negativo!",
    "Inspirador pra quem está começando.", "A vulnerabilidade nesse trabalho é linda.",
    "Parabéns, virou referência pra mim.", "O timing das transições ficou ótimo.",
    "Cada elemento parece intencional.", "A trilha eleva muito a obra.",
    "Tem uma melancolia urbana que me pegou.", "Excelente uso de sombras.",
    "Visualmente coeso e maduro.", "Esse trabalho respira.",
    "A proposta conceitual é forte.", "Contemporâneo e atemporal ao mesmo tempo.",
    "Que sensibilidade na captação.", "Adoraria ver isso impresso em grande formato.",
    "A direção de arte está impecável.", "Você conseguiu emocionar com pouco.",
    "Tem uma honestidade que conecta.", "Trabalho com alma.",
    "O gesto artístico aqui é evidente.", "Belíssimo, do conceito à execução.",
    "Isso aqui é identidade pura.", "Que achado estético!",
]


def main():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "db"), port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "flowcarreiras"),
        user=os.getenv("DB_USER", "postgres"), password=os.getenv("DB_PASSWORD", "postgres"))
    cur = conn.cursor()

    cur.execute("""SELECT o.id, o.data_publicacao, u.id
                   FROM obras o JOIN perfis_artistas p ON p.id=o.artista_id
                   JOIN usuarios u ON u.id=p.usuario_id
                   WHERE o.status='PUBLICADA' AND u.email LIKE %s""", (SIM,))
    obras = cur.fetchall()
    cur.execute("SELECT id FROM usuarios WHERE email LIKE %s", (SIM,))
    uids = [r[0] for r in cur.fetchall()]
    print(f"obras publicadas: {len(obras)} | usuários: {len(uids)}")

    rows = []
    for oid, dt_pub, autor in obras:
        k = random.choices([0, 1, 2, 3, 4], weights=[2, 3, 3, 2, 1])[0]
        if k == 0:
            continue
        textos = random.sample(COMENTARIOS, min(k, len(COMENTARIOS)))
        pool = [u for u in uids if u != autor]
        if not pool:
            continue
        span = (NOW - dt_pub)
        for txt in textos:
            dt = dt_pub + span * random.random() if span.total_seconds() > 0 else NOW
            rows.append((uuid.uuid4(), oid, random.choice(pool), txt, dt))

    execute_values(cur,
                   "INSERT INTO comentarios (id, obra_id, autor_id, texto, data_criacao) VALUES %s",
                   rows, page_size=1000)
    conn.commit()
    print(f"comentários distintos inseridos: {len(rows)}")
    conn.close()


if __name__ == "__main__":
    main()
