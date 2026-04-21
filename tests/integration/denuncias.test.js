const request = require('supertest');
const app = require('../../app');

describe('routes/denuncias', () => {
  test('GET /denuncias renders the listing page', async () => {
    const response = await request(app).get('/denuncias');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Denúncias');
  });

  test('GET /denuncias with status filter renders successfully', async () => {
    const response = await request(app).get('/denuncias?status=pendente');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Denúncias');
  });

  test('POST /denuncias/nova rejects missing fields', async () => {
    const response = await request(app)
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

  test('GET /denuncias/:id returns 404 when denuncia does not exist', async () => {
    const response = await request(app).get('/denuncias/99999');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Denúncia não encontrada');
  });

  test('POST /denuncias/:id/status blocks anonymous users', async () => {
    const response = await request(app)
      .post('/denuncias/1/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(403);
    expect(response.text).toContain('Acesso Negado');
  });

  test('admin session can update a denuncia status', async () => {
    const agent = request.agent(app);

    await agent
      .post('/admin/dashboard')
      .type('form')
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    const response = await agent
      .post('/denuncias/1/status')
      .type('form')
      .send({ status: 'resolvida' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/1?success=Status%20atualizado%20com%20sucesso!');
  });
});
