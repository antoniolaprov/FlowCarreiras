package com.flowcarreiras.flowcarreiras_api.dto;

import com.flowcarreiras.flowcarreiras_api.model.Comentario;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ComentarioResponseDTO {

    private UUID id;
    private String texto;
    private LocalDateTime dataCriacao;
    private UUID autorId;
    private String autorNome;

    public static ComentarioResponseDTO from(Comentario comentario) {
        return ComentarioResponseDTO.builder()
                .id(comentario.getId())
                .texto(comentario.getTexto())
                .dataCriacao(comentario.getDataCriacao())
                .autorId(comentario.getAutor().getId())
                .autorNome(comentario.getAutor().getNome())
                .build();
    }
}
