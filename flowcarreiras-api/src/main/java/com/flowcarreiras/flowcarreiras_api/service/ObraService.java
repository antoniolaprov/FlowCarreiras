package com.flowcarreiras.flowcarreiras_api.service;

import com.flowcarreiras.flowcarreiras_api.dto.ObraRequestDTO;
import com.flowcarreiras.flowcarreiras_api.dto.ObraResponseDTO;
import com.flowcarreiras.flowcarreiras_api.exception.AcessoNegadoException;
import com.flowcarreiras.flowcarreiras_api.exception.ArquivoInvalidoException;
import com.flowcarreiras.flowcarreiras_api.exception.ObraNaoEncontradaException;
import com.flowcarreiras.flowcarreiras_api.model.Obra;
import com.flowcarreiras.flowcarreiras_api.model.FilaDescobertaLog;
import com.flowcarreiras.flowcarreiras_api.model.PerfilArtista;
import com.flowcarreiras.flowcarreiras_api.model.Tag;
import com.flowcarreiras.flowcarreiras_api.model.enums.StatusObra;
import com.flowcarreiras.flowcarreiras_api.model.enums.TipoMidia;
import com.flowcarreiras.flowcarreiras_api.repository.ObraRepository;
import com.flowcarreiras.flowcarreiras_api.repository.ComentarioRepository;
import com.flowcarreiras.flowcarreiras_api.repository.FilaDescobertaLogRepository;
import com.flowcarreiras.flowcarreiras_api.repository.PerfilArtistaRepository;
import com.flowcarreiras.flowcarreiras_api.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ObraService {

    private static final long MIN_TAMANHO_IMAGEM = 50L * 1024;
    private static final long MIN_TAMANHO_AUDIO = 100L * 1024;
    private static final long MIN_TAMANHO_VIDEO = 100L * 1024;

    private static final Set<String> DOMINIOS_EMBED = Set.of(
        "youtube.com", "youtu.be", "vimeo.com"
    );

    private final ObraRepository obraRepository;
    private final PerfilArtistaRepository perfilArtistaRepository;
    private final TagRepository tagRepository;
    private final FileStorageService fileStorageService;
    private final FilaDescobertaLogRepository filaDescobertaLogRepository;
    private final ComentarioRepository comentarioRepository;

    @Transactional
    public ObraResponseDTO criarObra(ObraRequestDTO dto, MultipartFile file, String emailArtista) {
        PerfilArtista perfil = buscarPerfilPorEmail(emailArtista);
        Set<Tag> tags = resolverTags(dto.getTagIds());
        String urlMidia = resolverUrlMidia(dto, file);

        Obra obra = Obra.builder()
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .tipoMidia(dto.getTipoMidia())
                .urlMidia(urlMidia)
                .status(dto.getStatus())
                .artista(perfil)
                .tags(tags)
                .build();
        Obra salva = obraRepository.save(obra);
        registrarEntradaFilaSeElegivel(perfil, salva, file);
        return ObraResponseDTO.from(salva);
    }

    @Transactional
    public ObraResponseDTO editarObra(UUID obraId, ObraRequestDTO dto, MultipartFile file, String emailArtista) {
        PerfilArtista perfil = buscarPerfilPorEmail(emailArtista);
        Obra obra = obraRepository.findByIdAndArtistaId(obraId, perfil.getId())
                .orElseThrow(() -> new ObraNaoEncontradaException(obraId));

        Set<Tag> tags = resolverTags(dto.getTagIds());
        if (tags.isEmpty()) {
            throw new ArquivoInvalidoException("Adicione ao menos uma tag antes de salvar");
        }

        // Substitui arquivo de mídia apenas se um novo foi enviado
        String urlMidia = obra.getUrlMidia();
        if (file != null && !file.isEmpty()) {
            fileStorageService.deletar(urlMidia);
            urlMidia = fileStorageService.salvar(file, dto.getTipoMidia());
        } else if (dto.getTipoMidia() == TipoMidia.EMBED) {
            urlMidia = validarEObterUrlEmbed(dto.getUrlMidia());
        }

        obra.setTitulo(dto.getTitulo());
        obra.setDescricao(dto.getDescricao());
        obra.setTipoMidia(dto.getTipoMidia());
        obra.setUrlMidia(urlMidia);
        obra.setStatus(dto.getStatus());
        obra.setTags(tags);

        Obra salva = obraRepository.save(obra);
        registrarEntradaFilaSeElegivel(perfil, salva, file);
        return ObraResponseDTO.from(salva);
    }

    @Transactional
    public void removerObra(UUID obraId, String emailArtista) {
        PerfilArtista perfil = buscarPerfilPorEmail(emailArtista);
        Obra obra = obraRepository.findByIdAndArtistaId(obraId, perfil.getId())
                .orElseThrow(() -> new ObraNaoEncontradaException(obraId));

        comentarioRepository.deleteByObraId(obraId);
        fileStorageService.deletar(obra.getUrlMidia());
        obraRepository.delete(obra);
    }

    @Transactional(readOnly = true)
    public List<ObraResponseDTO> listarObrasPorEmail(String email) {
        PerfilArtista perfil = buscarPerfilPorEmail(email);
        return obraRepository.findByArtistaIdOrderByDataPublicacaoDesc(perfil.getId())
                .stream().map(ObraResponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ObraResponseDTO> listarObrasPorArtista(UUID artistaId, boolean somentePublicadas) {
        List<Obra> obras = somentePublicadas
                ? obraRepository.findByArtistaIdAndStatusOrderByDataPublicacaoDesc(artistaId, StatusObra.PUBLICADA)
                : obraRepository.findByArtistaIdOrderByDataPublicacaoDesc(artistaId);

        return obras.stream().map(ObraResponseDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public ObraResponseDTO buscarPorId(UUID id) {
        return obraRepository.findById(id)
                .map(ObraResponseDTO::from)
                .orElseThrow(() -> new ObraNaoEncontradaException(id));
    }

    @Transactional(readOnly = true)
    public List<ObraResponseDTO> explorar(String area, Set<String> tags, Set<TipoMidia> formatos, PeriodoRecencia recencia) {
        boolean tagsVazio = tags == null || tags.isEmpty();
        boolean formatosVazio = formatos == null || formatos.isEmpty();
        var limites = calcularPeriodo(recencia);

        List<Obra> obras = obraRepository.explorarObras(
                area,
                formatosVazio,
                formatosVazio ? Set.of() : formatos,
                limites.inicio,
                limites.fim,
                tagsVazio,
                tagsVazio ? Set.of() : tags,
                tagsVazio ? 0 : tags.size()
        );

        return obras.stream().map(ObraResponseDTO::from).toList();
    }

    // --- helpers ---

    private PerfilArtista buscarPerfilPorEmail(String email) {
        return perfilArtistaRepository.findByUsuarioEmail(email)
                .orElseThrow(() -> new AcessoNegadoException());
    }

    private Set<Tag> resolverTags(List<UUID> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) return new HashSet<>();
        return new HashSet<>(tagRepository.findAllById(tagIds));
    }

    private String resolverUrlMidia(ObraRequestDTO dto, MultipartFile file) {
        if (dto.getTipoMidia() == TipoMidia.EMBED) {
            return validarEObterUrlEmbed(dto.getUrlMidia());
        }
        if (file == null || file.isEmpty()) {
            throw new ArquivoInvalidoException("Arquivo de mídia é obrigatório para este tipo");
        }
        return fileStorageService.salvar(file, dto.getTipoMidia());
    }

    private String validarEObterUrlEmbed(String url) {
        if (url == null || url.isBlank()) {
            throw new ArquivoInvalidoException("URL do embed é obrigatória");
        }
        boolean valido = DOMINIOS_EMBED.stream().anyMatch(url::contains);
        if (!valido) {
            throw new ArquivoInvalidoException("URL embed deve ser do YouTube ou Vimeo");
        }
        return url;
    }

    private void registrarEntradaFilaSeElegivel(PerfilArtista perfil, Obra obra, MultipartFile file) {
        if (perfil.getDataEntradaFila() != null) return;
        if (obra.getStatus() != StatusObra.PUBLICADA) return;
        if (!descricaoValida(obra.getDescricao())) return;
        if (obra.getTags() == null || obra.getTags().isEmpty()) return;
        if (obra.getTipoMidia() == TipoMidia.EMBED) return;

        boolean tamanhoOk = validarTamanhoMidia(obra, file);
        if (!tamanhoOk) return;

        boolean headerOk = validarHeaderMidia(obra, file);
        if (!headerOk) return;

        perfil.setDataEntradaFila(java.time.LocalDateTime.now());
        perfilArtistaRepository.save(perfil);
        filaDescobertaLogRepository.save(FilaDescobertaLog.builder()
                .perfil(perfil)
                .obra(obra)
                .build());
    }

    private boolean descricaoValida(String descricao) {
        return descricao != null && descricao.trim().length() >= 10;
    }

    private boolean validarTamanhoMidia(Obra obra, MultipartFile file) {
        long tamanhoMinimo = switch (obra.getTipoMidia()) {
            case IMAGEM -> MIN_TAMANHO_IMAGEM;
            case AUDIO -> MIN_TAMANHO_AUDIO;
            case VIDEO -> MIN_TAMANHO_VIDEO;
            default -> Long.MAX_VALUE;
        };
        long tamanho = file != null ? file.getSize() : fileStorageService.obterTamanhoArquivo(obra.getUrlMidia());
        return tamanho >= tamanhoMinimo;
    }

    private boolean validarHeaderMidia(Obra obra, MultipartFile file) {
        if (file != null) {
            return fileStorageService.validarCabecalhoMidia(file, obra.getTipoMidia());
        }
        return fileStorageService.validarCabecalhoMidia(obra.getUrlMidia(), obra.getTipoMidia());
    }

    private PeriodoLimites calcularPeriodo(PeriodoRecencia recencia) {
        if (recencia == null || recencia == PeriodoRecencia.SEM_FILTRO) {
            return new PeriodoLimites(null, null);
        }
        java.time.LocalDate hoje = java.time.LocalDate.now();
        java.time.LocalDateTime inicio = switch (recencia) {
            case ESTA_SEMANA -> hoje.minusDays(7).atStartOfDay();
            case ESTE_MES -> hoje.with(java.time.temporal.TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
            default -> null;
        };
        java.time.LocalDateTime fim = java.time.LocalDateTime.now();
        return new PeriodoLimites(inicio, fim);
    }

    private record PeriodoLimites(java.time.LocalDateTime inicio, java.time.LocalDateTime fim) {}

    public enum PeriodoRecencia {
        ESTA_SEMANA,
        ESTE_MES,
        SEM_FILTRO
    }
}
