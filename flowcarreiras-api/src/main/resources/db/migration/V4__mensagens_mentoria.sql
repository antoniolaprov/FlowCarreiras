CREATE TABLE IF NOT EXISTS mensagens_mentoria (
    id UUID PRIMARY KEY,
    mentoria_id UUID NOT NULL,
    remetente_id UUID NOT NULL,
    conteudo VARCHAR(2000) NOT NULL,
    data_envio TIMESTAMP NOT NULL,
    CONSTRAINT fk_msg_mentoria FOREIGN KEY (mentoria_id) REFERENCES mentorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_remetente FOREIGN KEY (remetente_id) REFERENCES perfis_artistas(id)
);

CREATE INDEX IF NOT EXISTS idx_msg_mentoria_data ON mensagens_mentoria(mentoria_id, data_envio);
