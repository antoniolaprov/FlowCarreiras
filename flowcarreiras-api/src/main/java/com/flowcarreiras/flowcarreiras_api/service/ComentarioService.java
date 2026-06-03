package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.ComentarioRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.ComentarioResponseDTO;
import com.flowcarreiras.flowcarreiras_api.exception.AcessoNegadoException;
import com.flowcarreiras.flowcarreiras_api.exception.ObraNaoEncontradaException;
import com.flowcarreiras.flowcarreiras_api.model.Comentario;
import com.flowcarreiras.flowcarreiras_api.model.Obra;
import com.flowcarreiras.flowcarreiras_api.model.Usuario;
import com.flowcarreiras.flowcarreiras_api.repository.ComentarioRepository;
import com.flowcarreiras.flowcarreiras_api.repository.ObraRepository;
import com.flowcarreiras.flowcarreiras_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final ObraRepository obraRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<ComentarioResponseDTO> listarPorObra(UUID obraId) {
        if (!obraRepository.existsById(obraId)) {
            throw new ObraNaoEncontradaException(obraId);
        }
        return comentarioRepository.findByObraIdOrderByDataCriacaoDesc(obraId)
                .stream().map(ComentarioResponseDTO::from).toList();
    }

    @Transactional
    public ComentarioResponseDTO criar(UUID obraId, ComentarioRequestDTO dto, String emailAutor) {
        Obra obra = obraRepository.findById(obraId)
                .orElseThrow(() -> new ObraNaoEncontradaException(obraId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(AcessoNegadoException::new);

        Comentario comentario = Comentario.builder()
                .obra(obra)
                .autor(autor)
                .texto(dto.getTexto().trim())
                .build();

        return ComentarioResponseDTO.from(comentarioRepository.save(comentario));
    }
}
