# Flow Carreiras

O Flow Carreiras é uma plataforma desenvolvida para impulsionar a carreira de novos artistas de Recife, conectando-os a mentores, oportunidades de mercado e fornecendo uma infraestrutura analítica robusta para entender engajamento, perfis profissionais e otimização de descoberta de talentos.

## Demonstracao em produção

A aplicação web (Frontend) está buildada e disponível publicamente:

* Link do deploy: https://flowcarreiras.vercel.app

---


### Usuário de teste padrão

| Campo  | Valor             |
| ------ | ----------------- |
| E-mail | `tiago@test.com` |
| Senha  | `senha123`        |

---

## Localização dos Dashboards de AVD

Os dashboards desenvolvidos para atender aos requisitos de Análise e Visualização de Dados (AVD) estão integrados diretamente à aplicação principal.

Após realizar o login, os avaliadores podem acessar os recursos analíticos através das seguintes seções do sistema:

* **Métricas**: dashboard com visualizações e indicadores relacionados ao desempenho e engajamento pessoal dos perfis.
* **Métricas Globais**: dashboard consolidado com análises agregadas, segmentações e indicadores gerais da plataforma.

Toda a solução analítica foi incorporada à interface web, não sendo necessário executar aplicações adicionais para visualizar os dashboards.


## Estrutura e entregaveis para projetos 5

O projeto conta com um módulo completo de ciência de dados e engenharia analítica localizado no diretório `/analytics` e `/dashboard`. Abaixo está o mapeamento dos entregáveis obrigatórios e onde encontrá-los no repositório:

| Entregável acadêmico (CC)                       | Localização no repositório                                                                                                               | Descrição                                                                                                                                                                            |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plano de análise** (Métricas e Visualizações) | [analytics/docs/plano_analise_perfis_artistas.md](analytics/docs/plano_analise_perfis_artistas.md)                                       | Perguntas de negócio, objetivos visuais e justificativa de gráficos.                                                                                                                 |
| **Plano de preparação de dados**                | [analytics/docs/preparacao_dicionario_dados.md](analytics/docs/preparacao_dicionario_dados.md)                                           | Fontes de dados (simuladas), limpeza, normalização e dicionário de dados.                                                                                                            |
| **Análise exploratória (EDA)**                  | [analytics/notebooks/analise_exploratoria.ipynb](analytics/notebooks/analise_exploratoria.ipynb)                                         | Notebook com distribuições, correlações e agrupamentos de perfis.                                                                                                                    |
| **Modelos de regressão**                        | [analytics/notebooks/regressao_engajamento.ipynb](analytics/notebooks/regressao_engajamento.ipynb)                                       | Análise de tendências de engajamento dos artistas e análise de resíduos.                                                                                                             |
| **Avaliação de classificadores**                | [analytics/notebooks/classificacao_fila_descoberta.ipynb](analytics/notebooks/classificacao_fila_descoberta.ipynb)                       | Modelo de classificação para Fila de Descoberta com Matriz de confusão e curva ROC. relatório em [analytics/reports/resultados_modelos.md](analytics/reports/resultados_modelos.md). |
| **Proposta de integração visual**               | [analytics/docs/proposta_integracao_dashboard.md](analytics/docs/proposta_integracao_dashboard.md)                                       | Planejamento da arquitetura web e escolha do Streamlit como ferramenta.                                                                                                              |
| **Dashboard interativo & consolidado**          | Código: [dashboard/app.py](dashboard/app.py)<br>Docs: [analytics/docs/dashboard_consolidado.md](analytics/docs/dashboard_consolidado.md) | Aplicação Streamlit com filtros, segmentações e narrativas visuais claras.                                                                                                           |
| **Avaliação funcional da solução**              | [analytics/docs/validacao_funcional_analytics.md](analytics/docs/validacao_funcional_analytics.md)                                       | Validação ponta a ponta dos dados gerados, pipelines e exibições.                                                                                                                    |
| **Documentação final e insights**               | [analytics/docs/documentacao_final_analytics.md](analytics/docs/documentacao_final_analytics.md)                                         | Histórico de decisões de design, capturas de tela e síntese de insights gerados.                                                                                                     |

---


## Como rodar o projeto localmente

### Pré-requisito

Docker Desktop instalado e executando em sua máquina.

### Executando a stack Completa (Ambiente Docker)

#### Windows (PowerShell)

```powershell
git clone <url-do-repo>
cd FlowCarreiras
cp .env.example .env
mkdir uploads -ErrorAction SilentlyContinue
docker compose up -d
```

#### Linux / Mac

```bash
git clone <url-do-repo>
cd FlowCarreiras
cp .env.example .env
mkdir -p uploads
docker compose up -d
```

### URLs Locais de acesso

* Aplicação Principal (Gateway/Frontend local): `http://localhost`

### Observações

Na primeira execução, o sistema automaticamente:

* Executa as migrações do banco de dados;
* Popula a base analítica com `SIM_USERS=400` perfis simulados;
* Disponibiliza os dados prontos para consumo no Streamlit.



## Testes automatizados (Backend)

Os testes são isolados, utilizam banco em memória (H2) e não afetam o build principal do Docker (que utiliza `-DskipTests`).

### Executando os Testes

Requer Java 17+ instalado localmente.

```bash
cd flowcarreiras-api

# Linux / Mac
./mvnw test

# Windows (PowerShell)
.\mvnw.cmd test
```

### Escopo da cobertura de testes

#### Services (Mockito)

Validação das regras de negócio relacionadas a:

* Oportunidades;
* Notificações;
* Fila de descoberta;
* Validação de obras;
* Mentorias.

#### Repositories (`@DataJpaTest`)

Validação de:

* Queries customizadas;
* Persistência e recuperação de dados;
* Comportamento das entidades JPA.

#### Controllers (MockMvc)

Testes de:

* Fluxos de autenticação JWT;
* Endpoints protegidos;
* Respostas HTTP e validações de entrada.
