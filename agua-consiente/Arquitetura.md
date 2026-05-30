---
tags:
  - arquitetura
  - estrutura
created: 2026-05-13
---
# Arquitetura

#arquitetura #express #padrao

---

## Padrão Arquitetural

O projeto segue Injeção de Dependência manual com factories:

1. app.js cria o servidor Express
2. Cada rota é uma factory que recebe o objeto data (database)
3. O objeto data expõe métodos CRUD unificados
4. [[Camada de Dados|Models]] implementam a lógica de banco

`
app.js
  ├── createIndexRouter(data)    →  /
  ├── createAuthRouter(data)     →  /auth
  ├── createDenunciasRouter(data)→  /denuncias
  ├── createOngsRouter(data)     →  /ongs
  └── createAdminRouter(data)    →  /admin
`

Veja [[Rotas]] para detalhes de cada rota.

---

## Fluxo de Requisição

`
Cliente → Express → Middleware Global → Rotas → Controller → Data Layer → MySQL/In-Memory
                    (sessão, user)               (validação)
                                                        ↓
                                                 Views (EJS) → HTML
`

1. [[Configuração#app.js|app.js]] configura middlewares globais
2. [[Middleware]] injeta res.locals.user, isLoggedIn, isAdmin
3. Rota específica trata a requisição
4. data.xxx() executa a operação no banco
5. View EJS renderiza o HTML

---

## Injeção de Dependência

O objeto data contém todos os métodos de banco e é passado para as factories de rota.

Em testes (NODE_ENV=test), usa-se mockDatabase.js (in-memory).
Em produção, usa-se database.js (MySQL real).

Veja [[Camada de Dados]].

---

## Localização dos Arquivos

| Camada | Diretório |
|--------|-----------|
| Entry Point | [[Configuração#app.js|app.js]] |
| Rotas | [[Rotas|app/routes/]] |
| Views | [[Views|app/views/]] |
| Data Layer | [[Camada de Dados|data/]] |
| Middleware | [[Middleware|app/middleware/]] |
| Config | [[Configuração|config/]] |
| Assets | app/public/ |
| Testes | [[Testes|tests/]] |
