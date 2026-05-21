---
tags:
  - middleware
  - auth
  - seguranca
created: 2026-05-13
---
# Middleware

#middleware #auth #seguranca

---

## Arquivo Único

Todo o middleware de autenticação está em middleware/auth.js.

---

## Funções

### requireAuth

Redireciona para /auth/login se o usuário não estiver logado.

Usado em: /dashboard, /denuncias/nova

### requireAdmin

Retorna 403 se o usuário não for admin ou ong.

Usado em: /admin/*, /ongs/admin/*, /denuncias/:id/responder, /denuncias/:id/status

### redirectIfLoggedIn

Redireciona usuário já logado para dashboard ou admin dashboard.

Usado em: /auth/login, /auth/cadastro, /admin/login

---

## Função Auxiliar

`javascript
const isOngRole = (user) =>
    Boolean(user && (user.type === 'admin' || user.type === 'ong'));
`

---

## Injeção Global

Em app.js, um middleware global insere dados do usuário em todas as views:

`javascript
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    res.locals.isAdmin = req.session.user &&
        (req.session.user.type === 'admin' || req.session.user.type === 'ong');
    next();
});
`

---

## Rotas Relacionadas

- [[Rotas#Rota Raiz]] -- /dashboard usa requireAuth
- [[Rotas#Autenticação]] -- Login/cadastro usam redirectIfLoggedIn
- [[Rotas#Admin]] -- Todas usam requireAdmin
- [[Rotas#ONGs]] -- Admin dashboard usa requireAdmin
- [[Rotas#Denúncias]] -- Responder/status usam requireAdmin

---

## Testes

Testado em [[Testes#Middleware]] (tests/unit/middleware/auth.test.js):

- requireAuth: 2 cenários (logado/não logado)
- requireAdmin: 3 cenários (user comum, admin, ong)
- redirectIfLoggedIn: 3 cenários (não logado, user, ong)
