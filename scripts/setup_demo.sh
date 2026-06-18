#!/usr/bin/env bash
#
# Popula a plataforma com o dataset de demonstração:
#   - 400 perfis simulados (seed_simulado.py)
#   - comentários distintos nas obras (seed_comentarios.py)
#   - usuário-vitrine "Tiago" (mentor + mentorado, com fotos nos mentores e
#     e-mail curto de login tiago@test.com)
#
# Uso: rode num banco recém-criado, DEPOIS de `docker compose up -d`:
#   bash scripts/setup_demo.sh
#
# Para reexecutar do zero: `docker compose down -v && docker compose up -d` e rode de novo.

set -e
cd "$(dirname "$0")/.."

echo "==> Aguardando o seed base do backend (usuários de teste)..."
until docker compose exec -T db psql -U postgres -d flowcarreiras -tAc \
      "SELECT 1 FROM usuarios WHERE email='ana@test.com'" 2>/dev/null | grep -q 1; do
  sleep 3
done

echo "==> 1/3 Gerando 400 perfis simulados..."
docker compose exec -T dashboard python - < scripts/seed_simulado.py

echo "==> 2/3 Inserindo comentários distintos..."
docker compose exec -T dashboard python - < scripts/seed_comentarios.py

echo "==> 3/3 Configurando usuário-vitrine (Tiago) e fotos dos mentores..."
docker compose exec -T db psql -U postgres -d flowcarreiras -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

-- Tiago (perfil simulado de índice 243) como mentor configurado
UPDATE perfis_artistas p SET
  disponivel_para_mentorar  = true,
  perfil_mentor_configurado = true,
  mentoria_gratuita         = false,
  valor_hora_mentoria       = 120.00,
  modalidade_mentoria       = 'HIBRIDA',
  cidade_mentoria           = COALESCE(p.cidade, 'Olinda'),
  descricao_mentoria        = 'Mentoria em construção de portfólio, carreira artística e estratégias de divulgação para artistas emergentes.'
FROM usuarios u
WHERE u.id = p.usuario_id AND u.email = 'tiago-silva.243@sim.flowcarreiras.dev';

-- Tiago como mentor (orienta alguém) e como mentorado (orientado por outro mentor)
WITH t AS (SELECT p.id FROM perfis_artistas p JOIN usuarios u ON u.id=p.usuario_id
           WHERE u.email='tiago-silva.243@sim.flowcarreiras.dev'),
mentor AS (SELECT id FROM perfis_artistas
           WHERE perfil_mentor_configurado=true AND id <> (SELECT id FROM t) LIMIT 1),
mentee AS (SELECT id FROM perfis_artistas
           WHERE id NOT IN ((SELECT id FROM t),(SELECT id FROM mentor)) LIMIT 1)
INSERT INTO mentorias (id, mentor_id, artista_id, status, data_criacao)
SELECT gen_random_uuid(), (SELECT id FROM t),      (SELECT id FROM mentee), 'ATIVA', now()
UNION ALL
SELECT gen_random_uuid(), (SELECT id FROM mentor), (SELECT id FROM t),      'ATIVA', now();

-- Algumas obras em rascunho para o Tiago (imagens com placeholder válido)
WITH t AS (SELECT p.id FROM perfis_artistas p JOIN usuarios u ON u.id=p.usuario_id
           WHERE u.email='tiago-silva.243@sim.flowcarreiras.dev')
INSERT INTO obras (id, titulo, descricao, tipo_midia, url_midia, data_publicacao, status, artista_id)
SELECT gen_random_uuid(), v.titulo, 'Rascunho em andamento.', v.tipo,
       CASE WHEN v.tipo='IMAGEM'
            THEN 'https://picsum.photos/seed/'||gen_random_uuid()::text||'/600/600'
            ELSE '/uploads/sim/'||gen_random_uuid()::text||'.bin' END,
       now(), 'RASCUNHO', (SELECT id FROM t)
FROM (VALUES ('Ensaio inacabado','IMAGEM'), ('Esboço noturno','IMAGEM'),
             ('Demo instrumental','AUDIO'), ('Videoarte (corte bruto)','VIDEO'),
             ('Série urbana — WIP','IMAGEM')) AS v(titulo, tipo);

-- Fotos (avatar) em todos os mentores ativos
UPDATE perfis_artistas
SET foto_perfil = 'https://i.pravatar.cc/300?u=' || usuario_id::text
WHERE disponivel_para_mentorar = true;

-- E-mail curto para o usuário-vitrine (login: tiago@test.com / senha123)
UPDATE usuarios SET email = 'tiago@test.com'
WHERE email = 'tiago-silva.243@sim.flowcarreiras.dev'
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email='tiago@test.com');

COMMIT;
SQL

echo "==> Concluído!  Login de teste: tiago@test.com / senha123  ·  http://localhost"
