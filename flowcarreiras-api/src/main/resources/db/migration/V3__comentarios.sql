CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY,
    obra_id UUID NOT NULL,
    autor_id UUID NOT NULL,
    texto VARCHAR(1000) NOT NULL,
    data_criacao TIMESTAMP NOT NULL,
    CONSTRAINT fk_comentario_obra FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_comentario_obra_data ON comentarios(obra_id, data_criacao);
