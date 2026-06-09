# Histórico de Decisões

## 9 de junho de 2026

- Ampliado o recorte do Mapa Cultural PE de 100 para 1.000 registros paginados.
- Adicionados objetivos da comunicação visual e justificativas dos gráficos planejados.
- Documentada a justificativa do pré-processamento por tipo de variável.
- Limitado o recorte do Mapa Cultural PE a 1.000 agentes individuais (`type=EQ(1)`), alinhando a base ao foco atual do FlowCarreiras.
- Implementada validação e conversão das datas do Mapa Cultural PE.
- Implementadas variáveis derivadas em arquivos enriquecidos separados das bases limpas.

## 8 de junho de 2026

- Substituído o antigo CSV de pontos de cultura por uma extração reproduzível da API de agentes do Mapa Cultural de Pernambuco.
- Mantido o dataset alemão, com sua origem identificada como o projeto científico aberto contempArt.
- Removida a classificação das bases como simuladas.
- Definidas perguntas e métricas separadas para cada dataset.
- Registrado que as bases são complementares no tema, mas não são integradas.
- Centralizados dados, scripts e documentação na pasta `analise-dados`.
