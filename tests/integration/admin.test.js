const request = require('supertest');
const app = require('../../app');

describe('rotas administrativas', () => {
  test('GET /admin/login renderiza a página de login do administrador', async () => {
    const response = await request(app).get('/admin/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login de Administrador');
  });

  test('POST /admin/dashboard rejeita credenciais inválidas', async () => {
    const response = await request(app)
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'user@example.com',
        password: 'wrong-password'
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Credenciais inválidas');
  });

  test('POST /admin/dashboard aceita as credenciais ilustrativas de admin', async () => {
    const response = await request(app)
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@ods6.org',
        password: '123456'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin');
  });

  test('GET /admin/dashboard_admin redireciona usuários anônimos para o login', async () => {
    const response = await request(app).get('/admin/dashboard_admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('GET /admin/dashboard_admin renderiza o dashboard para uma sessão admin autenticada', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@ods6.org',
        password: '123456'
      });

    const response = await agent.get('/admin/dashboard_admin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Painel Administrativo');
  });
});
