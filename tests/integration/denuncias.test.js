const request = require('supertest');
const app = require('../../app');
const { resetData } = require('../../data/mockDatabase');

beforeEach(() => {
  resetData();
});

const signInUser = async (agent) => {
  await agent
    .post('/auth/login')
    .type('form')
    .send({
      email: 'joao@email.com',
      password: '123456'
    });
};

const signInOng = async (agent) => {
  await agent
    .post('/auth/login')
    .type('form')
    .send({
      email: 'admin@agualimpa.org',
      password: '123456'
    });
};

describe('rotas de denúncias', () => {
  test('GET /denuncias renderiza a página de listagem', async () => {
    const response = await request(app).get('/denuncias');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Denúncias');
  });

  test('GET /denuncias com filtro de status renderiza corretamente', async () => {
    const response = await request(app).get('/denuncias?status=pendente');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Denúncias');
  });

  test('GET /denuncias/nova redireciona usuários anônimos para o login', async () => {
    const response = await request(app).get('/denuncias/nova');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('POST /denuncias/nova redireciona usuários anônimos para o login', async () => {
    const response = await request(app)
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: 'Falta de água no bairro',
        description: 'Há cinco dias a comunidade está sem abastecimento de água potável.',
        location: 'Jardim Esperança - SP',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('usuário autenticado consegue acessar o formulário de nova denúncia', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent.get('/denuncias/nova');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Nova Denúncia');
  });

  test('POST /denuncias/nova rejeita campos ausentes para usuários autenticados', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: '',
        description: '',
        location: '',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('Preencha%20todos%20os%20campos%20obrigat%C3%B3rios');
  });

  test('POST /denuncias/nova rejeita título muito curto', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: 'Curto',
        description: 'Descricao longa o suficiente para passar na validacao.',
        location: 'Centro - SP',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('O%20t%C3%ADtulo%20deve%20ter%20no%20m%C3%ADnimo%2010%20caracteres');
  });

  test('POST /denuncias/nova rejeita descrição muito curta', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: 'Falta de agua no bairro',
        description: 'Pouca descricao',
        location: 'Centro - SP',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('A%20descri%C3%A7%C3%A3o%20deve%20ter%20no%20m%C3%ADnimo%2020%20caracteres');
  });

  test('POST /denuncias/nova rejeita localização muito curta', async () => {
    const agent = request.agent(app);
    await signInUser(agent);

    const response = await agent
      .post('/denuncias/nova')
      .type('form')
      .send({
        title: 'Falta de agua no bairro',
        description: 'Descricao longa o suficiente para passar na validacao.',
        location: 'SP',
        category: 'agua'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('Informe%20uma%20localiza%C3%A7%C3%A3o%20v%C3%A1lida');
  });

  test('POST /denuncias/nova aceita uma denúncia válida e redireciona com sucesso', async () => {
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

  test('GET /denuncias/:id retorna 404 quando a denúncia não existe', async () => {
    const response = await request(app).get('/denuncias/99999');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Denúncia não encontrada');
  });

  test('POST /denuncias/:id/status redireciona usuários anônimos para o login', async () => {
    const response = await request(app)
      .post('/denuncias/1/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
  });

  test('sessão ONG consegue atualizar o status de uma denúncia', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent
      .post('/denuncias/1/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/1?success=Status%20atualizado%20com%20sucesso!');
  });

  test('sessão ONG consegue adicionar uma resposta à denúncia', async () => {
    const agent = request.agent(app);
    await signInOng(agent);

    const response = await agent
      .post('/denuncias/1/responder')
      .type('form')
      .send({
        response: 'Estamos verificando a situação com prioridade.',
        newStatus: 'em_andamento'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/1?success=Resposta%20adicionada%20com%20sucesso!');
  });
});
