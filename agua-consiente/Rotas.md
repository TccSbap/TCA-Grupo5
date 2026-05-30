---
tags:
  - rotas
  - routes
created: 2026-05-13
---
# Rotas

#rota #express #routes

---

## Rota Raiz -- app/routes/index.js

| Método | Caminho | Descrição | Middleware |
|--------|---------|-----------|------------|
| GET | / | Homepage | -- |
| GET | /dashboard | Dashboard do usuário | requireAuth |
| GET | /sobre | Página sobre o projeto | -- |
| GET | /contato | Página de contato | -- |
| POST | /contato | Enviar mensagem de contato | -- |
| GET | /doacoes | Listar doações | -- |
| POST | /doacoes | Criar doação | -- |
| GET | /planos | Listar planos | -- |
| POST | /planos | Assinar plano | -- |
| GET | /noticias | Listar notícias | -- |

Validações: validateDonation, validatePlanSubscription, validateContactMessage

---

## Autenticação -- app/routes/auth.js

| Método | Caminho | Descrição | Middleware |
|--------|---------|-----------|------------|
| GET | /auth/login | Formulário de login | redirectIfLoggedIn |
| POST | /auth/login | Autenticar usuário | -- |
| GET | /auth/cadastro | Formulário de cadastro | redirectIfLoggedIn |
| POST | /auth/cadastro | Registrar usuário/ONG | -- |
| GET | /auth/logout | Encerrar sessão | -- |

---

## Denúncias -- app/routes/denuncias.js

| Método | Caminho | Descrição | Middleware |
|--------|---------|-----------|------------|
| GET | /denuncias | Listar denúncias (com filtros) | -- |
| GET | /denuncias/nova | Formulário de denúncia | requireAuth |
| POST | /denuncias/nova | Criar denúncia | requireAuth |
| GET | /denuncias/:id | Detalhes da denúncia | -- |
| POST | /denuncias/:id/responder | Responder denúncia | requireAdmin |
| POST | /denuncias/:id/status | Atualizar status | requireAdmin |

Filtros: status, cidade, bairro, estado.

---

## ONGs -- app/routes/ongs.js

| Método | Caminho | Descrição | Middleware |
|--------|---------|-----------|------------|
| GET | /ongs | Listar ONGs | -- |
| GET | /ongs/:id | Detalhes da ONG | -- |
| GET | /ongs/admin/dashboard | Dashboard da ONG | requireAdmin |
| GET | /ongs/admin/stats | Estatísticas da ONG | requireAdmin |

---

## Admin -- app/routes/admin.js

| Método | Caminho | Descrição | Middleware |
|--------|---------|-----------|------------|
| GET | /admin/login | Login admin | redirectIfLoggedIn |
| POST | /admin/login | Autenticar admin (rota canônica) | -- |
| POST | /admin/dashboard | Alias legada do login admin | -- |
| GET | /admin/dashboard | Painel admin | requireAdmin |
| GET | /admin/dashboard_admin | Painel admin alt. | requireAdmin |
| GET | /admin/denuncias | Gerenciar denúncias | requireAdmin |
| GET | /admin/ongs | Gerenciar ONGs | requireAdmin |

---

## Tratamento de Erros

- **404**: Qualquer rota não encontrada renderiza app/views/404.ejs
- **403**: Acesso negado renderiza app/views/403.ejs

Veja [[Middleware]] para detalhes de requireAuth e requireAdmin.
