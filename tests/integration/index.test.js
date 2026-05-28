const request = require('supertest');
const app = require('../../app');
const { resetData } = require('../../data/mockDatabase');

beforeEach(() => {
  resetData();
});

const signInUser = async (agent) => {
  await agent.post('/auth/login').type('form').send({
    email: 'joao@email.com',
    password: '123456'
  });
};

const signInAdmin = async (agent) => {
  await agent.post('/admin/dashboard').type('form').send({
    email: 'admin@ods6.org',
    password: '123456'
  });
};

const signInOng = async (agent) => {
  await agent.post('/auth/login').type('form').send({
    email: 'admin@agualimpa.org',
    password: '123456'
  });
};

describe('rotas principais', () => {
  test('GET / renderiza a página inicial', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Água Consciente para Todos');
  });

  test('GET /sobre renderiza a página sobre', async () => {
    const response = await request(app).get('/sobre');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Sobre o Projeto');
  });

  test('GET /contato renderiza a página de contato', async () => {
    const response = await request(app).get('/contato');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Contato');
  });

  test('GET /planos renderiza a página de planos', async () => {
    const response = await request(app).get('/planos');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Nossos Planos');
  });

  test('GET /doacoes renderiza a página de doações', async () => {
    const response = await request(app).get('/doacoes');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Faça sua Doação');
  });

  test('GET /noticias renderiza a página de notícias', async () => {
    const response = await request(app).get('/noticias');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Notícias');
  });

  test('GET /denuncias/nova redireciona usuários anônimos para o login', async () => {
    const response = await request(app).get('/denuncias/nova');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('usuário autenticado consegue abrir o formulário de nova denúncia', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent.get('/denuncias/nova');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Nova Denúncia');
  });

  test('GET /doacoes/:ongId/doar renderiza o formulário de doação para uma ONG válida', async () => {
    const response = await request(app).get('/doacoes/1/doar');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Doar para ONG Água Limpa');
  });

  test('GET /doacoes/:ongId/doar redireciona quando a ONG não existe', async () => {
    const response = await request(app).get('/doacoes/999/doar');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/doacoes');
  });

  test('GET /planos/:planoId/assinar renderiza o formulário de assinatura do plano', async () => {
    const response = await request(app).get('/planos/1/assinar');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Assinar Plano Essencial');
  });

  test('GET /planos/:planoId/assinar redireciona quando o plano não existe', async () => {
    const response = await request(app).get('/planos/999/assinar');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/planos');
  });

  test('usuário autenticado consegue enviar uma nova denúncia', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: 'Falta de água no bairro',
        description: 'Há cinco dias a comunidade está sem abastecimento de água potável.',
        location: 'Jardim Esperança - SP',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('success=Valida%C3%A7%C3%A3o%20conclu%C3%ADda');
  });

  test('GET /dashboard redireciona usuários anônimos para o login', async () => {
    const response = await request(app).get('/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('usuário autenticado acessa o dashboard e as páginas admin ficam restritas', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const dashboard = await agent.get('/dashboard');
    const admin = await agent.get('/admin');
    const adminDenuncias = await agent.get('/admin/denuncias');
    const adminOngs = await agent.get('/admin/ongs');

    expect(dashboard.status).toBe(200);
    expect(dashboard.text).toContain('Meu Dashboard');
    expect(admin.status).toBe(302);
    expect(admin.headers.location).toBe('/dashboard');
    expect(adminDenuncias.status).toBe(302);
    expect(adminDenuncias.headers.location).toBe('/dashboard');
    expect(adminOngs.status).toBe(302);
    expect(adminOngs.headers.location).toBe('/dashboard');
  });

  test('sessão ONG acessa o painel da ONG e é redirecionada do dashboard do usuário', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const dashboard = await agent.get('/dashboard');
    const ongDashboard = await agent.get('/ongs/admin/dashboard');

    expect(dashboard.status).toBe(302);
    expect(dashboard.headers.location).toBe('/ongs/admin/dashboard');
    expect(ongDashboard.status).toBe(200);
    expect(ongDashboard.text).toContain('Painel da ONG');
  });

  test('sessão admin consegue acessar o dashboard administrativo e as páginas de gerenciamento', async () => {
    const agent = request.agent(app);
    await signInAdmin(agent);

    const dashboard = await agent.get('/dashboard');
    const adminHome = await agent.get('/admin');
    const denuncias = await agent.get('/admin/denuncias');
    const ongs = await agent.get('/admin/ongs');

    expect(dashboard.status).toBe(302);
    expect(dashboard.headers.location).toBe('/admin');
    expect(adminHome.status).toBe(200);
    expect(adminHome.text).toContain('Painel Administrativo');
    expect(denuncias.status).toBe(200);
    expect(denuncias.text).toContain('Gerenciar Denúncias');
    expect(ongs.status).toBe(200);
    expect(ongs.text).toContain('Gerenciar ONGs');
  });

  test('GET /admin renderiza o painel administrativo', async () => {
    const agent = request.agent(app);
    await signInAdmin(agent);

    const response = await agent.get('/admin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Painel Administrativo');
  });
});
