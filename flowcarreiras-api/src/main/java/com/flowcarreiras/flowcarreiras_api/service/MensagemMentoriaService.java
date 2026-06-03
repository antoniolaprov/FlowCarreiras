package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MensagemRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MensagemResponseDTO;
import com.flowcarreiras.flowcarreiras_api.exception.AcessoNegadoException;
import com.flowcarreiras.flowcarreiras_api.model.MensagemMentoria;
import com.flowcarreiras.flowcarreiras_api.model.Mentoria;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.enums.StatusMentoria;
import com.flowcarreiras.flowcarreiras_api.repository.MensagemMentoriaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.MentoriaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.PerfilArtistaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MensagemMentoriaService {

    private final MensagemMentoriaRepository mensagemRepository;
    private final MentoriaRepository mentoriaRepository;
    private final PerfilArtistaRepository perfilArtistaRepository;

    @Transactional(readOnly = true)
    public List<MensagemResponseDTO> listarMensagens(String email, UUID mentoriaId) {
        PerfilArtista perfil = buscarPerfilPorEmail(email);
        Mentoria mentoria = buscarMentoriaComoParticipante(mentoriaId, perfil);

        return mensagemRepository.findByMentoriaIdOrderByDataEnvioAsc(mentoria.getId())
                .stream()
                .map(m -> MensagemResponseDTO.from(m, perfil.getId()))
                .toList();
    }

    @Transactional
    public MensagemResponseDTO enviar(String email, UUID mentoriaId, MensagemRequestDTO dto) {
        PerfilArtista perfil = buscarPerfilPorEmail(email);
        Mentoria mentoria = buscarMentoriaComoParticipante(mentoriaId, perfil);

        if (mentoria.getStatus() != StatusMentoria.ATIVA) {
            throw new IllegalArgumentException("Não é possível enviar mensagens em uma mentoria encerrada");
        }

        MensagemMentoria mensagem = MensagemMentoria.builder()
                .mentoria(mentoria)
                .remetente(perfil)
                .conteudo(dto.getConteudo().trim())
                .build();

        return MensagemResponseDTO.from(mensagemRepository.save(mensagem), perfil.getId());
    }

    private PerfilArtista buscarPerfilPorEmail(String email) {
        return perfilArtistaRepository.findByUsuarioEmail(email)
                .orElseThrow(AcessoNegadoException::new);
    }

    // Garante que a mentoria existe e que o perfil é um de seus participantes (mentor ou artista).
    private Mentoria buscarMentoriaComoParticipante(UUID mentoriaId, PerfilArtista perfil) {
        Mentoria mentoria = mentoriaRepository.findById(mentoriaId)
                .orElseThrow(() -> new AcessoNegadoException("Mentoria não encontrada"));

        boolean participante = mentoria.getMentor().getId().equals(perfil.getId())
                || mentoria.getArtista().getId().equals(perfil.getId());
        if (!participante) {
            throw new AcessoNegadoException("Você não participa desta mentoria");
        }
        return mentoria;
    }
}
