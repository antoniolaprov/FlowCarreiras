package com.flowcarreiras.flowcarreiras_api.repository;

import com.flowcarreiras.flowcarreiras_api.model.Oportunidade;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeStatus;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeTipo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class OportunidadeRepositoryTest {

    @Autowired
    private OportunidadeRepository oportunidadeRepository;

    @Autowired
    private TestEntityManager em;

    private Oportunidade nova(String titulo, OportunidadeStatus status, LocalDate fim) {
        Oportunidade op = Oportunidade.builder()
                .titulo(titulo)
                .tipo(OportunidadeTipo.EDITAL)
                .areaArtistica("Musica")
                .dataEncerramento(fim)
                .linkExterno("https://exemplo.com")
                .status(status)
                .build();
        em.persist(op);
        return op;
    }

    @Test
    void listaApenasAtivasNaoVencidasOrdenadasPorEncerramento() {
        nova("Vence depois", OportunidadeStatus.ATIVA, LocalDate.now().plusDays(20));
        nova("Vence antes", OportunidadeStatus.ATIVA, LocalDate.now().plusDays(5));
        nova("Ja expirada", OportunidadeStatus.EXPIRADA, LocalDate.now().plusDays(5));
        em.flush();

        List<Oportunidade> ativas = oportunidadeRepository
                .findByStatusAndDataEncerramentoGreaterThanEqualOrderByDataEncerramentoAsc(
                        OportunidadeStatus.ATIVA, LocalDate.now());

        assertThat(ativas).extracting(Oportunidade::getTitulo)
                .containsExactly("Vence antes", "Vence depois");
    }

    @Test
    void expirarAntesDeMarcaSomenteAsAtivasVencidas() {
        Oportunidade vencida = nova("Vencida", OportunidadeStatus.ATIVA, LocalDate.now().minusDays(1));
        Oportunidade vigente = nova("Vigente", OportunidadeStatus.ATIVA, LocalDate.now().plusDays(3));
        em.flush();

        int afetadas = oportunidadeRepository.expirarAntesDe(
                LocalDate.now(), OportunidadeStatus.ATIVA, OportunidadeStatus.EXPIRADA);
        em.clear();

        assertThat(afetadas).isEqualTo(1);
        assertThat(oportunidadeRepository.findById(vencida.getId()).orElseThrow().getStatus())
                .isEqualTo(OportunidadeStatus.EXPIRADA);
        assertThat(oportunidadeRepository.findById(vigente.getId()).orElseThrow().getStatus())
                .isEqualTo(OportunidadeStatus.ATIVA);
    }
}
