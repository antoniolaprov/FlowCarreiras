ALTER TABLE perfis_artistas
ADD COLUMN IF NOT EXISTS status_etapa_foto varchar(255);

ALTER TABLE perfis_artistas
ADD COLUMN IF NOT EXISTS status_etapa_links varchar(255);

UPDATE perfis_artistas
SET status_etapa_foto = 'PENDENTE'
WHERE status_etapa_foto IS NULL;

UPDATE perfis_artistas
SET status_etapa_links = 'PENDENTE'
WHERE status_etapa_links IS NULL;

ALTER TABLE perfis_artistas
ALTER COLUMN status_etapa_foto SET NOT NULL;

ALTER TABLE perfis_artistas
ALTER COLUMN status_etapa_links SET NOT NULL;
