const request = require('supertest');
const app = require('../../app');
const data = require('../../data/mockDatabase');

const signInAdmin = async () => {
  const agent = request.agent(app);
  await agent.post('/admin/dashboard').type('form').send({ email: 'admin@ods6.org', password: '123456' });
  return agent;
};

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

  test('somente ADMIN pode abrir as telas de edição de denúncias e ONGs', async () => {
    const complaintResponse = await request(app).get('/admin/denuncias/1/editar');
    const ongResponse = await request(app).get('/admin/ongs/1/editar');

    expect(complaintResponse.status).toBe(302);
    expect(complaintResponse.headers.location).toBe('/auth/login');
    expect(ongResponse.status).toBe(302);
    expect(ongResponse.headers.location).toBe('/auth/login');
  });

  test('ADMIN pode editar todos os campos da denúncia e excluí-la', async () => {
    const agent = await signInAdmin();
    const denuncia = data.getDenunciaById(1);
    const formDate = denuncia.createdAt.slice(0, 16);
    const editPage = await agent.get('/admin/denuncias/1/editar');

    expect(editPage.status).toBe(200);
    expect(editPage.text).toContain('name="latitude"');
    expect(editPage.text).toContain('name="userName"');

    const response = await agent.post('/admin/denuncias/1/editar').type('form').send({
      title: 'Denúncia revisada pelo ADMIN',
      description: 'Descrição administrativa atualizada.',
      location: 'Rua Central, 100',
      latitude: '-23.55',
      longitude: '-46.63',
      category: 'agua',
      status: 'em_andamento',
      userId: String(denuncia.userId),
      userName: 'Autor revisado',
      createdAt: formDate
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/admin/denuncias?success=');
    expect(data.getDenunciaById(1)).toMatchObject({
      title: 'Denúncia revisada pelo ADMIN',
      description: 'Descrição administrativa atualizada.',
      location: 'Rua Central, 100',
      category: 'agua',
      status: 'em_andamento',
      userName: 'Autor revisado'
    });

    const deletion = await agent.post('/admin/denuncias/1/excluir').type('form').send({});
    expect(deletion.status).toBe(302);
    expect(data.getDenunciaById(1)).toBeFalsy();
  });

  test('ADMIN pode editar, desativar e reativar uma ONG preservando o histórico', async () => {
    const agent = await signInAdmin();
    const ong = data.getOngById(1);
    const formDate = ong.createdAt.slice(0, 16);
    const editPage = await agent.get('/admin/ongs/1/editar');

    expect(editPage.status).toBe(200);
    expect(editPage.text).toContain('name="cnpj"');
    expect(editPage.text).toContain('name="rg"');

    const editResponse = await agent.post('/admin/ongs/1/editar').type('form').send({
      name: 'ONG Atualizada',
      description: 'Atuação atualizada pelo administrador.',
      contact: 'contato@ong-atualizada.org',
      cnpj: '12.345.678/0001-90',
      rg: '1234567',
      phone: '(11) 99999-1111',
      address: 'Barueri, SP',
      userId: String(ong.userId),
      createdAt: formDate,
      isActive: '1'
    });

    expect(editResponse.status).toBe(302);
    expect(data.getOngById(1)).toMatchObject({ name: 'ONG Atualizada', cnpj: '12.345.678/0001-90', rg: '1234567' });
    expect(data.getUserById(ong.userId).ongName).toBe('ONG Atualizada');

    const deactivation = await agent.post('/admin/ongs/1/excluir').type('form').send({});
    expect(deactivation.status).toBe(302);
    expect(data.getOngById(1).isActive).toBe(false);
    expect(data.getPublicOngById(1)).toBeNull();

    const reactivation = await agent.post('/admin/ongs/1/reativar').type('form').send({});
    expect(reactivation.status).toBe(302);
    expect(data.getOngById(1).isActive).toBe(true);
    expect(data.getPublicOngById(1)).toMatchObject({ name: 'ONG Atualizada' });
  });
});
