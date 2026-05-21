---
tags:
  - dados
  - database
  - repositorios
created: 2026-05-13
---
# Camada de Dados

#dados #mysql #repositorio #seed

---

## Estrutura

data/database.js e a interface principal (MySQL).
data/mockDatabase.js e a interface em memoria (dev/teste).

Repositorios (data/repositories/):
- helpers.js - Utilitarios (normalizadores, SQL)
- users.repository.js
- ongs.repository.js
- denuncias.repository.js
- planos.repository.js
- noticias.repository.js
- doacoes.repository.js
- assinaturasPlano.repository.js
- mensagensContato.repository.js

Seeds (data/tables/):
- users.js (11 usuarios)
- ongs.js (10 ONGs)
- denuncias.js (16 denuncias com respostas)
- planos.js (3 planos: Essencial, Avancado, Premium)
- noticias.js (6 noticias)
- doacoes.js (3 doacoes)
- assinaturasPlano.js (3 assinaturas)
- mensagensContato.js (3 mensagens)

---

## database.js (MySQL)

Interface principal que importa todos os repositorios MySQL e exporta um objeto com metodos CRUD unificados.

Modo de teste: Quando NODE_ENV === test ou JEST_WORKER_ID esta definido, desativa MySQL.

---

## mockDatabase.js (In-Memory)

Substitui o MySQL por arrays em memoria:
- Carrega dados de data/tables/*.js
- Suporta resetData() - recarrega seeds
- Usado em desenvolvimento e testes

---

## Repositorios

Cada repositorio contem metodos CRUD com SQL e normalizadores via helpers.js.

Destaque: denuncias.repository.js e o mais complexo - carrega denuncias com respostas em uma unica query JOIN e usa transacoes para writes.

---

## Schema SQL

config/database.sql define 9 tabelas:

users 1--N denuncias 1--N denuncia_responses
users 1--1 ongs
users 1--N doacoes
users 1--N assinaturas_plano N--1 planos
users 1--N mensagens_contato

Veja [[Configuracao]] para detalhes do schema e [[Views]] para como os dados sao exibidos.
