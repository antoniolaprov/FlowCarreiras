package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.exception.AcessoNegadoException;
import com.flowcarreiras.flowcarreiras_api.model.NotificacaoOportunidade;
import com.flowcarreiras.flowcarreiras_api.model.Oportunidade;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeStatus;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeTipo;
import com.flowcarreiras.flowcarreiras_api.repository.NotificacaoOportunidadeRepository;
import com.flowcarreiras.flowcarreiras_api.repository.PerfilArtistaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacaoOportunidadeServiceTest {

    @Mock
    private NotificacaoOportunidadeRepository notificacaoRepository;

    @Mock
    private PerfilArtistaRepository perfilArtistaRepository;

    @InjectMocks
    private NotificacaoOportunidadeService service;

    private PerfilArtista perfil() {
        return PerfilArtista.builder().id(UUID.randomUUID()).build();
    }

    private Oportunidade oportunidade(LocalDate dataEncerramento, boolean comTags) {
        Set<Tag> tags = new HashSet<>();
        if (comTags) {
            tags.add(Tag.builder().id(UUID.randomUUID()).nome("musica").build());
        }
        return Oportunidade.builder()
                .id(UUID.randomUUID())
                .titulo("Edital de Musica")
                .tipo(OportunidadeTipo.EDITAL)
                .areaArtistica("Musica")
                .dataEncerramento(dataEncerramento)
                .linkExterno("https://exemplo.com")
                .status(OportunidadeStatus.ATIVA)
                .dataCriacao(LocalDateTime.now())
                .tags(tags)
                .build();
    }

    @Test
    void criaNotificacaoParaPerfilCompativel() {
        PerfilArtista perfil = perfil();
        Oportunidade op = oportunidade(LocalDate.now().plusDays(5), true);

        when(perfilArtistaRepository.listarPerfisParaNotificacoes(anySet())).thenReturn(List.of(perfil));
        when(notificacaoRepository.existsByPerfilIdAndOportunidadeId(perfil.getId(), op.getId())).thenReturn(false);
        when(notificacaoRepository.countByPerfilIdAndDataCriacaoBetween(eq(perfil.getId()), any(), any())).thenReturn(0L);

        service.notificarNovaOportunidade(op);

        verify(notificacaoRepository).save(any(NotificacaoOportunidade.class));
    }

    @Test
    void naoNotificaQuandoPrazoMenorQue24h() {
        Oportunidade op = oportunidade(LocalDate.now(), true);

        service.notificarNovaOportunidade(op);

        verify(notificacaoRepository, never()).save(any());
    }

    @Test
    void naoNotificaQuandoOportunidadeSemTags() {
        Oportunidade op = oportunidade(LocalDate.now().plusDays(5), false);

        service.notificarNovaOportunidade(op);

        verify(notificacaoRepository, never()).save(any());
    }

    @Test
    void naoDuplicaNotificacaoExistente() {
        PerfilArtista perfil = perfil();
        Oportunidade op = oportunidade(LocalDate.now().plusDays(5), true);

        when(perfilArtistaRepository.listarPerfisParaNotificacoes(anySet())).thenReturn(List.of(perfil));
        when(notificacaoRepository.existsByPerfilIdAndOportunidadeId(perfil.getId(), op.getId())).thenReturn(true);

        service.notificarNovaOportunidade(op);

        verify(notificacaoRepository, never()).save(any());
    }

    @Test
    void respeitaLimiteDiarioDe3Notificacoes() {
        PerfilArtista perfil = perfil();
        Oportunidade op = oportunidade(LocalDate.now().plusDays(5), true);

        when(perfilArtistaRepository.listarPerfisParaNotificacoes(anySet())).thenReturn(List.of(perfil));
        when(notificacaoRepository.existsByPerfilIdAndOportunidadeId(perfil.getId(), op.getId())).thenReturn(false);
        when(notificacaoRepository.countByPerfilIdAndDataCriacaoBetween(eq(perfil.getId()), any(), any())).thenReturn(3L);

        service.notificarNovaOportunidade(op);

        verify(notificacaoRepository, never()).save(any());
    }

    @Test
    void marcarComoLidaAtualizaQuandoPertenceAoPerfil() {
        PerfilArtista perfil = perfil();
        UUID notifId = UUID.randomUUID();
        NotificacaoOportunidade notif = NotificacaoOportunidade.builder()
                .id(notifId).perfil(perfil).lida(false).build();

        when(perfilArtistaRepository.findByUsuarioEmail("artista@test.com")).thenReturn(Optional.of(perfil));
        when(notificacaoRepository.findById(notifId)).thenReturn(Optional.of(notif));

        service.marcarComoLida(notifId, "artista@test.com");

        assertTrue(notif.getLida());
        verify(notificacaoRepository).save(notif);
    }

    @Test
    void marcarComoLidaFalhaQuandoNotificacaoNaoExiste() {
        PerfilArtista perfil = perfil();
        UUID notifId = UUID.randomUUID();

        when(perfilArtistaRepository.findByUsuarioEmail("artista@test.com")).thenReturn(Optional.of(perfil));
        when(notificacaoRepository.findById(notifId)).thenReturn(Optional.empty());

        assertThrows(AcessoNegadoException.class, () -> service.marcarComoLida(notifId, "artista@test.com"));
        verify(notificacaoRepository, never()).save(any());
    }

    @Test
    void marcarComoLidaFalhaQuandoPertenceAOutroPerfil() {
        PerfilArtista dono = perfil();
        PerfilArtista intruso = perfil();
        UUID notifId = UUID.randomUUID();
        NotificacaoOportunidade notif = NotificacaoOportunidade.builder()
                .id(notifId).perfil(dono).lida(false).build();

        when(perfilArtistaRepository.findByUsuarioEmail("intruso@test.com")).thenReturn(Optional.of(intruso));
        when(notificacaoRepository.findById(notifId)).thenReturn(Optional.of(notif));

        assertThrows(AcessoNegadoException.class, () -> service.marcarComoLida(notifId, "intruso@test.com"));
        verify(notificacaoRepository, never()).save(any());
    }
}
