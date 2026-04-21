const request = require('supertest');
const app = require('../../app');

describe('smoke tests da aplicação', () => {
  test('GET / responde com sucesso', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
  });

  test('GET /unknown-page retorna 404', async () => {
    const response = await request(app).get('/unknown-page');

    expect(response.status).toBe(404);
  });

  test('POST /__test/session/clear limpa a sessão de teste', async () => {
    const agent = request.agent(app);

    await agent.post('/__test/session').send({
      user: {
        id: 11,
        name: 'João Silva',
        type: 'user'
      }
    });

    const response = await agent.post('/__test/session/clear');

    expect(response.status).toBe(204);
  });
});
