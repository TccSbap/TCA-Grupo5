const request = require('supertest');
const app = require('../../app');
const { resetData } = require('../../data/mockDatabase');

beforeEach(() => {
  resetData();
});

const signInOng = async (agent) => {
  await agent.post('/auth/login').type('form').send({
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

  test('sessão ONG consegue acessar o painel da ONG', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent.get('/ongs/admin/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Painel da ONG');
  });

  test('sessão ONG consegue acessar a página de estatísticas da ONG', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent.get('/ongs/admin/stats');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Estatísticas da ONG');
  });

  test('sessão ONG consegue acessar o painel operacional analítico', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent.get('/ongs/admin/dashboard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Tempo médio');
    expect(response.text).toContain('Volume de respostas por período');
  });

  test('sessão ONG consegue exportar o relatório operacional em CSV', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent.get('/ongs/admin/relatorio.csv');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('Seção,Indicador,Valor');
    expect(response.text).toContain('Resumo,Pendências');
  });

  test('ONG recém-cadastrada recebe respostas e vê as denúncias corretas no perfil', async () => {
    const agent = request.agent(app);
    const email = 'ongnova@teste.com';

    await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Nova',
        email,
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'ong',
        ongName: 'ONG Nova',
        ongDescription: 'Organização de teste com descrição válida.',
        ongContact: 'contato@ongnova.com',
        ongCnpj: '04.252.011/0001-10',
        ongRg: '12.345.678-9',
        ongPhone: '11988887777',
        ongAddress: 'Rua Nova, 100'
      });

    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email,
        password: 'Senha123'
      });

    const database = require('../../data/mockDatabase');
    const user = database.getUserByEmail(email);
    const ong = database.getOngByUserId(user.id);

    const response = await agent
      .post('/denuncias/1/responder')
      .type('form')
      .send({
        response: 'Estamos acompanhando o caso com prioridade.',
        newStatus: 'em_andamento'
      });

    expect(response.status).toBe(302);
    expect(database.getDenuncias(ong.id)).toHaveLength(1);

    const details = await request(app).get(`/ongs/${ong.id}`);

    expect(details.status).toBe(200);
    expect(details.text).toContain('Esgoto a céu aberto na Rua das Flores');
  });
});
