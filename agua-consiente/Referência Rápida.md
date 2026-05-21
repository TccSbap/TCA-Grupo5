---
tags:
  - referencia
  - comandos
  - cheat-sheet
created: 2026-05-13
---
# Referência Rápida

#referencia #comandos #cheatsheet

---

## Comandos

`ash
npm start              # Iniciar servidor (porta 3000)
npm run dev            # Iniciar servidor (modo desenvolvimento)
npm test               # Rodar todos os testes Jest
npm run test:unit      # Testes unitários
npm run test:integration # Testes de integração
npm run test:coverage  # Cobertura de testes
npm run test:e2e       # Testes E2E (Playwright)
`

---

## Estrutura de Diretórios

`
/
├── app.js             # Entry point
├── routes/            # Rotas Express (5 arquivos)
├── views/             # Templates EJS (17 + 2 partials)
├── data/              # Database + repositórios (10 arquivos)
├── middleware/        # Auth (1 arquivo)
├── config/           # Config DB + SQL (2 arquivos)
├── public/           # Assets estáticos
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── pwa/
│   └── stylesheets/
└── tests/            # Testes (14 arquivos)
`

---

## Tipos de Usuário

| type | Acesso |
|------|--------|
| user | Criar denúncias, dashboard pessoal |
| ong | Responder denúncias, painel admin, estatísticas |
| admin | Gerenciar ONGs e denúncias |

---

## Cores (CSS variables)

`css
--primary: #2563eb;
--primary-dark: #1d4ed8;
--secondary: #059669;
--accent: #f59e0b;
--danger: #dc2626;
`

---

## Dependências Externas

| Serviço | Função |
|---------|--------|
| ViaCEP (viacep.com.br) | Consulta gratuita de CEP para preenchimento automático de endereço |

---

## Portas

| Serviço | Porta |
|---------|-------|
| Aplicação | 3000 |
| MySQL | 3306 |

---

## Credenciais Admin (desenvolvimento)

Disponíveis em views/admin/login.ejs (pré-preenchidas).

---

## Artigos Relacionados

- [[Índice]] — Navegação principal
- [[Visão Geral]] — Propósito e funcionalidades
- [[Arquitetura]] — Padrões e fluxo de dados
- [[Rotas]] — Todas as rotas da aplicação
- [[Camada de Dados]] — Database, repositórios e seeds
- [[Views]] — Templates e UI
- [[Testes]] — Estratégia de testes
- [[Middleware]] — Autenticação e autorização
- [[Configuração]] — Setup e variáveis de ambiente
- [[PWA]] — Progressive Web App
