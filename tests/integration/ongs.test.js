const request = require('supertest');
const app = require('../../app');

const signInAdmin = async (agent) => {
  await agent.post('/admin/dashboard').type('form').send({
    email: 'admin@agualimpa.org',
    password: '123456'
  });
};

describe('rotas de ONGs', () => {
  test('GET /ongs renderiza a lista de ONGs', async () => {
    const response = await request(app).get('/ongs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('ONGs Parceiras');
  });

  test('GET /ongs/:id renderiza os detalhes da ONG', async () => {
    const response = await request(app).get('/ongs/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('ONG Água Limpa');
  });

  test('GET /ongs/:id retorna 404 para uma ONG desconhecida', async () => {
    const response = await request(app).get('/ongs/999');

    expect(response.status).toBe(404);
    expect(response.text).toContain('ONG não encontrada');
  });

  test('sessão admin consegue acessar o painel administrativo da ONG', async () => {
    const agent = request.agent(app);
    await signInAdmin(agent);

    const response = await agent.get('/ongs/admin/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Administração da ONG');
  });

  test('sessão admin consegue acessar a página de estatísticas da ONG', async () => {
    const agent = request.agent(app);
    await signInAdmin(agent);

    const response = await agent.get('/ongs/admin/stats');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Estatísticas da ONG');
  });
});
