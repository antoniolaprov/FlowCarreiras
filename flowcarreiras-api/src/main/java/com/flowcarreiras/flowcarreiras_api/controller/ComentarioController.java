package com.flowcarreiras.flowcarreiras_api.controller;

import com.flowcarreiras.flowcarreiras_api.dto.ComentarioRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.ComentarioResponseDTO;
import com.flowcarreiras.flowcarreiras_api.service.ComentarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/obras/{obraId}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioService comentarioService;

    // Público — qualquer visitante pode ler os comentários de uma obra
    @GetMapping
    ResponseEntity<List<ComentarioResponseDTO>> listar(@PathVariable UUID obraId) {
        return ResponseEntity.ok(comentarioService.listarPorObra(obraId));
    }

    // Autenticado — apenas usuários logados podem comentar
    @PostMapping
    ResponseEntity<ComentarioResponseDTO> comentar(
            @PathVariable UUID obraId,
            @RequestBody @Valid ComentarioRequestDTO dados,
            @AuthenticationPrincipal UserDetails userDetails) {

        ComentarioResponseDTO response = comentarioService.criar(obraId, dados, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
