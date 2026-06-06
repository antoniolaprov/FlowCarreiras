# Planejamento e Dados

Este documento registra a entrega da Task 1: planejamento da analise, preparacao das bases e dicionario de dados.

As duas bases foram mantidas separadas, sem juncao entre elas.

## Bases utilizadas

| Dataset | Arquivo no projeto | Registros | Separador | Uso principal |
| --- | --- | ---: | --- | --- |
| Artistas | `flowcarreiras-api/src/main/resources/datasets/artistas.csv` | 441 | `,` | Analise de perfis artisticos, presenca digital e caracteristicas dos artistas |
| Pontos de Cultura de Pernambuco | `flowcarreiras-api/src/main/resources/datasets/pontos-cultura-pernambuco.csv` | 362 | `;` | Analise territorial e tematica dos pontos de cultura em Pernambuco |

## Endpoints

| Dataset | Endpoint |
| --- | --- |
| Lista de datasets | `GET /api/datasets` |
| CSV de artistas | `GET /api/datasets/artistas/csv` |
| CSV de pontos de cultura | `GET /api/datasets/pontos-cultura/csv` |

## Observacao sobre a base simulada

As bases foram incorporadas ao projeto para fins academicos e de prototipo. O dataset `artistas.csv` deve ser tratado como base simulada/externa de perfis artisticos, sem representar usuarios reais cadastrados no Flow Carreiras. O dataset de pontos de cultura vem de uma fonte publica da Rede Cultura Viva e foi recebido ja em versao limpa.

## Perguntas de analise

1. Quais cidades concentram mais pontos de cultura em Pernambuco?
2. Quais areas de experiencia e temas aparecem com mais frequencia nos pontos de cultura?
3. Quais publicos sao mais atendidos pelas acoes culturais?
4. Quais tipos de atuacao cultural aparecem mais na base?
5. Quais escolas ou regioes aparecem com mais artistas no dataset de artistas?
6. Qual a distribuicao de artistas por genero, continente e regiao?
7. Quantos artistas possuem site ou Instagram registrado?
8. Qual a media de seguidores, curtidas e comentarios dos artistas com dados de Instagram?

## Metricas propostas

| Metrica | Dataset | Como calcular |
| --- | --- | --- |
| Total de registros | Ambos | Contagem de linhas, excluindo o cabecalho |
| Cidades com mais pontos de cultura | Pontos de cultura | Agrupar por `Município` e contar registros |
| Areas/temas mais frequentes | Pontos de cultura | Separar os termos de `Área de experiência e temas` por virgula e contar ocorrencias |
| Publicos mais frequentes | Pontos de cultura | Separar os termos de `Públicos que participam das ações` por virgula e contar ocorrencias |
| Distribuicao por escola | Artistas | Agrupar por `school` |
| Distribuicao por genero | Artistas | Agrupar por `gender` |
| Artistas com website | Artistas | Contar registros com `website` preenchido |
| Alcance medio no Instagram | Artistas | Media de `follower_count` nos registros preenchidos |

## Plano de preparacao dos dados

1. Conferir se todos os arquivos possuem cabecalho.
2. Manter os datasets separados para evitar misturar fontes e significados diferentes.
3. Validar quantidade de registros em cada arquivo.
4. Padronizar nomes internos dos arquivos no projeto.
5. Registrar separador usado em cada CSV.
6. Manter campos vazios como informacao ausente, sem preencher valores inventados.
7. Usar as colunas textuais multivalor como listas separadas por virgula apenas no momento da analise.
8. Documentar a origem e o uso previsto de cada base.

## Dicionario de dados: artistas

| Coluna | Descricao | Tipo esperado |
| --- | --- | --- |
| `artist_id` | Identificador textual do artista | Texto |
| `full_name` | Nome completo do artista | Texto |
| `school` | Escola associada ao artista | Texto |
| `east_german` | Indica se a escola/artista esta associado ao recorte leste alemao | Booleano |
| `professor_class` | Classe ou professor associado | Texto |
| `gender` | Genero registrado | Texto |
| `country_iso3` | Codigo ISO3 do pais | Texto |
| `continent` | Continente | Texto |
| `region` | Regiao geografica | Texto |
| `instagram_handle` | Usuario do Instagram | Texto |
| `instagram_private` | Indica se o Instagram e privado | Booleano |
| `instagram_private_allowed` | Indica permissao relacionada a perfil privado | Booleano |
| `is_business` | Indica se o perfil e comercial | Booleano |
| `is_private` | Indica se o perfil e privado | Booleano |
| `follower_count` | Quantidade de seguidores | Numero |
| `following_count` | Quantidade de perfis seguidos | Numero |
| `posts_count` | Quantidade de postagens | Numero |
| `website` | Site do artista | Texto/URL |
| `img_count` | Quantidade de imagens analisadas | Numero |
| `avg_likes` | Media de curtidas | Numero |
| `avg_comments` | Media de comentarios | Numero |
| `avg_file_size` | Tamanho medio dos arquivos de imagem | Numero |
| `avg_width` | Largura media das imagens | Numero |
| `avg_height` | Altura media das imagens | Numero |
| `avg_aspect_ratio` | Proporcao media das imagens | Numero |

## Dicionario de dados: pontos de cultura

| Coluna | Descricao | Tipo esperado |
| --- | --- | --- |
| `Id` | Identificador do ponto de cultura | Numero/texto |
| `Nome` | Nome do ponto de cultura | Texto |
| `Nome Entidade/Coletivo Cultural` | Nome da entidade ou coletivo cultural | Texto |
| `Descrição Curta` | Resumo descritivo do ponto de cultura | Texto |
| `Data de Criação` | Data de criacao do registro | Data/hora |
| `Data de Atualização` | Data da ultima atualizacao | Data/hora |
| `Tipo de agente da Rede Cultura Viva` | Tipo de agente dentro da rede | Texto |
| `Tipo` | Tipo da entidade, como coletivo | Texto |
| `Pais` | Pais informado | Texto |
| `Estado` | Estado informado | Texto |
| `Município` | Municipio do ponto de cultura | Texto |
| `Ações Estruturantes` | Lista de acoes estruturantes declaradas | Texto multivalor |
| `Públicos que participam das ações` | Lista de publicos participantes | Texto multivalor |
| `Área de experiência e temas` | Lista de areas, experiencias e temas | Texto multivalor |
| `Atuação` | Lista de frentes de atuacao cultural | Texto multivalor |
| `Fonte` | URL da fonte dos dados | Texto/URL |

## Base limpa pronta para uso

Os arquivos finais estao armazenados em:

- `flowcarreiras-api/src/main/resources/datasets/artistas.csv`
- `flowcarreiras-api/src/main/resources/datasets/pontos-cultura-pernambuco.csv`

Esses arquivos devem ser consumidos separadamente. Qualquer visualizacao ou dashboard pode usar os endpoints de CSV ou ler diretamente os arquivos no backend.
