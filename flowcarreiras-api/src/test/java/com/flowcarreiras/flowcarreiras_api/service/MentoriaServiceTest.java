package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MentoriaConfiguracaoRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.mentoria.MentoriaConfiguracaoResponseDTO;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.Usuario;
import com.flowcarreiras.flowcarreiras_api.model.enums.ModalidadeMentoria;
import com.flowcarreiras.flowcarreiras_api.model.enums.StatusMentoria;
import com.flowcarreiras.flowcarreiras_api.repository.MentoriaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.PerfilArtistaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentoriaServiceTest {

    private static final String EMAIL = "mentor@test.com";

    @Mock private PerfilArtistaRepository perfilArtistaRepository;
    @Mock private TagRepository tagRepository;
    @Mock private MentoriaRepository mentoriaRepository;

    @InjectMocks
    private MentoriaService service;

    private Usuario usuario(String nome, String email) {
        return Usuario.builder().id(UUID.randomUUID()).nome(nome).email(email).ativo(true).build();
    }

    private PerfilArtista mentorValido() {
        Set<Tag> expertise = new HashSet<>();
        expertise.add(Tag.builder().id(UUID.randomUUID()).nome("musica").build());
        return PerfilArtista.builder()
                .id(UUID.randomUUID())
                .usuario(usuario("Mentor", EMAIL))
                .perfilMentorConfigurado(true)
                .disponivelParaMentorar(true)
                .mentoriaGratuita(true)
                .descricaoMentoria("Ofereco mentoria em producao musical")
                .modalidadeMentoria(ModalidadeMentoria.REMOTA)
                .tagsExpertise(expertise)
                .build();
    }

    private MentoriaConfiguracaoRequestDTO config(Boolean gratuita, String modalidade, List<UUID> tagsExpertiseIds) {
        MentoriaConfiguracaoRequestDTO dto = new MentoriaConfiguracaoRequestDTO();
        dto.setMentoriaGratuita(gratuita);
        dto.setDescricaoMentoria("Ofereco mentoria");
        dto.setModalidadeMentoria(modalidade);
        dto.setTagsExpertiseIds(tagsExpertiseIds);
        return dto;
    }

    // --- Validacao de configuracao (Historia 3.1 / 3.2) ---

    @Test
    void salvarConfiguracaoFalhaSemTagsDeExpertise() {
        PerfilArtista perfil = PerfilArtista.builder().id(UUID.randomUUID()).usuario(usuario("Ana", EMAIL)).build();
        MentoriaConfiguracaoRequestDTO dto = config(true, "REMOTA", null);

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));

        assertThrows(IllegalArgumentException.class, () -> service.salvarConfiguracao(EMAIL, dto));
        verify(perfilArtistaRepository, never()).save(any());
    }

    @Test
    void salvarConfiguracaoPagaFalhaSemValor() {
        PerfilArtista perfil = PerfilArtista.builder().id(UUID.randomUUID()).usuario(usuario("Ana", EMAIL)).build();
        MentoriaConfiguracaoRequestDTO dto = config(false, "REMOTA", null);
        dto.setValorHoraMentoria(null);

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));

        assertThrows(IllegalArgumentException.class, () -> service.salvarConfiguracao(EMAIL, dto));
    }

    @Test
    void salvarConfiguracaoValidaAtivaMentoriaNaPrimeiraVez() {
        PerfilArtista perfil = PerfilArtista.builder().id(UUID.randomUUID()).usuario(usuario("Ana", EMAIL)).build();
        Tag tag = Tag.builder().id(UUID.randomUUID()).nome("musica").build();
        MentoriaConfiguracaoRequestDTO dto = config(true, "REMOTA", List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(perfilArtistaRepository.save(perfil)).thenReturn(perfil);

        MentoriaConfiguracaoResponseDTO resultado = service.salvarConfiguracao(EMAIL, dto);

        assertTrue(resultado.getPerfilMentorConfigurado());
        assertTrue(resultado.getDisponivelParaMentorar());
    }

    @Test
    void pausarDesativaDisponibilidade() {
        PerfilArtista mentor = mentorValido();

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(perfilArtistaRepository.save(mentor)).thenReturn(mentor);

        MentoriaConfiguracaoResponseDTO resultado = service.pausar(EMAIL);

        assertFalse(resultado.getDisponivelParaMentorar());
    }

    // --- selecionarArtista: guardas (modelo atual: selecao direta pelo mentor) ---

    @Test
    void selecionarArtistaFalhaQuandoMentorNaoConfigurado() {
        PerfilArtista mentor = mentorValido();
        mentor.setPerfilMentorConfigurado(false);

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(mentor));

        assertThrows(IllegalArgumentException.class, () -> service.selecionarArtista(EMAIL, UUID.randomUUID()));
        verify(mentoriaRepository, never()).save(any());
    }

    @Test
    void selecionarArtistaFalhaAoSelecionarOProprioPerfil() {
        PerfilArtista mentor = mentorValido();

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(perfilArtistaRepository.buscarPorIdComLock(mentor.getId())).thenReturn(Optional.of(mentor));

        assertThrows(IllegalArgumentException.class, () -> service.selecionarArtista(EMAIL, mentor.getId()));
        verify(mentoriaRepository, never()).save(any());
    }

    @Test
    void selecionarArtistaFalhaQuandoArtistaJaTemMentoriaAtiva() {
        PerfilArtista mentor = mentorValido();
        PerfilArtista artista = PerfilArtista.builder()
                .id(UUID.randomUUID())
                .usuario(usuario("Bia", "bia@test.com"))
                .build();

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(mentor));
        when(perfilArtistaRepository.buscarPorIdComLock(artista.getId())).thenReturn(Optional.of(artista));
        when(mentoriaRepository.existsByArtistaIdAndStatus(artista.getId(), StatusMentoria.ATIVA)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.selecionarArtista(EMAIL, artista.getId()));
        verify(mentoriaRepository, never()).save(any());
    }
}
