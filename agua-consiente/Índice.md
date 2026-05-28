---
tags:
  - home
  - indice
created: 2026-05-13
---
# 🌊 ODS 6 - Água Consciente

Bem-vindo ao vault de documentação do projeto **ODS 6 - Site de Denúncias sobre Saneamento Básico**.

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

## Tags Principais

- `#rota` - Arquivos de rota do Express
- `#view` - Templates EJS
- `#dados` - Camada de dados (repositórios, tabelas)
- `#teste` - Arquivos de teste
- `#middleware` - Middleware Express
- `#config` - Configuração do projeto
- `#pwa` - Progressive Web App
- `#public` - Assets estáticos (CSS, JS, imagens)
- `#seed` - Dados de demonstração
- `#ejs` - Templates EJS
- `#express` - Framework web
- `#mysql` - Banco de dados

## Estrutura do Repositório

```text
/
├── app.js
├── app/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── public/
│   ├── routes/
│   └── views/
├── config/
├── data/
├── doc/
├── page_texts/
├── scripts/
└── tests/
```

## Observações

- O MVC principal fica em `app/`.
- A camada de dados compartilhada fica em `data/`.
- O banco e as migrations ficam em `config/`.
- Os testes cobrem `app/`, `data/` e os fluxos de integração/e2e.
