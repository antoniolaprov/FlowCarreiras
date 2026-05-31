# Flow Carreiras

## Como rodar

### Pré-requisito

[Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

### Linux / Mac

```bash
git clone <url-do-repo>
cd FlowCarreiras
cp .env.example .env
mkdir -p uploads
docker compose up -d
```

### Windows (PowerShell)

```powershell
git clone <url-do-repo>
cd FlowCarreiras
cp .env.example .env
mkdir uploads -ErrorAction SilentlyContinue
docker compose up -d
```

Acesse em: **[http://localhost](http://localhost)**

Usuário de teste: `marina@test.com` / `senha123`

## Testes (backend)

Os testes do backend são **opcionais** e **não afetam o uso normal do projeto**:
o `docker compose up` já builda com `-DskipTests`, então subir e usar a aplicação
nunca dispara os testes. Eles só rodam quando você os executa de propósito.

Rodar a suíte de testes (precisa apenas de Java 17+; usa H2 em memória):

```bash
cd flowcarreiras-api

# Linux / Mac
./mvnw test

# Windows (PowerShell)
.\mvnw.cmd test
```

Para compilar/empacotar **sem** rodar os testes (mais rápido, igual ao build do Docker):

```bash
./mvnw package -DskipTests
```

O que está coberto (em `flowcarreiras-api/src/test`):

- **Serviço** (unitário, com Mockito): regras de oportunidades, notificações, fila de
  descoberta, validação de obras e configuração de mentoria.
- **Repositório** (`@DataJpaTest`, H2): queries customizadas de oportunidades,
  perfis e notificações.
- **Controller** (`@SpringBootTest` + MockMvc): autenticação (registro/login) e
  acesso autenticado via JWT.

Os testes usam um perfil isolado (`src/test/resources/application.properties`) com o
Flyway desabilitado — o schema é criado pelo Hibernate no H2. Produção e Docker
seguem usando Flyway normalmente.
