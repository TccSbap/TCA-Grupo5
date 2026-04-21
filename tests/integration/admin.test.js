const request = require('supertest');
const app = require('../../app');

describe('routes/admin', () => {
  test('GET /admin/login renders the admin login page', async () => {
    const response = await request(app).get('/admin/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login de Administrador');
  });

  test('POST /admin/dashboard rejects invalid credentials', async () => {
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

  test('POST /admin/dashboard accepts the illustrative admin credentials', async () => {
    const response = await request(app)
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/dashboard_admin');
  });
});
