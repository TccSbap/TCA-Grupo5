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

  test('POST /denuncias/nova redireciona com erro quando a validação lança exceção', () => {
    const router = require('../../app/routes/denuncias.js');
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
