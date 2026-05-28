---
tags:
  - config
  - setup
  - ambiente
created: 2026-05-13
---
# Configuração

#config #setup #ambiente #env

---

## Variáveis de Ambiente (.env)

`
DB_HOST=localhost
DB_PORT=3306
DB_USER=agua
DB_PASSWORD=agua123@
DB_NAME=agua_consiente
SESSION_SECRET=uma_chave_forte_e_unica
DB_CONNECTION_LIMIT=10
`

Arquivo .env ignorado pelo git (via .gitignore).

---

## app.js -- Entry Point

Arquivo principal que:
1. Cria servidor Express com EJS
2. Configura middlewares globais (sessão, body-parser, cookie-parser, estáticos)
3. Conecta as rotas via injeção de dependência
4. Inicializa a camada de dados (ensureDataLoaded)
5. Sobe na porta PORT (default 3000)

`javascript
const app = createApp();
const PORT = process.env.PORT || 3000;
`

Estrutura:

`javascript
app.use('/', createIndexRouter(data));
app.use('/auth', createAuthRouter(data));
app.use('/denuncias', createDenunciasRouter(data));
app.use('/ongs', createOngsRouter(data));
app.use('/admin', createAdminRouter(data));
`

Veja [[Arquitetura]] para o fluxo completo.

---

## Config do Banco (config/database.js)

Cria pool de conexões MySQL2 com as credenciais do .env.

`javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT)
});
`

Em modo de teste (JEST_WORKER_ID ou NODE_ENV=test), desativa o MySQL.

---

## SQL Schema (config/database.sql)

Define 9 tabelas com relacionamentos:

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| users | Usuários (id, name, email, password, type, city, state, phone, created_at) |
| ongs | ONGs (id, user_id, name, description, city, state, phone, site, focus_area, created_at) |
| denuncias | Denúncias (id, user_id, title, description, status, city, state, neighborhood, address, cep, created_at) |
| denuncia_responses | Respostas a denúncias (id, denuncia_id, ong_id, message, created_at) |
| plans | Planos de assinatura (id, name, description, price, features, duration_days, created_at) |
| news | Notícias (id, title, content, author, image_url, created_at) |
| donations | Doações (id, user_id, ong_id, amount, payment_method, created_at) |
| plan_subscriptions | Assinaturas de planos (id, user_id, plan_id, payment_method, status, created_at) |
| contact_messages | Mensagens de contato (id, user_id, name, email, subject, message, created_at) |

### Relacionamentos

`
users 1──N denuncias
denuncias 1──N denuncia_responses
denuncia_responses N──1 ongs
users 1──1 ongs
users 1──N donations
users 1──N plan_subscriptions N──1 plans
users 1──N contact_messages
donations N──1 ongs
`

Veja [[Camada de Dados]] para repositórios e seeds.
