package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.ObraRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.ObraResponseDTO;
import com.flowcarreiras.flowcarreiras_api.exception.ArquivoInvalidoException;
import com.flowcarreiras.flowcarreiras_api.exception.ObraNaoEncontradaException;
import com.flowcarreiras.flowcarreiras_api.model.FilaDescobertaLog;
import com.flowcarreiras.flowcarreiras_api.model.Obra;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.Usuario;
import com.flowcarreiras.flowcarreiras_api.model.enums.StatusObra;
import com.flowcarreiras.flowcarreiras_api.model.enums.TipoMidia;
import com.flowcarreiras.flowcarreiras_api.repository.FilaDescobertaLogRepository;
import com.flowcarreiras.flowcarreiras_api.repository.ObraRepository;
import com.flowcarreiras.flowcarreiras_api.repository.PerfilArtistaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObraServiceTest {

    private static final String EMAIL = "artista@test.com";

    @Mock private ObraRepository obraRepository;
    @Mock private PerfilArtistaRepository perfilArtistaRepository;
    @Mock private TagRepository tagRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private FilaDescobertaLogRepository filaDescobertaLogRepository;

    @InjectMocks
    private ObraService service;

    private PerfilArtista perfilComUsuario() {
        Usuario usuario = Usuario.builder()
                .id(UUID.randomUUID()).nome("Marina").email(EMAIL).ativo(true).build();
        return PerfilArtista.builder()
                .id(UUID.randomUUID()).usuario(usuario).urlPublica("marina").build();
    }

    private Tag tag() {
        return Tag.builder().id(UUID.randomUUID()).nome("musica").build();
    }

    private ObraRequestDTO dto(TipoMidia tipo, String descricao, String urlMidia, List<UUID> tagIds) {
        ObraRequestDTO dto = new ObraRequestDTO();
        dto.setTitulo("Minha obra");
        dto.setDescricao(descricao);
        dto.setTipoMidia(tipo);
        dto.setUrlMidia(urlMidia);
        dto.setStatus(StatusObra.PUBLICADA);
        dto.setTagIds(tagIds);
        return dto;
    }

    // --- Validacao de embed (Historia 2.1) ---

    @Test
    void aceitaEmbedDeYoutube() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        ObraRequestDTO dto = dto(TipoMidia.EMBED, "desc", "https://youtube.com/watch?v=abc", List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(obraRepository.save(any(Obra.class))).thenAnswer(i -> i.getArgument(0));

        ObraResponseDTO resultado = service.criarObra(dto, null, EMAIL);

        assertEquals("https://youtube.com/watch?v=abc", resultado.getUrlMidia());
        verify(obraRepository).save(any(Obra.class));
    }

    @Test
    void rejeitaEmbedDeDominioNaoPermitido() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        ObraRequestDTO dto = dto(TipoMidia.EMBED, "desc", "https://exemplo.com/video", List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));

        assertThrows(ArquivoInvalidoException.class, () -> service.criarObra(dto, null, EMAIL));
        verify(obraRepository, never()).save(any());
    }

    @Test
    void rejeitaEmbedSemUrl() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        ObraRequestDTO dto = dto(TipoMidia.EMBED, "desc", null, List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));

        assertThrows(ArquivoInvalidoException.class, () -> service.criarObra(dto, null, EMAIL));
    }

    // --- Fila de descoberta (Historia 5.3) ---

    @Test
    void entraNaFilaQuandoObraAtendeTodosOsCriterios() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        byte[] conteudo = new byte[60 * 1024]; // >= 50 KB minimo de imagem
        MockMultipartFile file = new MockMultipartFile("file", "arte.jpg", "image/jpeg", conteudo);
        ObraRequestDTO dto = dto(TipoMidia.IMAGEM, "Uma descricao com mais de dez caracteres", null, List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(fileStorageService.salvar(file, TipoMidia.IMAGEM)).thenReturn("/uploads/imagem/arte.jpg");
        when(fileStorageService.validarCabecalhoMidia(file, TipoMidia.IMAGEM)).thenReturn(true);
        when(obraRepository.save(any(Obra.class))).thenAnswer(i -> i.getArgument(0));

        service.criarObra(dto, file, EMAIL);

        assertNotNull(perfil.getDataEntradaFila());
        verify(filaDescobertaLogRepository).save(any(FilaDescobertaLog.class));
        verify(perfilArtistaRepository).save(perfil);
    }

    @Test
    void naoEntraNaFilaQuandoDescricaoEhCurta() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        byte[] conteudo = new byte[60 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "arte.jpg", "image/jpeg", conteudo);
        ObraRequestDTO dto = dto(TipoMidia.IMAGEM, "curta", null, List.of(tag.getId()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(fileStorageService.salvar(file, TipoMidia.IMAGEM)).thenReturn("/uploads/imagem/arte.jpg");
        when(obraRepository.save(any(Obra.class))).thenAnswer(i -> i.getArgument(0));

        service.criarObra(dto, file, EMAIL);

        assertNull(perfil.getDataEntradaFila());
        verify(filaDescobertaLogRepository, never()).save(any());
    }

    @Test
    void naoEntraNaFilaQuandoObraEhRascunho() {
        PerfilArtista perfil = perfilComUsuario();
        Tag tag = tag();
        byte[] conteudo = new byte[60 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "arte.jpg", "image/jpeg", conteudo);
        ObraRequestDTO dto = dto(TipoMidia.IMAGEM, "Uma descricao com mais de dez caracteres", null, List.of(tag.getId()));
        dto.setStatus(StatusObra.RASCUNHO);

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(tagRepository.findAllById(List.of(tag.getId()))).thenReturn(List.of(tag));
        when(fileStorageService.salvar(file, TipoMidia.IMAGEM)).thenReturn("/uploads/imagem/arte.jpg");
        when(obraRepository.save(any(Obra.class))).thenAnswer(i -> i.getArgument(0));

        service.criarObra(dto, file, EMAIL);

        assertNull(perfil.getDataEntradaFila());
        verify(filaDescobertaLogRepository, never()).save(any());
    }

    // --- Edicao (Historia 2.3) ---

    @Test
    void editarFalhaQuandoSemTags() {
        PerfilArtista perfil = perfilComUsuario();
        UUID obraId = UUID.randomUUID();
        Obra obra = Obra.builder().id(obraId).artista(perfil).urlMidia("/uploads/imagem/x.jpg").build();
        ObraRequestDTO dto = dto(TipoMidia.IMAGEM, "desc", null, new ArrayList<>());

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(obraRepository.findByIdAndArtistaId(obraId, perfil.getId())).thenReturn(Optional.of(obra));

        assertThrows(ArquivoInvalidoException.class, () -> service.editarObra(obraId, dto, null, EMAIL));
    }

    @Test
    void editarFalhaQuandoObraNaoEncontrada() {
        PerfilArtista perfil = perfilComUsuario();
        UUID obraId = UUID.randomUUID();
        ObraRequestDTO dto = dto(TipoMidia.IMAGEM, "desc", null, List.of(UUID.randomUUID()));

        when(perfilArtistaRepository.findByUsuarioEmail(EMAIL)).thenReturn(Optional.of(perfil));
        when(obraRepository.findByIdAndArtistaId(eq(obraId), eq(perfil.getId()))).thenReturn(Optional.empty());

        assertThrows(ObraNaoEncontradaException.class, () -> service.editarObra(obraId, dto, null, EMAIL));
    }
}
