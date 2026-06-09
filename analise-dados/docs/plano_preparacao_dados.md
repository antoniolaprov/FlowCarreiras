# Plano de Preparação dos Dados

Cada base possui um fluxo independente de extração e limpeza.

## Justificativa por tipo de variável

| Tipo de variável | Tratamento previsto | Justificativa |
| --- | --- | --- |
| Numérica | Converter para tipo numérico, preservar ausentes e verificar distribuição/outliers antes de calcular médias | Seguidores, posts, likes e comentários podem ser muito assimétricos; zeros inventados distorceriam métricas e modelos. |
| Categórica | Remover espaços excedentes, preservar categorias originais e contabilizar ausentes separadamente | Evita duplicações causadas por formatação sem alterar o significado declarado pela fonte. |
| Data/hora | Converter com validação; datas inválidas viram ausentes e inconsistências temporais são contabilizadas | A conversão permite extrair ano, ordenar registros e verificar atualizações posteriores à criação. |
| Booleana | Preservar verdadeiro, falso e ausente como situações distintas | Ausência não significa necessariamente falso, principalmente nos dados de Instagram. |
| Lista de tags/áreas | Padronizar o separador como ` | `, remover repetições dentro do registro e explodir somente durante análises de frequência | Um agente pode possuir várias áreas; tratá-las como uma única categoria impediria contagens corretas. |
| Texto livre | Remover apenas espaços externos e preservar o conteúdo original | Descrições podem conter informação relevante; alterações extensas poderiam mudar seu significado. |

## Mapa Cultural de Pernambuco

1. Consultar a API por agentes individuais e paginar até selecionar 1.000 perfis com área artística/criativa declarada.
2. Salvar os perfis selecionados em JSON, preservando metadados da extração e o critério utilizado.
3. Validar que a resposta contém uma lista e excluir marcadores evidentes de teste ou administração.
4. Achatar os objetos `type`, `terms`, `createTimestamp` e `updateTimestamp`.
5. Converter listas de termos para texto separado por ` | `.
6. Remover duplicidades apenas pelo campo `id`.
7. Ordenar os registros por `id`.
8. Manter campos ausentes vazios, sem inventar ou imputar valores.
9. Exportar o resultado em CSV UTF-8.
10. Converter datas para tipo data/hora e contabilizar valores inválidos ou inconsistentes.

Scripts:

- `src/extract/baixar_mapa_cultural_pe.py`
- `src/cleaning/limpar_mapa_cultural_pe.py`

## contempArt

1. Baixar `artists.csv` do repositório oficial no GitHub.
2. Ler o arquivo preservando os nomes originais das colunas.
3. Remover espaços no início e no fim dos campos textuais.
4. Remover duplicidades apenas pelo campo `artist_id`.
5. Ordenar os registros por `artist_id`.
6. Manter valores ausentes como ausentes.
7. Exportar o resultado em CSV UTF-8.

Scripts:

- `src/extract/baixar_contempart.py`
- `src/cleaning/limpar_contempart.py`

## Regras gerais

- Não unir os datasets.
- Não traduzir ou substituir categorias originais durante a limpeza.
- Não preencher dados ausentes com médias, zeros ou categorias inventadas.
- Preservar uma cópia bruta para auditoria e reprodução.
- Registrar fonte, parâmetros e data da extração.

## Variáveis derivadas

O script `src/features/criar_variaveis_derivadas.py` gera arquivos enriquecidos sem substituir as bases limpas originais.

- Mapa Cultural PE: `possui_descricao`, `quantidade_areas`, `ano_criacao` e `atualizacao_posterior`.
- contempArt: `possui_instagram`, `possui_website`, `taxa_engajamento` e `nivel_visibilidade`.

O `nivel_visibilidade` usa três faixas baseadas nos percentis 33% e 67% dos seguidores preenchidos. A taxa de engajamento é calculada por `(média de likes + média de comentários) / seguidores * 100`.
