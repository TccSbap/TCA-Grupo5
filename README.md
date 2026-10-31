# Água Consciente — ODS 6

Aplicação Express/EJS para registrar problemas de água e saneamento e apoiar o encaminhamento aos órgãos competentes. ONGs oferecem orientação e apoio às comunidades. A plataforma é gratuita e não oferece planos ou assinaturas.

## Executar localmente

Com Node.js e npm instalados:

```sh
npm install
npm run start:mock
```

O modo mock usa dados de demonstração em memória e abre na porta 3000. As alterações nesse modo se perdem ao reiniciar. Para desenvolvimento com recarga, usar `npm run start:watch` conforme a configuração local.

Para usar MySQL, configurar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `SESSION_SECRET` no ambiente e executar `npm start`. Em produção, usar `npm run start:prod` com `.env.prod`; são obrigatórios banco e segredo de sessão próprios. Não versionar credenciais.

`config/database.sql` é um bootstrap legado com `DROP TABLE`: não executá-lo sobre um banco existente. Planos, assinaturas e respostas históricas permanecem preservados no banco, sem fluxo correspondente na aplicação. Novos cadastros de ONG gravam conta e organização na mesma transação.

## Funcionalidades

- Cadastro, login, troca de senha e dashboard de usuário.
- Registro e consulta pública de denúncias, com categorias compatíveis com o banco.
- Perfil e dados cadastrais de ONGs; dashboard administrativo restrito.
- Registro de intenção de doação. Não há processamento financeiro, emissão de Pix/boleto ou coleta de dados de cartão; novos registros ficam pendentes.
- Notícias com fontes originais, busca e filtro por tema.
- Navegação inferior para celulares e tablets; conteúdo offline genérico sem dados da sessão.

## Notícias

A seleção editorial está em `data/tables/noticias.js`. Ela é compartilhada pela home e pela página de notícias, em modo mock e MySQL, e combinada com publicações externas válidas do banco. Exemplos antigos com links para a própria listagem não são publicados. Não há atualização automática; cada notícia inclui fonte, data e link original. Imagens locais são ilustrativas.

## Testes

```sh
npm test -- --runInBand
npm run test:integration
npm run test:e2e
```

Playwright usa Chromium por padrão. Para usar um Edge já instalado, definir `PLAYWRIGHT_BROWSER_CHANNEL=msedge`. `BASE_URL` permite usar outra porta local; com servidor já iniciado, definir também `PLAYWRIGHT_EXTERNAL_SERVER=true`. Os testes de interface iniciam o aplicativo em modo de teste com dados em memória.

Detalhes das correções, curadoria e limites de validação: [revisão de 31/10/2026](docs/revisao-2026-10-31.md).
