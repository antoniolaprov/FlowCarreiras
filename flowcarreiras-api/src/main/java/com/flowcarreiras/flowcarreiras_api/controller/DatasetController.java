package com.flowcarreiras.flowcarreiras_api.controller;

import com.flowcarreiras.flowcarreiras_api.dto.datasets.DatasetMetadataDTO;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private static final MediaType TEXT_CSV = MediaType.parseMediaType("text/csv; charset=UTF-8");

    private static final Map<String, DatasetInfo> DATASETS = Map.of(
            "artistas",
            new DatasetInfo(
                    "artistas",
                    "Artistas",
                    "Base simulada de perfis artisticos para analise de carreira, alcance digital e caracteristicas dos artistas.",
                    "datasets/artistas.csv",
                    "CSV",
                    ",",
                    441,
                    "Base simulada/externa enviada para o projeto Flow Carreiras",
                    "/api/datasets/artistas/csv"
            ),
            "pontos-cultura",
            new DatasetInfo(
                    "pontos-cultura",
                    "Pontos de Cultura de Pernambuco",
                    "Base limpa de pontos de cultura de Pernambuco da Rede Cultura Viva.",
                    "datasets/pontos-cultura-pernambuco.csv",
                    "CSV",
                    ";",
                    362,
                    "Dados Cultura - Rede Cultura Viva",
                    "/api/datasets/pontos-cultura/csv"
            )
    );

    @GetMapping
    List<DatasetMetadataDTO> listar() {
        return DATASETS.values().stream()
                .map(DatasetInfo::toDto)
                .toList();
    }

    @GetMapping(value = "/{id}/csv", produces = "text/csv")
    ResponseEntity<Resource> baixarCsv(@PathVariable String id) {
        DatasetInfo dataset = DATASETS.get(id);
        if (dataset == null) {
            throw new ResponseStatusException(NOT_FOUND, "Dataset nao encontrado: " + id);
        }

        Resource resource = new ClassPathResource(dataset.arquivo());
        if (!resource.exists()) {
            throw new ResponseStatusException(NOT_FOUND, "Arquivo do dataset nao encontrado: " + id);
        }

        return ResponseEntity.ok()
                .contentType(TEXT_CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dataset.nomeArquivo() + "\"")
                .body(resource);
    }

    private record DatasetInfo(
            String id,
            String nome,
            String descricao,
            String arquivo,
            String formato,
            String separador,
            int totalRegistros,
            String origem,
            String endpointCsv
    ) {
        DatasetMetadataDTO toDto() {
            return new DatasetMetadataDTO(
                    id,
                    nome,
                    descricao,
                    nomeArquivo(),
                    formato,
                    separador,
                    totalRegistros,
                    origem,
                    endpointCsv
            );
        }

        String nomeArquivo() {
            int slash = arquivo.lastIndexOf('/');
            return slash >= 0 ? arquivo.substring(slash + 1) : arquivo;
        }
    }
}
