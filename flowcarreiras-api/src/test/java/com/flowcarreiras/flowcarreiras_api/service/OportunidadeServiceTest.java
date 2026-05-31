package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.oportunidades.OportunidadeResponseDTO;
import com.flowcarreiras.flowcarreiras_api.model.Oportunidade;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeStatus;
import com.flowcarreiras.flowcarreiras_api.model.enums.OportunidadeTipo;
import com.flowcarreiras.flowcarreiras_api.repository.OportunidadeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OportunidadeServiceTest {

    @Mock
    private OportunidadeRepository oportunidadeRepository;

    @InjectMocks
    private OportunidadeService service;

    private Oportunidade oportunidade(String titulo, OportunidadeTipo tipo, String area, LocalDate fim, String... tagNomes) {
        Set<Tag> tags = new HashSet<>();
        for (String nome : tagNomes) {
            tags.add(Tag.builder().id(UUID.randomUUID()).nome(nome).build());
        }
        return Oportunidade.builder()
                .id(UUID.randomUUID())
                .titulo(titulo)
                .descricao("descricao")
                .tipo(tipo)
                .areaArtistica(area)
                .dataEncerramento(fim)
                .linkExterno("https://exemplo.com")
                .status(OportunidadeStatus.ATIVA)
                .dataCriacao(LocalDateTime.now())
                .tags(tags)
                .build();
    }

    private void mockBase(List<Oportunidade> base) {
        when(oportunidadeRepository.findByStatusAndDataEncerramentoGreaterThanEqualOrderByDataEncerramentoAsc(
                eq(OportunidadeStatus.ATIVA), any(LocalDate.class)))
                .thenReturn(base);
    }

    @Test
    void retornaTodasQuandoSemFiltro() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(
                oportunidade("Edital A", OportunidadeTipo.EDITAL, "Musica", fim, "musica"),
                oportunidade("Vaga B", OportunidadeTipo.VAGA, "Teatro", fim, "teatro")
        ));

        List<OportunidadeResponseDTO> resultado = service.listar(OportunidadeService.Filtro.vazio());

        assertEquals(2, resultado.size());
    }

    @Test
    void filtraPorTipo() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(
                oportunidade("Edital A", OportunidadeTipo.EDITAL, "Musica", fim, "musica"),
                oportunidade("Vaga B", OportunidadeTipo.VAGA, "Teatro", fim, "teatro")
        ));

        var filtro = new OportunidadeService.Filtro(
                Set.of(OportunidadeTipo.EDITAL), Set.of(), null,
                OportunidadeService.PrazoFiltro.SEM_FILTRO, 50, 0);

        List<OportunidadeResponseDTO> resultado = service.listar(filtro);

        assertEquals(1, resultado.size());
        assertEquals("EDITAL", resultado.get(0).getTipo());
    }

    @Test
    void filtraPorAreaIgnorandoCase() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(
                oportunidade("Edital A", OportunidadeTipo.EDITAL, "Musica Eletronica", fim, "musica"),
                oportunidade("Vaga B", OportunidadeTipo.VAGA, "Teatro", fim, "teatro")
        ));

        var filtro = new OportunidadeService.Filtro(
                Set.of(), Set.of(), "musica",
                OportunidadeService.PrazoFiltro.SEM_FILTRO, 50, 0);

        List<OportunidadeResponseDTO> resultado = service.listar(filtro);

        assertEquals(1, resultado.size());
        assertEquals("Edital A", resultado.get(0).getTitulo());
    }

    @Test
    void filtraPorTagsComoCondicaoAnd() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(
                oportunidade("Tem ambas", OportunidadeTipo.EDITAL, "Musica", fim, "Musica", "Producao"),
                oportunidade("Tem so uma", OportunidadeTipo.EDITAL, "Musica", fim, "Musica")
        ));

        // filtro exige TODAS as tags (em minusculo, como o servico compara)
        var filtro = new OportunidadeService.Filtro(
                Set.of(), Set.of("musica", "producao"), null,
                OportunidadeService.PrazoFiltro.SEM_FILTRO, 50, 0);

        List<OportunidadeResponseDTO> resultado = service.listar(filtro);

        assertEquals(1, resultado.size());
        assertEquals("Tem ambas", resultado.get(0).getTitulo());
    }

    @Test
    void filtraPorPrazoEstaSemana() {
        mockBase(List.of(
                oportunidade("Dentro do prazo", OportunidadeTipo.EDITAL, "Musica", LocalDate.now().plusDays(3), "musica"),
                oportunidade("Fora do prazo", OportunidadeTipo.EDITAL, "Musica", LocalDate.now().plusDays(30), "musica")
        ));

        var filtro = new OportunidadeService.Filtro(
                Set.of(), Set.of(), null,
                OportunidadeService.PrazoFiltro.ESTA_SEMANA, 50, 0);

        List<OportunidadeResponseDTO> resultado = service.listar(filtro);

        assertEquals(1, resultado.size());
        assertEquals("Dentro do prazo", resultado.get(0).getTitulo());
    }

    @Test
    void aplicaPaginacaoComLimitEOffset() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(
                oportunidade("A", OportunidadeTipo.EDITAL, "Musica", fim, "musica"),
                oportunidade("B", OportunidadeTipo.EDITAL, "Musica", fim, "musica"),
                oportunidade("C", OportunidadeTipo.EDITAL, "Musica", fim, "musica")
        ));

        var filtro = new OportunidadeService.Filtro(
                Set.of(), Set.of(), null,
                OportunidadeService.PrazoFiltro.SEM_FILTRO, 1, 1);

        List<OportunidadeResponseDTO> resultado = service.listar(filtro);

        assertEquals(1, resultado.size());
        assertEquals("B", resultado.get(0).getTitulo());
    }

    @Test
    void offsetAlemDoTamanhoRetornaVazio() {
        LocalDate fim = LocalDate.now().plusDays(10);
        mockBase(List.of(oportunidade("A", OportunidadeTipo.EDITAL, "Musica", fim, "musica")));

        var filtro = new OportunidadeService.Filtro(
                Set.of(), Set.of(), null,
                OportunidadeService.PrazoFiltro.SEM_FILTRO, 50, 10);

        assertTrue(service.listar(filtro).isEmpty());
    }
}
