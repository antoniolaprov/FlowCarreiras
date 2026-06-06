package com.flowcarreiras.flowcarreiras_api.dto.datasets;

public record DatasetMetadataDTO(
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
}
