package com.flowcarreiras.flowcarreiras_api.dto.mentoria;

import com.flowcarreiras.flowcarreiras_api.model.MensagemMentoria;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MensagemResponseDTO {

    private UUID id;
    private String conteudo;
    private LocalDateTime dataEnvio;
    private UUID remetenteId;
    private String remetenteNome;
    private boolean ehMinha;

    public static MensagemResponseDTO from(MensagemMentoria mensagem, UUID perfilSolicitanteId) {
        return MensagemResponseDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .remetenteId(mensagem.getRemetente().getId())
                .remetenteNome(mensagem.getRemetente().getUsuario().getNome())
                .ehMinha(mensagem.getRemetente().getId().equals(perfilSolicitanteId))
                .build();
    }
}
