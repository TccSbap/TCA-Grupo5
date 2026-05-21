---
tags:
  - home
  - indice
created: 2026-05-13
---
# 🌊 ODS 6 - Água Consciente

Bem-vindo ao vault de documentação do projeto **ODS 6 - Site de Denúncias sobre Saneamento Básico**.

#documentacao #projeto #ods6

---

## Navegação

| Nota | Descrição |
|------|-----------|
| [[Visão Geral]] | Propósito, funcionalidades e stack tecnológica |
| [[Arquitetura]] | Estrutura do projeto, padrões e fluxo de dados |
| [[Rotas]] | Todas as rotas da aplicação |
| [[Camada de Dados]] | Database, repositórios e seeds |
| [[Views]] | Templates EJS e UI |
| [[Testes]] | Testes unitários, integração e e2e |
| [[Middleware]] | Autenticação e autorização |
| [[Configuração]] | Variáveis de ambiente, SQL schema |
| [[PWA]] | Progressive Web App, Service Worker, Manifest |
| [[Referência Rápida]] | Comandos, atalhos e convenções |

---

## Tags Principais

- `#rota` — Arquivos de rota do Express
- `#view` — Templates EJS
- `#dados` — Camada de dados (repositórios, tabelas)
- `#teste` — Arquivos de teste
- `#middleware` — Middleware Express
- `#config` — Configuração do projeto
- `#pwa` — Progressive Web App
- `#public` — Assets estáticos (CSS, JS, imagens)
- `#seed` — Dados de demonstração
- `#ejs` — Templates EJS
- `#express` — Framework web
- `#mysql` — Banco de dados

---

## Estrutura do Repositório

```
/
├── app.js              # Entry point
├── routes/             # Rotas Express
├── views/              # Templates EJS
├── data/               # Database + Repositórios
│   ├── repositories/
│   └── tables/
├── middleware/          # Auth middleware
├── config/             # Config DB + SQL schema
├── public/             # Assets estáticos
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── pwa/
│   └── stylesheets/
├── tests/              # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── doc/                # Documentação adicional
└── page_texts/         # Textos de referência
```
