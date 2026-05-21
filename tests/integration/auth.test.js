const request = require('supertest');
const app = require('../../app');
const { resetData } = require('../../data/mockDatabase');

beforeEach(() => {
  resetData();
});

describe('rotas de autenticação', () => {
  test('GET /auth/login responde com a página de login', async () => {
    const response = await request(app).get('/auth/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login');
  });

  test('GET /auth/cadastro responde com a página de cadastro', async () => {
    const response = await request(app).get('/auth/cadastro');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Cadastro');
  });

  test('GET /auth/login redireciona usuários logados para o dashboard', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: 'joao@email.com',
        password: '123456'
      });

    const response = await agent.get('/auth/login');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });

  test('POST /auth/login retorna erro de validação quando o e-mail é inválido', async () => {
    const response = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        email: 'invalid-email',
        password: '123456'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/login?error=');
  });

  test('POST /auth/login autentica um usuário válido', async () => {
    const response = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        email: 'joao@email.com',
        password: '123456'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
  });

  test('POST /auth/cadastro rejeita confirmação de senha divergente', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Maria da Silva',
        email: 'maria@exemplo.com',
        password: 'Senha123',
        confirmPassword: 'Senha321',
        userType: 'user'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/cadastro?error=');
  });

  test('POST /auth/cadastro aceita um fluxo válido de cadastro de usuário', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Maria da Silva',
        email: 'maria1@exemplo.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'user'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/login?success=');
  });

  test('POST /auth/cadastro rejeita cadastro de ONG sem campos obrigatórios', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin1@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('Preencha%20todos%20os%20campos%20da%20ONG');
  });

  test('POST /auth/cadastro rejeita nome de ONG muito curto', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin2@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin',
        ongName: 'AB',
        ongDescription: 'Organização de teste validada.',
        ongContact: 'contato@teste.com'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      encodeURIComponent('Nome da ONG deve ter no mínimo 3 caracteres')
    );
  });

  test('POST /auth/cadastro rejeita descrição de ONG muito curta', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin3@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin',
        ongName: 'ONG Teste',
        ongDescription: 'curta',
        ongContact: 'contato@teste.com'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      encodeURIComponent('Descrição da ONG deve ter no mínimo 10 caracteres')
    );
  });

  test('POST /auth/cadastro rejeita e-mail de contato da ONG inválido', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin4@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin',
        ongName: 'ONG Teste',
        ongDescription: 'Organização de teste validada.',
        ongContact: 'contato@teste'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      encodeURIComponent('Email de contato da ONG inválido. Deve conter @ e terminar com .com')
    );
  });

  test('POST /auth/cadastro aceita um fluxo válido de cadastro de ONG', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin5@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin',
        ongName: 'ONG Teste',
        ongDescription: 'Organização de teste validada.',
        ongContact: 'contato@teste.com'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/login?success=');
  });

  test('POST /auth/cadastro persiste telefone e endereço da ONG', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Persistida',
        email: 'persistida@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'ong',
        ongName: 'ONG Persistida',
        ongDescription: 'Organização de teste com descrição válida.',
        ongContact: 'contato@persistida.com',
        ongPhone: '11999990000',
        ongAddress: 'Rua Central, 123'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/login?success=');

    const database = require('../../data/mockDatabase');
    const user = database.getUserByEmail('persistida@teste.com');
    const ong = database.getOngByUserId(user.id);

    expect(ong.phone).toBe('11999990000');
    expect(ong.address).toBe('Rua Central, 123');
  });

  test('GET /auth/logout redireciona para a página inicial', async () => {
    const response = await request(app).get('/auth/logout');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });
});
