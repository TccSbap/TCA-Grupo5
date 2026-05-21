---
tags:
  - views
  - ui
  - templates
created: 2026-05-13
---
# Views

#view #ejs #ui #template

---

## Layout Principal

views/layout.ejs -- Template base que todas as páginas usam.

- Header: Navbar com logo, links e autenticação
- Body: <%- body %> injetado por cada view
- Footer: Links, contato, redes sociais
- Meta: [[PWA|PWA]] (manifest, theme-color), Open Graph (og:title, og:description, og:image, etc.)
- Fonts: Google Fonts (Inter), Font Awesome 6

---

## Partials

| Arquivo | Descrição |
|---------|-----------|
| partials/header.ejs | Cabeçalho reutilizável com navegação |
| partials/footer.ejs | Rodapé com links e redes sociais |

---

## Páginas

### Home
- Rota: GET / -- [[Rotas#Rota Raiz]]
- index.ejs -- Hero, estatísticas, cards ODS, galeria, notícias, denúncias recentes
- index_new_sections.ejs -- Seções alternativas

### Institucionais
- Rotas: GET /sobre, GET /contato -- [[Rotas#Rota Raiz]]
- sobre.ejs -- Missão, impacto, valores, CTA
- contato.ejs -- Informações, formulário, FAQ accordion

### Autenticação
- Rotas: /auth/login, /auth/cadastro -- [[Rotas#Autenticação]]
- auth/login.ejs -- Formulário de login
- auth/cadastro.ejs -- Cadastro com toggle ONG, validação client-side

### Admin
- Rotas: /admin/* -- [[Rotas#Admin]]
- admin/login.ejs, admin/dashboard.ejs, admin/dashboard_admin.ejs
- admin/denuncias.ejs, admin/ongs.ejs

### Denúncias
- Rotas: /denuncias* -- [[Rotas#Denúncias]]
- denuncias/index.ejs, denuncias/nova.ejs, denuncias/detalhes.ejs
- **CEP Automático**: O formulário `nova.ejs` possui um campo de CEP que, ao perder o foco, consulta a [ViaCEP API](https://viacep.com.br/) (gratuita, sem chave) e preenche automaticamente o campo "Localização" com logradouro, bairro, cidade e estado.

### ONGs
- Rotas: /ongs* -- [[Rotas#ONGs]]
- ongs/index.ejs, ongs/detalhes.ejs, ongs/admin.ejs, ongs/stats.ejs

### Financeiro
- Rotas: /doacoes, /planos -- [[Rotas#Rota Raiz]]
- doacoes.ejs, doacao_form.ejs, planos.ejs, plano_form.ejs

### Erros
- 403.ejs -- Acesso negado
- 404.ejs -- Página não encontrada

---

## Assets Estáticos

### CSS
| Arquivo | Descrição |
|---------|-----------|
| public/css/style.css | Design system completo, responsivo (2631 linhas) |
| public/stylesheets/admin-dashboard.css | Dashboard admin |
| public/stylesheets/doacoes.css | Cards de doação |
| public/stylesheets/planos.css | Cards de planos |
| public/stylesheets/form.css | Formulários estilizados |

### JavaScript
| Arquivo | Descrição |
|---------|-----------|
| public/js/main.js | Menu mobile, animações, notificações, service worker |
| public/js/validation.js | Validadores: email, CPF, telefone, senha |

### Imagens
public/images/ -- 14 arquivos (webp, png, jpg)
public/pwa/ -- Ícones (192px, 512px) e screenshots PWA
