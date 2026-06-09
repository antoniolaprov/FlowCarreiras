# Fontes dos Dados

As análises usam duas fontes abertas e reais. Não há base simulada.

## Mapa Cultural de Pernambuco

- Fonte: API pública do Mapa Cultural de Pernambuco.
- Recurso: agentes culturais.
- Endpoint: `https://www.mapacultural.pe.gov.br/api/agent/find`
- Consulta utilizada:

```text
@select=id,name,shortDescription,type,terms,createTimestamp,updateTimestamp
type=EQ(1) (somente agentes individuais)
@limit=100 por página
total_registros=1000
```

- Data da extração incorporada ao projeto: 9 de junho de 2026.
- Registros obtidos no recorte do projeto: 1.000 agentes individuais.
- JSON bruto: `data/raw/mapa_cultural_pe_agentes.json`.
- CSV tratado: `data/processed/mapa_cultural_pe_agentes.csv`.
- CSV enriquecido: `data/processed/mapa_cultural_pe_agentes_enriquecido.csv`.

O JSON guarda os agentes individuais retornados pela API, junto com a URL consultada, o horário da extração e os parâmetros usados. O CSV achata objetos aninhados para facilitar a análise tabular. Agentes coletivos não fazem parte deste recorte porque o FlowCarreiras atualmente é direcionado a perfis individuais.

## contempArt

- Fonte principal: repositório público `georgeblck/contempart` no GitHub.
- Repositório: `https://github.com/georgeblck/contempart`
- Site do projeto: `https://contempart.org/`
- Arquivo utilizado: `data/artists.csv` do repositório.
- Registros: 441 artistas.
- CSV bruto: `data/raw/contempart_artists.csv`.
- CSV tratado: `data/processed/contempart_artists.csv`.
- CSV enriquecido: `data/processed/contempart_artists_enriquecido.csv`.

O contempArt é uma base científica multimodal de arte contemporânea. O recorte usado neste projeto contém artistas em início de carreira ligados a 15 escolas de arte alemãs. A base inclui informações institucionais e demográficas e, quando disponíveis, métricas públicas de Instagram e características médias das imagens.

O dataset foi apresentado por Nikolai Huckle, Noa Garcia e Yuta Nakashima em trabalho publicado no contexto do ECCV Workshop de 2020.

## Complementaridade

Os datasets abordam partes diferentes do ecossistema artístico:

- o Mapa Cultural descreve agentes culturais cadastrados em uma plataforma pública de Pernambuco;
- o contempArt descreve artistas vinculados a instituições de ensino artístico da Alemanha.

Eles são complementares no tema geral de carreira e atuação cultural, mas não devem ser unidos. Não existe chave comum confiável, os países e contextos institucionais são diferentes e as unidades de análise não são equivalentes.
