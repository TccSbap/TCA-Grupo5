const request = require('supertest');
const { createMockReq, createMockRes } = require('../helpers/httpMocks');
const { resetData } = require('../../data/mockDatabase');

describe('tratamento de erros das denúncias', () => {
  beforeEach(() => {
    resetData();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('GET /denuncias/nova redireciona usuários anônimos para o login', async () => {
    const app = require('../../app');
    const response = await request(app).get('/denuncias/nova');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('POST /denuncias/nova redireciona com erro quando a validação lança exceção', () => {
    const router = require('../../routes/denuncias.js');
    const layer = router.stack.find(
      (entry) => entry.route && entry.route.path === '/nova' && entry.route.methods.post
    );
    const handler = layer.route.stack[1].handle;
    const req = createMockReq({
      session: {
        user: {
          id: 11,
          name: 'João Silva',
          type: 'user'
        }
      },
      body: {
        title: {
          get length() {
            throw new Error('forced failure');
          }
        },
        description: 'Descricao longa o suficiente para passar na validacao.',
        location: 'Centro - SP',
        category: 'agua'
      }
    });
    const res = createMockRes();

    handler(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/denuncias/nova?error=Erro ao validar denúncia');
  });

  test('POST /denuncias/99999/responder retorna JSON 404 quando a denúncia não existe', async () => {
    const app = require('../../app');
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@agualimpa.org',
        password: '123456'
      });

    const response = await agent
      .post('/denuncias/99999/responder')
      .type('form')
      .send({
        response: 'Qualquer texto',
        newStatus: 'em_andamento'
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Denúncia não encontrada' });
  });

  test('POST /denuncias/99999/status retorna JSON 404 quando a denúncia não existe', async () => {
    const app = require('../../app');
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@agualimpa.org',
        password: '123456'
      });

    const response = await agent
      .post('/denuncias/99999/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Denúncia não encontrada' });
  });

  test('POST /denuncias/1/status redireciona com erro quando updateDenuncia lança exceção', async () => {
    const database = require('../../data/mockDatabase');
    jest.spyOn(database, 'updateDenuncia').mockImplementation(() => {
      throw new Error('forced failure');
    });

    const app = require('../../app');
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@agualimpa.org',
        password: '123456'
      });

    const response = await agent
      .post('/denuncias/1/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/1?error=Erro%20ao%20atualizar%20status');
  });

  test('POST /denuncias/1/responder redireciona com erro quando updateDenuncia lança exceção', async () => {
    const database = require('../../data/mockDatabase');
    jest.spyOn(database, 'updateDenuncia').mockImplementation(() => {
      throw new Error('forced failure');
    });

    const app = require('../../app');
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@agualimpa.org',
        password: '123456'
      });

    const response = await agent
      .post('/denuncias/1/responder')
      .type('form')
      .send({
        response: 'Estamos verificando a situação.',
        newStatus: 'em_andamento'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/1?error=Erro%20ao%20adicionar%20resposta');
  });
});
