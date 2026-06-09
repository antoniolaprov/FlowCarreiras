# Métricas

## Mapa Cultural de Pernambuco

| Métrica | Cálculo |
| --- | --- |
| Total de perfis artísticos individuais | Contagem de `id` únicos após filtro `type=EQ(1)` e aplicação do critério artístico/criativo documentado |
| Preenchimento da descrição | Percentual de `descricao_curta` não vazia |
| Frequência de áreas | Separação de `termos_areas` por ` | ` e contagem |
| Frequência de tags | Separação de `termos_tags` por ` | ` e contagem |
| Frequência de funções | Separação de `termos_funcoes` por ` | ` e contagem |
| Registros por ano | Extração do ano de `data_criacao` e contagem |
| Atualização posterior | Percentual com `data_atualizacao` posterior a `data_criacao` |
| Agentes com descrição | Percentual de `possui_descricao` verdadeiro |
| Quantidade de áreas por agente | Média, mediana e distribuição de `quantidade_areas` |

## contempArt

| Métrica | Cálculo |
| --- | --- |
| Total de artistas | Contagem de `artist_id` únicos |
| Artistas por escola | Contagem agrupada por `school` |
| Distribuição geográfica das escolas | Contagem agrupada por `east_german` |
| Distribuição de gênero | Contagem e percentual por `gender`, excluindo ausentes |
| Cobertura de Instagram | Percentual com `instagram_handle` preenchido |
| Cobertura de website | Percentual com `website` preenchido |
| Seguidores por artista | Mediana e média de `follower_count` preenchido |
| Engajamento médio | Mediana e média de `avg_likes` e `avg_comments` |
| Imagens por artista | Distribuição de `img_count` |
| Taxa de engajamento | Média e mediana de `taxa_engajamento` entre registros calculáveis |
| Nível de visibilidade | Contagem por `nivel_visibilidade` derivado dos percentis de seguidores |

As métricas não devem usar o total completo como denominador quando a coluna analisada possui dados ausentes. O denominador usado deve ser informado em cada resultado.
