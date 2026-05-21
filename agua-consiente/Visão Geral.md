---
tags:
  - overview
  - visao-geral
created: 2026-05-13
---
# Visão Geral

#projeto #documentacao #ods6

---

## Propósito

Plataforma web para denúncias de problemas de saneamento básico, conectando cidadãos a ONGs parceiras. Parte do ODS 6 (Água Limpa e Saneamento) da ONU.

## Funcionalidades

### Para Usuários
- [[Rotas#Autenticação\|Cadastro e login]]
- [[Rotas#Denúncias\|Criação de denúncias]] sobre problemas de saneamento
- Visualização de denúncias públicas
- Acompanhamento do status das próprias denúncias
- Dashboard pessoal com estatísticas
- [[Rotas#ONGs\|Visualização de ONGs parceiras]]

### Para ONGs (Administradores)
- [[Middleware#requireAdmin\|Painel administrativo]]
- Resposta às denúncias dos usuários
- Atualização de status das denúncias
- Estatísticas de desempenho
- Gerenciamento de casos

### Funcionalidades Gerais
- [[Middleware|Sistema de autenticação seguro]]
- Interface responsiva e moderna
- [[Rotas#Páginas Institucionais\|Páginas informativas]] (Sobre, Contato)
- [[Views#Denúncias\|Sistema de filtros para denúncias]]
- [[Camada de Dados#Seeds\|Dados de demonstração pré-carregados]]
- [[PWA|Suporte PWA]] (instalável, offline)

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Template | EJS |
| Banco | MySQL 2 (mysql2) |
| Senhas | bcryptjs |
| Sessão | express-session |
| Validação | express-validator |
| Upload | multer |
| Testes | Jest + Supertest + Playwright |
| APIs Externas | ViaCEP (consulta de CEP gratuita) |

---

## Requisitos

- Node.js 18+
- MySQL 8+
- Navegador moderno (Chrome, Firefox, Edge)

---

## Estrutura de Usuários

- `user` — Usuário comum, pode criar denúncias
- `ong` — Organização, pode responder denúncias e acessar painel
- `admin` — Administrador geral, gerencia ONGs e denúncias

Veja [[Middleware]] para detalhes de autorização.
