const request = require('supertest');
const app = require('../../app');

describe('routes/index', () => {
  test('GET / renders the homepage', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Água Consciente para Todos');
  });

  test('GET /sobre renders the about page', async () => {
    const response = await request(app).get('/sobre');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Sobre o Projeto');
  });

  test('GET /contato renders the contact page', async () => {
    const response = await request(app).get('/contato');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Contato');
  });

  test('GET /planos renders the plans page', async () => {
    const response = await request(app).get('/planos');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Nossos Planos');
  });

  test('GET /doacoes renders the donations page', async () => {
    const response = await request(app).get('/doacoes');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Faça sua Doação');
  });

  test('GET /noticias renders the news page', async () => {
    const response = await request(app).get('/noticias');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Notícias');
  });

  test('GET /doacoes/:ongId/doar renders the donation form for a valid ONG', async () => {
    const response = await request(app).get('/doacoes/1/doar');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Doar para ONG Água Limpa');
  });

  test('GET /doacoes/:ongId/doar redirects when the ONG does not exist', async () => {
    const response = await request(app).get('/doacoes/999/doar');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/doacoes');
  });

  test('GET /planos/:planoId/assinar renders the plan subscription form', async () => {
    const response = await request(app).get('/planos/1/assinar');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Assinar Plano Essencial');
  });

  test('GET /planos/:planoId/assinar redirects when the plan does not exist', async () => {
    const response = await request(app).get('/planos/999/assinar');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/planos');
  });

  test('GET /dashboard redirects anonymous users to login', async () => {
    const response = await request(app).get('/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('admin session can access the main dashboard and management pages', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    const dashboard = await agent.get('/dashboard');
    const denuncias = await agent.get('/admin/denuncias');
    const ongs = await agent.get('/admin/ongs');

    expect(dashboard.status).toBe(200);
    expect(dashboard.text).toContain('Dashboard');
    expect(denuncias.status).toBe(200);
    expect(denuncias.text).toContain('Gerenciar Denúncias');
    expect(ongs.status).toBe(200);
    expect(ongs.text).toContain('Gerenciar ONGs');
  });
});
