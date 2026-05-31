package com.flowcarreiras.flowcarreiras_api.repository;

import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.Usuario;
import com.flowcarreiras.flowcarreiras_api.model.enums.CategoriaTag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class PerfilArtistaRepositoryTest {

    @Autowired
    private PerfilArtistaRepository perfilArtistaRepository;

    @Autowired
    private TestEntityManager em;

    private Tag tag(String nome) {
        Tag tag = Tag.builder().nome(nome).categoria(CategoriaTag.AREA_ARTISTICA).build();
        em.persist(tag);
        return tag;
    }

    private Usuario usuario(String nome, String email, boolean ativo) {
        Usuario u = Usuario.builder().nome(nome).email(email).senha("hash").ativo(ativo).build();
        em.persist(u);
        return u;
    }

    private PerfilArtista.PerfilArtistaBuilder base(String nome, String email, String url, boolean ativo) {
        return PerfilArtista.builder()
                .usuario(usuario(nome, email, ativo))
                .urlPublica(url);
    }

    @Test
    void listarMentoresAtivosRetornaApenasMentoresDisponiveis() {
        PerfilArtista mentor = base("Mentor", "mentor@test.com", "mentor", true)
                .perfilMentorConfigurado(true).disponivelParaMentorar(true).build();
        PerfilArtista pausado = base("Pausado", "pausado@test.com", "pausado", true)
                .perfilMentorConfigurado(true).disponivelParaMentorar(false).build();
        PerfilArtista comum = base("Comum", "comum@test.com", "comum", true).build();
        em.persist(mentor);
        em.persist(pausado);
        em.persist(comum);
        em.flush();

        List<PerfilArtista> mentores = perfilArtistaRepository.listarMentoresAtivos();

        assertThat(mentores).extracting(p -> p.getUsuario().getNome()).containsExactly("Mentor");
    }

    @Test
    void listarParaRotacaoFilaRetornaPerfisComEntradaAntigaAteOLimite() {
        LocalDateTime agora = LocalDateTime.now();
        PerfilArtista antigo = base("Antigo", "antigo@test.com", "antigo", true)
                .dataEntradaFila(agora.minusHours(60)).build();
        PerfilArtista recente = base("Recente", "recente@test.com", "recente", true)
                .dataEntradaFila(agora.minusHours(1)).build();
        PerfilArtista semFila = base("SemFila", "semfila@test.com", "semfila", true).build();
        em.persist(antigo);
        em.persist(recente);
        em.persist(semFila);
        em.flush();

        List<PerfilArtista> paraRotacao = perfilArtistaRepository
                .listarParaRotacaoFila(agora.minusHours(48));

        assertThat(paraRotacao).extracting(p -> p.getUsuario().getNome()).containsExactly("Antigo");
    }

    @Test
    void listarPerfisParaNotificacoesCruzaTagsERespeitaPreferencia() {
        Tag musica = tag("musica");

        Set<Tag> comTag = new HashSet<>(Set.of(musica));
        PerfilArtista interessado = base("Interessado", "int@test.com", "int", true)
                .receberNotificacoesOportunidades(true).tagsNecessidade(comTag).build();
        PerfilArtista optOut = base("OptOut", "opt@test.com", "opt", true)
                .receberNotificacoesOportunidades(false).tagsNecessidade(new HashSet<>(Set.of(musica))).build();
        PerfilArtista semTag = base("SemTag", "semtag@test.com", "semtag", true)
                .receberNotificacoesOportunidades(true).build();
        em.persist(interessado);
        em.persist(optOut);
        em.persist(semTag);
        em.flush();

        List<PerfilArtista> perfis = perfilArtistaRepository
                .listarPerfisParaNotificacoes(Set.of(musica));

        assertThat(perfis).extracting(p -> p.getUsuario().getNome()).containsExactly("Interessado");
    }
}
