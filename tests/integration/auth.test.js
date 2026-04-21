const request = require('supertest');
const app = require('../../app');

describe('routes/auth', () => {
  test('GET /auth/login responds with login page', async () => {
    const response = await request(app).get('/auth/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login');
  });

  test('POST /auth/login redirects back with validation error when email is invalid', async () => {
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

  test('POST /auth/cadastro rejects password confirmation mismatches', async () => {
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

  test('POST /auth/cadastro rejects ONG registration without ONG fields', async () => {
    const response = await request(app)
      .post('/auth/cadastro')
      .type('form')
      .send({
        name: 'Admin ONG Teste',
        email: 'admin@teste.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('Preencha%20todos%20os%20campos%20da%20ONG');
  });
});
