const request = require('supertest');
const app = require('../../app');

describe('routes/ongs', () => {
  test('GET /ongs renders the ONG list', async () => {
    const response = await request(app).get('/ongs');

    expect(response.status).toBe(200);
    expect(response.text).toContain('ONGs Parceiras');
  });

  test('GET /ongs/:id renders ONG details', async () => {
    const response = await request(app).get('/ongs/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('ONG Água Limpa');
  });

  test('GET /ongs/:id returns 404 for an unknown ONG', async () => {
    const response = await request(app).get('/ongs/999');

    expect(response.status).toBe(404);
    expect(response.text).toContain('ONG não encontrada');
  });

  test('admin session can access ONG admin dashboard', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    const response = await agent.get('/ongs/admin/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Administração da ONG');
  });
});
