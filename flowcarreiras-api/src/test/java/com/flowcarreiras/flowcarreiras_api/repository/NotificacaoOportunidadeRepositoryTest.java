package com.flowcarreiras.flowcarreiras_api.repository;

import com.flowcarreiras.flowcarreiras_api.model.NotificacaoOportunidade;
import com.flowcarreiras.flowcarreiras_api.model.Oportunidade;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Usuario;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeStatus;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeTipo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NotificacaoOportunidadeRepositoryTest {

    @Autowired
    private NotificacaoOportunidadeRepository notificacaoRepository;

    @Autowired
    private TestEntityManager em;

    private PerfilArtista perfil(String email, String url) {
        Usuario u = Usuario.builder().nome("Artista").email(email).senha("hash").ativo(true).build();
        em.persist(u);
        PerfilArtista p = PerfilArtista.builder().usuario(u).urlPublica(url).build();
        em.persist(p);
        return p;
    }

    private Oportunidade oportunidade(String titulo) {
        Oportunidade op = Oportunidade.builder()
                .titulo(titulo)
                .tipo(OportunidadeTipo.EDITAL)
                .areaArtistica("Musica")
                .dataEncerramento(LocalDate.now().plusDays(10))
                .linkExterno("https://exemplo.com")
                .status(OportunidadeStatus.ATIVA)
                .build();
        em.persist(op);
        return op;
    }

    private NotificacaoOportunidade notificacao(PerfilArtista perfil, Oportunidade op, boolean lida) {
        NotificacaoOportunidade n = NotificacaoOportunidade.builder()
                .perfil(perfil)
                .oportunidade(op)
                .titulo(op.getTitulo())
                .tipo(op.getTipo().name())
                .dataEncerramento(op.getDataEncerramento())
                .lida(lida)
                .build();
        em.persist(n);
        return n;
    }

    @Test
    void contaApenasNaoLidasDoPerfil() {
        PerfilArtista perfil = perfil("a@test.com", "a");
        Oportunidade op = oportunidade("Edital A");
        notificacao(perfil, op, false);
        notificacao(perfil, oportunidade("Edital B"), false);
        notificacao(perfil, oportunidade("Edital C"), true);
        em.flush();

        assertThat(notificacaoRepository.countByPerfilIdAndLidaFalse(perfil.getId())).isEqualTo(2);
    }

    @Test
    void existsPorPerfilEOportunidadeDetectaDuplicidade() {
        PerfilArtista perfil = perfil("b@test.com", "b");
        Oportunidade op = oportunidade("Edital X");
        notificacao(perfil, op, false);
        em.flush();

        assertThat(notificacaoRepository.existsByPerfilIdAndOportunidadeId(perfil.getId(), op.getId())).isTrue();
        assertThat(notificacaoRepository.existsByPerfilIdAndOportunidadeId(perfil.getId(),
                oportunidade("Outra").getId())).isFalse();
    }

    @Test
    void contaNotificacoesCriadasNoIntervaloDoDia() {
        PerfilArtista perfil = perfil("c@test.com", "c");
        notificacao(perfil, oportunidade("Edital 1"), false);
        notificacao(perfil, oportunidade("Edital 2"), false);
        em.flush();

        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = inicio.plusDays(1);

        assertThat(notificacaoRepository.countByPerfilIdAndDataCriacaoBetween(perfil.getId(), inicio, fim))
                .isEqualTo(2);
    }
}
