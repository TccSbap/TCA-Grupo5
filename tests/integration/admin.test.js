const request = require('supertest');
const app = require('../../app');

describe('rotas administrativas', () => {
  test('GET /admin/login renderiza a página de login do administrador', async () => {
    const response = await request(app).get('/admin/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login do Administrador');
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

  test('GET /admin/dashboard_admin redireciona uma sessão admin autenticada para o painel atual', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@ods6.org',
        password: '123456'
      });

    const response = await agent.get('/admin/dashboard_admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin');
  });

  test('GET /admin renderiza o painel analítico com gráficos de apoio', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@ods6.org',
        password: '123456'
      });

    const response = await agent.get('/admin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Denúncias por status');
    expect(response.text).toContain('Linha do tempo');
  });

  test('GET /admin/relatorio.csv exporta um relatório em CSV', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@ods6.org',
        password: '123456'
      });

    const response = await agent.get('/admin/relatorio.csv');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('Seção,Indicador,Valor');
    expect(response.text).toContain('Resumo geral,Usuários');
  });
});
