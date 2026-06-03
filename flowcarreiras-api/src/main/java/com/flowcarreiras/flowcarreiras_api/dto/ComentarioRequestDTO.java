package com.flowcarreiras.flowcarreiras_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ComentarioRequestDTO {

    @NotBlank(message = "O comentário não pode estar vazio")
    @Size(max = 1000, message = "O comentário deve ter no máximo 1000 caracteres")
    private String texto;
}
