const express = require('express');
const request = require('supertest');
const { createAuthRouter } = require('../../../routes/auth');
const { createAdminRouter } = require('../../../routes/admin');
const { createDenunciasRouter } = require('../../../routes/denuncias.js');
const { createIndexRouter } = require('../../../routes/index');
const { createOngsRouter } = require('../../../routes/ongs');

const buildApp = (router, user = null) => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    req.session = user ? { user } : {};
    res.render = (view, locals) => res.status(200).json({ view, locals });
    next();
  });
  app.use(router);
  return app;
};

describe('dependency injection for routes', () => {
  test('auth route uses injected methods in login and signup', async () => {
    const data = {
      authenticateUser: jest.fn().mockReturnValue({ id: 11, type: 'user' }),
      getUserByEmail: jest.fn().mockReturnValue(null),
      createUser: jest.fn().mockReturnValue({ id: 99 }),
      createOng: jest.fn()
    };

    const app = buildApp(createAuthRouter(data));

    const loginResponse = await request(app)
      .post('/login')
      .type('form')
      .send({
        email: 'joao@email.com',
        password: '123456'
      });

    expect(data.authenticateUser).toHaveBeenCalledWith('joao@email.com', '123456');
    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.location).toBe('/dashboard');

    const signupResponse = await request(app)
      .post('/cadastro')
      .type('form')
      .send({
        name: 'Maria da Silva',
        email: 'maria@exemplo.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'admin',
        ongName: 'ONG Exemplo',
        ongDescription: 'Descricao longa o suficiente para validar.',
        ongContact: 'contato@ongexemplo.com',
        ongCnpj: '04.252.011/0001-10',
        ongRg: '12.345.678-9'
      });

    expect(data.getUserByEmail).toHaveBeenCalledWith('maria@exemplo.com');
    expect(data.createUser).toHaveBeenCalled();
    expect(data.createOng).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ONG Exemplo',
      cnpj: '04.252.011/0001-10',
      rg: '12.345.678-9',
      userId: 99
    }));
    expect(signupResponse.status).toBe(302);
    expect(signupResponse.headers.location).toContain('/auth/login?success=');
  });

  test('admin route uses injected authentication method', async () => {
    const data = {
      authenticateUser: jest.fn().mockReturnValue({
        id: 1,
        type: 'admin',
        ongName: 'ONG Teste'
      }),
      getDenuncias: jest.fn().mockReturnValue([]),
      getOngs: jest.fn().mockReturnValue([])
    };

    const app = buildApp(createAdminRouter(data));

    const response = await request(app)
      .post('/dashboard')
      .type('form')
      .send({
        email: 'admin@teste.com',
        password: '123456'
      });

    expect(data.authenticateUser).toHaveBeenCalledWith('admin@teste.com', '123456');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/dashboard_admin');
  });

  test('admin route accepts ONG users in login', async () => {
    const data = {
      authenticateUser: jest.fn().mockReturnValue({
        id: 21,
        type: 'ong',
        ongName: 'ONG Teste'
      }),
      getDenuncias: jest.fn().mockReturnValue([]),
      getOngs: jest.fn().mockReturnValue([]),
      getOngByUserId: jest.fn()
    };

    const app = buildApp(createAdminRouter(data));

    const response = await request(app)
      .post('/dashboard')
      .type('form')
      .send({
        email: 'ong@teste.com',
        password: '123456'
      });

    expect(data.authenticateUser).toHaveBeenCalledWith('ong@teste.com', '123456');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/dashboard_admin');
  });

  test('admin route allows ONG users and filters dashboard data by ONG id', async () => {
    const data = {
      authenticateUser: jest.fn().mockReturnValue({
        id: 21,
        type: 'ong',
        ongName: 'ONG Teste'
      }),
      getOngByUserId: jest.fn().mockReturnValue({
        id: 31,
        userId: 21,
        name: 'ONG Teste',
        description: 'Descricao de teste.'
      }),
      getDenuncias: jest.fn().mockReturnValue([
        {
          id: 1,
          status: 'pendente',
          responses: [{ ongId: 31 }]
        },
        {
          id: 2,
          status: 'resolvida',
          responses: [{ ongId: 31 }]
        }
      ]),
      getOngs: jest.fn().mockReturnValue([
        {
          id: 31,
          userId: 21,
          name: 'ONG Teste',
          description: 'Descricao de teste.'
        }
      ])
    };

    const app = buildApp(
      createAdminRouter(data),
      { id: 21, type: 'ong', ongName: 'ONG Teste' }
    );

    const response = await request(app).get('/dashboard_admin');

    expect(data.getOngByUserId).toHaveBeenCalledWith(21);
    expect(data.getDenuncias).toHaveBeenCalledWith(31);
    expect(data.getOngs).toHaveBeenCalledWith(31);
    expect(response.status).toBe(200);
    expect(response.body.view).toBe('admin/dashboard');
    expect(response.body.locals.totalDenuncias).toBe(2);
    expect(response.body.locals.totalOngs).toBe(1);
  });

  test('denuncias route uses injected method when creating a report', async () => {
    const data = {
      getDenuncias: jest.fn().mockReturnValue([]),
      createDenuncia: jest.fn(),
      getDenunciaById: jest.fn(),
      updateDenuncia: jest.fn()
    };

    const app = buildApp(
      createDenunciasRouter(data),
      { id: 11, name: 'Joao Silva', type: 'user' }
    );

    const response = await request(app)
      .post('/nova')
      .type('form')
      .send({
        title: 'Nova denuncia de teste',
        description: 'Descricao longa o suficiente para passar na validacao.',
        location: 'Centro - SP',
        category: 'agua'
      });

    expect(data.createDenuncia).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Nova denuncia de teste',
      userId: 11,
      userName: 'Joao Silva'
    }));
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/denuncias/nova?success=');
  });

  test('index route uses injected news and contact persistence', async () => {
    const data = {
      getDenuncias: jest.fn().mockReturnValue([
        { id: 1, userId: 11 },
        { id: 2, userId: 11 }
      ]),
      getOngs: jest.fn().mockReturnValue([
        { id: 1, userId: 1, name: 'ONG Teste', description: 'Descricao de teste.' }
      ]),
      getNoticias: jest.fn().mockReturnValue([
        {
          id: 1,
          title: 'Noticia de teste',
          date: '01 de Janeiro de 2025',
          description: 'Conteudo ficticio para a home.',
          image: '/images/agua-potavel.webp',
          url: '/noticias'
        }
      ]),
      createMensagemContato: jest.fn(),
      createDoacao: jest.fn(),
      createAssinaturaPlano: jest.fn(),
      getPlanos: jest.fn().mockReturnValue([]),
      getOngById: jest.fn().mockReturnValue({
        id: 1,
        userId: 1,
        name: 'ONG Teste',
        description: 'Descricao de teste.'
      })
    };

    const app = buildApp(createIndexRouter(data));

    const homeResponse = await request(app).get('/');
    expect(data.getNoticias).toHaveBeenCalled();
    expect(homeResponse.status).toBe(200);
    expect(homeResponse.body.view).toBe('index');
    expect(homeResponse.body.locals.noticias[0].title).toBe('Noticia de teste');

    const contactResponse = await request(app)
      .post('/contato')
      .type('form')
      .send({
        name: 'Maria Silva',
        email: 'maria@exemplo.com',
        subject: 'duvida',
        message: 'Mensagem de teste com mais de dez caracteres',
        newsletter: '1'
      });

    expect(data.createMensagemContato).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Maria Silva',
      newsletter: true
    }));
    expect(contactResponse.status).toBe(302);
    expect(contactResponse.headers.location).toContain('/contato?success=');
  });

  test('ongs route uses injected dependency in the admin dashboard', async () => {
    const data = {
      getOngs: jest.fn().mockReturnValue([
        {
          id: 1,
          userId: 1,
          name: 'ONG Teste',
          description: 'Descricao de teste.',
          focus: 'Acesso a agua limpa'
        }
      ]),
      getDenuncias: jest.fn().mockReturnValue([
        {
          id: 1,
          status: 'pendente',
          responses: [{ ongId: 1 }]
        }
      ])
    };

    const app = buildApp(
      createOngsRouter(data),
      { id: 1, name: 'Admin Teste', type: 'admin' }
    );

    const response = await request(app).get('/admin/dashboard');

    expect(data.getOngs).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body.view).toBe('ongs/admin');
    expect(response.body.locals.ong.name).toBe('ONG Teste');
  });

  test('ongs route filters dashboard and stats by ONG id, not user id', async () => {
    const data = {
      getOngs: jest.fn().mockReturnValue([
        {
          id: 31,
          userId: 21,
          name: 'ONG Teste',
          description: 'Descricao de teste.'
        }
      ]),
      getDenuncias: jest.fn().mockReturnValue([
        {
          id: 1,
          status: 'pendente',
          responses: [{ ongId: 31 }]
        },
        {
          id: 2,
          status: 'resolvida',
          responses: [{ ongId: 31 }]
        },
        {
          id: 3,
          status: 'em_andamento',
          responses: [{ ongId: 99 }]
        }
      ])
    };

    const app = buildApp(
      createOngsRouter(data),
      { id: 21, name: 'Admin Teste', type: 'ong', ongName: 'ONG Teste' }
    );

    const dashboardResponse = await request(app).get('/admin/dashboard');
    const statsResponse = await request(app).get('/admin/stats');

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.view).toBe('ongs/admin');
    expect(dashboardResponse.body.locals.respondedDenuncias).toHaveLength(2);
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.view).toBe('ongs/stats');
    expect(statsResponse.body.locals.stats.totalResponses).toBe(2);
    expect(statsResponse.body.locals.stats.resolvedByOng).toBe(1);
  });
});
