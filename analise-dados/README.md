# Análise de Dados - FlowCarreiras

Esta pasta concentra a preparação e a documentação dos dados usados pelo projeto.

## Datasets

As duas fontes são abertas e reais, mas possuem unidades de análise diferentes:

- **Mapa Cultural de Pernambuco:** recorte de perfis individuais com área artística/criativa declarada, retornados pela API pública.
- **contempArt:** artistas em início de carreira vinculados a 15 escolas de arte da Alemanha.

Os datasets são complementares para estudar o ecossistema artístico e cultural, mas não são integrados nem unidos por chave.

## Estrutura

```text
data/raw/         Dados originais baixados das fontes
data/processed/   CSVs limpos e prontos para análise
docs/             Plano, fontes, métricas e dicionários
src/extract/      Scripts de extração
src/cleaning/     Scripts de limpeza e transformação
```

## Reprodução

```bash
pip install -r analise-dados/requirements.txt

python analise-dados/src/extract/baixar_mapa_cultural_pe.py --total-registros 1000
python analise-dados/src/cleaning/limpar_mapa_cultural_pe.py

python analise-dados/src/extract/baixar_contempart.py
python analise-dados/src/cleaning/limpar_contempart.py
python analise-dados/src/features/criar_variaveis_derivadas.py
```

O download padrão do Mapa Cultural pagina a API até obter 1.000 perfis individuais que atendam ao critério artístico documentado em `docs/fontes_dados.md`.
