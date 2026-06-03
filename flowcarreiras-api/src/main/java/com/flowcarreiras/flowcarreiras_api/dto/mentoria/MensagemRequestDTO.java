package com.flowcarreiras.flowcarreiras_api.dto.mentoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MensagemRequestDTO {

    @NotBlank(message = "A mensagem não pode estar vazia")
    @Size(max = 2000, message = "A mensagem deve ter no máximo 2000 caracteres")
    private String conteudo;
}
