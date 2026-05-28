---
tags:
  - testes
  - qualidade
created: 2026-05-13
---
# Testes

#teste #jest #playwright #qualidade

---

## Stack de Testes

| Ferramenta | Uso | Config |
|------------|-----|--------|
| Jest | Testes unitários + integração | jest.config.cjs |
| Supertest | Testes de integração HTTP | tests/helpers/httpMocks.js |
| Playwright | Testes E2E | playwright.config.cjs |

---

## Scripts

npm test              # Todos os testes Jest
npm run test:unit     # Apenas unitários
npm run test:integration # Apenas integração
npm run test:coverage # Cobertura
npm run test:e2e      # Playwright

---

## Testes Unitários

### Middleware (tests/unit/middleware/auth.test.js)
[[Middleware]] -- 104 linhas, testa:
- requireAuth
- requireAdmin
- redirectIfLoggedIn

### Data Layer (tests/unit/data/)

| Arquivo | Descrição |
|---------|-----------|
| database.test.js | CRUD in-memory, filtros, reset, IDs |
| database.bootstrap.test.js | Bootstrap, autenticação, relações |
| database.persistence.test.js | SQL: INSERT, transações, JOIN |

### Injeção de Dependência
tests/unit/routes/dependency-injection.test.js (294 linhas) -- Todas as 5 factories de rota.

---

## Testes de Integração

Todos usam mockDatabase (in-memory) via NODE_ENV=test.

| Arquivo | Rotas Testadas |
|---------|---------------|
| app.test.js | Smoke: GET /, manifest, sw.js, 404, session |
| index.test.js | Home, sobre, contato, planos, doacoes, dashboard |
| auth.test.js | Login, cadastro, validação, logout |
| denuncias.test.js | Listar, criar, filtrar, responder, status |
| denuncias-errors.test.js | Exceções, 404, mock failures |
| ongs.test.js | Listar, detalhes, admin, stats |
| admin.test.js | Login admin, controle de acesso |

---

## Testes E2E

Playwright -- navegador real (chromium).

| Arquivo | Cenários |
|---------|----------|
| cadastro.spec.js | Cadastro usuário, cadastro ONG |
| fluxos-principais.spec.js | Homepage, login, denúncia, doação, plano, contato, resposta admin |

---

## Helpers

- tests/helpers/jest.setup.js -- resetData() antes de cada teste
- tests/helpers/httpMocks.js -- createMockReq(), createMockRes(), createMockNext()

---

## Convenções

- Nome: *.test.js
- Mock Database em todos os testes
- Nenhum teste acessa MySQL real
- Cobertura: app.js, data/, app/middleware/, app/routes/, app/controllers/, app/models/, app/views/
