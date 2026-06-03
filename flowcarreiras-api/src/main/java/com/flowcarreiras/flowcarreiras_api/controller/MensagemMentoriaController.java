package com.flowcarreiras.flowcarreiras_api.controller;

import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MensagemRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MensagemResponseDTO;
import com.flowcarreiras.flowcarreiras_api.service.MensagemMentoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mentorias/{mentoriaId}/mensagens")
@RequiredArgsConstructor
public class MensagemMentoriaController {

    private final MensagemMentoriaService mensagemService;

    // Autenticado — apenas participantes da mentoria (validado no service)
    @GetMapping
    ResponseEntity<List<MensagemResponseDTO>> listar(
            @PathVariable UUID mentoriaId, Authentication auth) {
        return ResponseEntity.ok(mensagemService.listarMensagens(auth.getName(), mentoriaId));
    }

    @PostMapping
    ResponseEntity<MensagemResponseDTO> enviar(
            @PathVariable UUID mentoriaId,
            @RequestBody @Valid MensagemRequestDTO dados,
            Authentication auth) {
        MensagemResponseDTO response = mensagemService.enviar(auth.getName(), mentoriaId, dados);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
