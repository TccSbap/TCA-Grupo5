const request = require('supertest');
const { createMockReq, createMockRes } = require('../helpers/httpMocks');
const { resetData } = require('../../data/mockDatabase');

const signInOng = async (agent) => {
  await agent
    .post('/auth/login')
    .type('form')
    .send({
      email: 'admin@agualimpa.org',
      password: '123456'
    });
};

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

  test('POST /denuncias/nova informa falha de persistencia sem indicar sucesso', async () => {
    const { createDenunciasController } = require('../../app/controllers/denunciasController');
    const handler = createDenunciasController({ createDenuncia: jest.fn().mockRejectedValue(new Error('database unavailable')) }).create;
    const req = createMockReq({
      session: {
        user: {
          id: 11,
          name: 'João Silva',
          type: 'user'
        }
      },
      body: {
        title: 'Denuncia valida para teste',
        description: 'Descricao longa o suficiente para passar na validacao.',
        location: 'Centro - SP',
        category: 'agua'
      }
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/denuncias/nova?error=' + encodeURIComponent('Não foi possível registrar a denúncia. Tente novamente.'));
  });

  test('rotas de resposta e atualizacao de status por ONG foram removidas', async () => {
    const app = require('../../app');
    const agent = request.agent(app);
    await signInOng(agent);
    const response = await agent.post('/denuncias/1/responder').type('form').send({ response: 'texto' });
    const status = await agent.post('/denuncias/1/status').type('form').send({ status: 'resolvida' });
    expect(response.status).toBe(404);
    expect(status.status).toBe(404);
  });
});
