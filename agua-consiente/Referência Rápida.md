---
tags:
  - referencia
  - comandos
  - cheat-sheet
created: 2026-05-13
---
# Referência Rápida

## Comandos

```bash
npm start
npm run dev
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
npm run test:e2e
```

## Estrutura de Diretórios

```text
/
├── app.js
├── app/
│   ├── controllers/   # Controllers
│   ├── middleware/    # Auth
│   ├── models/        # Models SQL
│   ├── public/        # Assets estáticos
│   ├── routes/        # Rotas Express (5 arquivos)
│   └── views/         # Templates EJS (28 arquivos, incluindo partials)
├── config/            # Config DB + SQL (2 arquivos)
├── data/              # Database + repositórios (10 arquivos)
└── tests/             # Testes (17 arquivos)
```

## Tipos de Usuário

| type | Acesso |
|------|--------|
| user | Criar denúncias, dashboard pessoal |
| ong | Responder denúncias, painel admin, estatísticas |
| admin | Gerenciar ONGs e denúncias |

## Dependências Externas

| Serviço | Função |
|---------|--------|
| ViaCEP (viacep.com.br) | Consulta gratuita de CEP para preenchimento automático de endereço |

## Portas

| Serviço | Porta |
|---------|-------|
| Aplicação | 3000 |
| MySQL | 3306 |

## Credenciais Admin

Não há mais valores pré-preenchidos na tela de login. Use credenciais reais do ambiente ou dados de desenvolvimento configurados fora da view.

## Artigos Relacionados

- [[Índice]] - Navegação principal
- [[Visão Geral]] - Propósito e funcionalidades
- [[Arquitetura]] - Padrões e fluxo de dados
- [[Rotas]] - Todas as rotas da aplicação
- [[Camada de Dados]] - Database, repositórios e seeds
- [[Views]] - Templates e UI
- [[Testes]] - Estratégia de testes
- [[Middleware]] - Autenticação e autorização
- [[Configuração]] - Setup e variáveis de ambiente
- [[PWA]] - Progressive Web App
