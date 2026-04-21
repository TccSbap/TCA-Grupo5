const bcrypt = require('bcryptjs');
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const originalNodeEnv = process.env.NODE_ENV;
const originalWorkerId = process.env.JEST_WORKER_ID;

const restoreEnv = () => {
  if (typeof originalNodeEnv === 'undefined') {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (typeof originalWorkerId === 'undefined') {
    delete process.env.JEST_WORKER_ID;
  } else {
    process.env.JEST_WORKER_ID = originalWorkerId;
  }
};

const loadDatabase = ({ isConfigured = true, canUseDatabaseValue = true, executeImpl } = {}) => {
  jest.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = '1';

  const pool = {
    execute: jest.fn(executeImpl || (() => Promise.resolve([[], []]))),
    getConnection: jest.fn()
  };

  const connection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue([[], []]),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
  };

  pool.getConnection.mockResolvedValue(connection);

  const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);

  jest.doMock('../../../config/database', () => ({
    pool,
    isConfigured,
    canUseDatabase
  }));

  let database;
  jest.isolateModules(() => {
    database = require('../../../data/database');
  });

  return { database, pool, connection, canUseDatabase };
};

describe('bootstrap e normalizacao da camada de dados', () => {
  afterEach(() => {
    restoreEnv();
    jest.restoreAllMocks();
    jest.resetModules();
    jest.dontMock('../../../config/database');
  });

  test('carrega e normaliza dados do banco quando a conexao esta disponivel', async () => {
    const userPasswordHash = bcrypt.hashSync('123456', 10);
    const donationRows = [
      {
        id: 51,
        ong_id: 31,
        user_id: 21,
        donor_name: 'Doador do Banco',
        donor_email: 'doador@exemplo.com',
        donor_phone: '(11) 98888-2222',
        donor_document: '123.456.789-00',
        donor_cep: '01001-000',
        donor_street: 'Rua A',
        donor_number: '100',
        donor_neighborhood: 'Centro',
        donor_city: 'Sao Paulo',
        donor_state: 'SP',
        amount: '150.50',
        message: 'Mensagem da doacao',
        payment_method: 'pix',
        status: 'confirmada',
        created_at: '2024-01-06 07:08:09'
      }
    ];

    const subscriptionRows = [
      {
        id: 61,
        plan_id: 41,
        user_id: 21,
        plan_name: 'Plano Banco',
        plan_price: '49.90',
        subscriber_name: 'Assinante do Banco',
        subscriber_email: 'assinante@exemplo.com',
        subscriber_phone: '(11) 97777-3333',
        subscriber_document: '987.654.321-00',
        subscriber_cep: '01310-000',
        subscriber_street: 'Rua B',
        subscriber_number: '200',
        subscriber_neighborhood: 'Bela Vista',
        subscriber_city: 'Sao Paulo',
        subscriber_state: 'SP',
        payment_method: 'cartao',
        status: 'ativa',
        created_at: '2024-01-07 08:09:10'
      }
    ];

    const contactRows = [
      {
        id: 71,
        user_id: 21,
        name: 'Contato Banco',
        email: 'contato@exemplo.com',
        subject: 'Assunto',
        message: 'Mensagem de contato',
        newsletter: 1,
        status: 'nova',
        created_at: '2024-01-08 09:10:11'
      }
    ];

    const executeImpl = jest.fn((query) => {
      if (query.includes('FROM users')) {
        return Promise.resolve([
          [
            {
              id: 21,
              name: 'Usuario do Banco',
              email: 'banco@exemplo.com',
              password_hash: userPasswordHash,
              type: 'user',
              ong_name: null,
              created_at: '2024-01-02 03:04:05'
            }
          ],
          []
        ]);
      }

      if (query.includes('FROM ongs')) {
        return Promise.resolve([
          [
            {
              id: 31,
              name: 'ONG do Banco',
              description: 'Descricao vinda do banco',
              contact_email: 'contato@ongbanco.org',
              phone: '(11) 99999-1111',
              address: 'Sao Paulo, SP',
              user_id: 21,
              created_at: '2024-01-03 04:05:06'
            }
          ],
          []
        ]);
      }

      if (query.includes('FROM plans')) {
        return Promise.resolve([
          [
            {
              id: 41,
              title: 'Plano Banco',
              price: 49.9,
              subtitle: 'Plano para testes',
              features_json: JSON.stringify(['Beneficio 1', 'Beneficio 2']),
              created_at: '2024-01-04 05:06:07'
            }
          ],
          []
        ]);
      }

      if (query.includes('FROM news')) {
        return Promise.resolve([
          [
            {
              id: 11,
              title: 'Noticia do Banco',
              date_label: '01/01/2024',
              description: 'Descricao da noticia',
              image: '/images/noticia.jpg',
              url: '/noticias/11',
              icon_class: null,
              sort_order: 4,
              created_at: '2024-01-05 06:07:08'
            }
          ],
          []
        ]);
      }

      if (query.includes('FROM donations')) {
        return Promise.resolve([donationRows, []]);
      }

      if (query.includes('FROM plan_subscriptions')) {
        return Promise.resolve([subscriptionRows, []]);
      }

      if (query.includes('FROM contact_messages')) {
        return Promise.resolve([contactRows, []]);
      }

      if (query.includes('FROM denuncias') && !query.includes('denuncia_responses')) {
        return Promise.resolve([
          [
            {
              id: 41,
              title: 'Denuncia do Banco',
              description: 'Descricao longa o suficiente para teste.',
              location: 'Centro - SP',
              category: 'agua',
              status: 'em_andamento',
              user_id: 21,
              user_name: 'Usuario do Banco',
              created_at: '2024-01-04 05:06:07'
            }
          ],
          []
        ]);
      }

      if (query.includes('FROM denuncia_responses')) {
        return Promise.resolve([
          [
            {
              id: 1,
              denuncia_id: 41,
              ong_id: 31,
              ong_name: 'ONG do Banco',
              response_text: 'Resposta carregada',
              created_at: '2024-01-05 06:07:08'
            },
            {
              id: 2,
              denuncia_id: 999,
              ong_id: 31,
              ong_name: 'ONG do Banco',
              response_text: 'Resposta orfa',
              created_at: '2024-01-05 06:07:09'
            }
          ],
          []
        ]);
      }

      return Promise.resolve([[], []]);
    });

    const { database, pool } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: true,
      executeImpl
    });

    await database.__private__.loadFromDatabase();

    expect(pool.execute).toHaveBeenCalledTimes(9);
    expect(database.getUsers()).toEqual([
      expect.objectContaining({
        id: 21,
        name: 'Usuario do Banco',
        email: 'banco@exemplo.com',
        password: userPasswordHash,
        type: 'user',
        ongName: null
      })
    ]);
    expect(database.getOngs()).toEqual([
      expect.objectContaining({
        id: 31,
        name: 'ONG do Banco',
        contact: 'contato@ongbanco.org',
        userId: 21
      })
    ]);
    expect(database.getPlanos()).toEqual([
      expect.objectContaining({
        id: 41,
        title: 'Plano Banco',
        features: ['Beneficio 1', 'Beneficio 2']
      })
    ]);
    expect(database.getNoticias()).toEqual([
      expect.objectContaining({
        id: 11,
        title: 'Noticia do Banco',
        iconClass: 'fas fa-newspaper'
      })
    ]);
    expect(database.getDoacoes()).toEqual([
      expect.objectContaining({
        id: 51,
        ongId: 31,
        userId: 21,
        amount: 150.5,
        status: 'confirmada'
      })
    ]);
    expect(database.getAssinaturasPlano()).toEqual([
      expect.objectContaining({
        id: 61,
        planId: 41,
        userId: 21,
        planName: 'Plano Banco',
        status: 'ativa'
      })
    ]);
    expect(database.getMensagensContato()).toEqual([
      expect.objectContaining({
        id: 71,
        newsletter: true,
        status: 'nova'
      })
    ]);
    expect(database.getDenuncias()).toEqual([
      expect.objectContaining({
        id: 41,
        title: 'Denuncia do Banco',
        status: 'em_andamento',
        responses: [
          expect.objectContaining({
            id: 1,
            text: 'Resposta carregada',
            ongId: 31,
            ongName: 'ONG do Banco'
          })
        ]
      })
    ]);
    expect(database.authenticateUser('banco@exemplo.com', '123456')).toEqual(
      expect.objectContaining({
        id: 21,
        name: 'Usuario do Banco',
        email: 'banco@exemplo.com',
        type: 'user',
        ongName: null
      })
    );
    expect(database.authenticateUser('banco@exemplo.com', 'senha-errada')).toBeNull();
    expect(database.getUserById(21)).toEqual(expect.objectContaining({ id: 21 }));
    expect(database.getOngById(31)).toEqual(expect.objectContaining({ id: 31 }));
    expect(database.getOngByUserId(21)).toEqual(expect.objectContaining({ id: 31 }));
  });

  test('mantem os dados em memoria quando o banco nao esta disponivel', async () => {
    const { database, pool } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: false
    });

    database.__private__.ensureDataLoaded.ready = undefined;
    const loaded = await database.ensureDataLoaded();

    expect(loaded).toBe(false);
    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(database.getDenuncias()).toHaveLength(16);

    database.createUser({
      name: 'Usuario Local',
      email: 'local@exemplo.com',
      password: 'hash',
      type: 'user'
    });

    expect(pool.execute).not.toHaveBeenCalled();
    expect(database.getUserByEmail('local@exemplo.com')).toBeDefined();
  });

  test('expõe e valida os helpers internos de normalizacao', () => {
    const { database } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: false
    });

    expect(database.__private__.toSqlDateTime('2024-02-01T10:11:12Z')).toBe('2024-02-01 10:11:12.000');
    expect(database.__private__.toIsoString('2024-02-01T10:11:12Z')).toBe('2024-02-01T10:11:12.000Z');
    expect(database.__private__.parseJsonArray('["a", "b"]')).toEqual(['a', 'b']);
    expect(database.__private__.parseJsonArray(null, ['fallback'])).toEqual(['fallback']);
    expect(
      database.__private__.normalizeUserRow({
        id: 1,
        name: 'User',
        email: 'user@example.com',
        password_hash: 'hash',
        type: 'user',
        ong_name: 'ONG',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 1,
      name: 'User',
      email: 'user@example.com',
      password: 'hash',
      ongName: 'ONG'
    });
    expect(
      database.__private__.normalizeOngRow({
        id: 2,
        name: 'ONG',
        description: 'Descricao',
        contact_email: 'contato@ong.com',
        phone: '(11) 99999-1111',
        address: 'Sao Paulo',
        user_id: 1,
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 2,
      name: 'ONG',
      contact: 'contato@ong.com',
      userId: 1
    });
    expect(
      database.__private__.normalizeDenunciaRow({
        id: 3,
        title: 'Denuncia',
        description: 'Descricao',
        location: 'Centro',
        category: 'agua',
        status: 'pendente',
        user_id: 1,
        user_name: 'User',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 3,
      title: 'Denuncia',
      status: 'pendente',
      responses: []
    });
    expect(
      database.__private__.normalizePlanoRow({
        id: 4,
        title: 'Plano',
        price: 29.9,
        subtitle: 'Subtitulo',
        features_json: '["Suporte"]',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 4,
      title: 'Plano',
      features: ['Suporte']
    });
    expect(
      database.__private__.normalizeNoticiaRow({
        id: 5,
        title: 'Noticia',
        date_label: '01/01/2024',
        description: 'Descricao',
        image: '/img.png',
        url: '/noticias/5',
        icon_class: null,
        sort_order: null,
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 5,
      title: 'Noticia',
      iconClass: 'fas fa-newspaper',
      sortOrder: 0
    });
    expect(
      database.__private__.normalizeDoacaoRow({
        id: 6,
        ong_id: 2,
        user_id: 1,
        donor_name: 'Doador',
        donor_email: 'doador@example.com',
        donor_phone: '(11) 99999-0000',
        donor_document: '123',
        donor_cep: '01000-000',
        donor_street: 'Rua A',
        donor_number: '10',
        donor_neighborhood: 'Centro',
        donor_city: 'Sao Paulo',
        donor_state: 'SP',
        amount: '120.75',
        message: 'Mensagem',
        payment_method: 'pix',
        status: 'confirmada',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 6,
      ongId: 2,
      userId: 1,
      amount: 120.75
    });
    expect(
      database.__private__.normalizeAssinaturaPlanoRow({
        id: 7,
        plan_id: 4,
        user_id: 1,
        plan_name: 'Plano',
        plan_price: '29.90',
        subscriber_name: 'Assinante',
        subscriber_email: 'assinante@example.com',
        subscriber_phone: '(11) 98888-0000',
        subscriber_document: '321',
        subscriber_cep: '02000-000',
        subscriber_street: 'Rua B',
        subscriber_number: '20',
        subscriber_neighborhood: 'Bairro',
        subscriber_city: 'Sao Paulo',
        subscriber_state: 'SP',
        payment_method: 'cartao',
        status: 'ativa',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 7,
      planId: 4,
      userId: 1,
      planName: 'Plano',
      status: 'ativa'
    });
    expect(
      database.__private__.normalizeMensagemContatoRow({
        id: 8,
        user_id: 1,
        name: 'Contato',
        email: 'contato@example.com',
        subject: 'Assunto',
        message: 'Mensagem',
        newsletter: 1,
        status: 'nova',
        created_at: '2024-01-01 00:00:00'
      })
    ).toMatchObject({
      id: 8,
      userId: 1,
      newsletter: true,
      status: 'nova'
    });
  });

  test('persiste usuarios, ongs e formularios quando o banco esta disponivel', async () => {
    const { database, pool, connection } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: true
    });

    database.getUsers().splice(0, database.getUsers().length, {
      id: 201,
      name: 'Usuario Persistido',
      email: 'persistido@example.com',
      password: 'hash',
      type: 'user',
      ongName: null,
      createdAt: '2024-02-02T10:00:00.000Z'
    });
    database.getOngs().splice(0, database.getOngs().length, {
      id: 301,
      name: 'ONG Persistida',
      description: 'Descricao',
      contact: 'contato@ong.com',
      phone: '(11) 99999-0000',
      address: 'Rua A',
      userId: 201,
      focus: 'Descricao',
      createdAt: '2024-02-02T10:10:00.000Z'
    });
    database.getPlanos().splice(0, database.getPlanos().length, {
      id: 401,
      title: 'Plano Persistido',
      price: 29.9,
      subtitle: 'Subtitulo',
      features: ['Suporte'],
      createdAt: '2024-02-02T10:20:00.000Z'
    });
    database.getNoticias().splice(0, database.getNoticias().length, {
      id: 501,
      title: 'Noticia Persistida',
      date: '02/02/2024',
      description: 'Descricao',
      image: '/img.png',
      url: '/noticias/501',
      iconClass: 'fas fa-newspaper',
      sortOrder: 1,
      createdAt: '2024-02-02T10:30:00.000Z'
    });
    database.getDoacoes().splice(0, database.getDoacoes().length, {
      id: 601,
      ongId: 301,
      userId: 201,
      donorName: 'Doador',
      donorEmail: 'doador@example.com',
      donorPhone: '(11) 98888-0000',
      donorDocument: '123',
      donorCep: '01000-000',
      donorStreet: 'Rua B',
      donorNumber: '10',
      donorNeighborhood: 'Centro',
      donorCity: 'Sao Paulo',
      donorState: 'SP',
      amount: 100,
      message: 'Doacao',
      paymentMethod: 'pix',
      status: 'confirmada',
      createdAt: '2024-02-02T10:40:00.000Z'
    });
    database.getAssinaturasPlano().splice(0, database.getAssinaturasPlano().length, {
      id: 701,
      planId: 401,
      userId: 201,
      planName: 'Plano Persistido',
      planPrice: 29.9,
      subscriberName: 'Assinante',
      subscriberEmail: 'assinante@example.com',
      subscriberPhone: '(11) 97777-0000',
      subscriberDocument: '321',
      subscriberCep: '02000-000',
      subscriberStreet: 'Rua C',
      subscriberNumber: '20',
      subscriberNeighborhood: 'Bairro',
      subscriberCity: 'Sao Paulo',
      subscriberState: 'SP',
      paymentMethod: 'cartao',
      status: 'ativa',
      createdAt: '2024-02-02T10:50:00.000Z'
    });
    database.getMensagensContato().splice(0, database.getMensagensContato().length, {
      id: 801,
      userId: 201,
      name: 'Contato',
      email: 'contato@example.com',
      subject: 'Assunto',
      message: 'Mensagem',
      newsletter: true,
      status: 'nova',
      createdAt: '2024-02-02T11:00:00.000Z'
    });
    database.getDenuncias().splice(0, database.getDenuncias().length, {
      id: 901,
      title: 'Denuncia persistida',
      description: 'Descricao longa o suficiente para teste.',
      location: 'Centro - SP',
      category: 'agua',
      status: 'em_andamento',
      userId: 201,
      userName: 'Usuario Persistido',
      responses: [
        {
          id: 1,
          text: 'Resposta persistida',
          ongId: 301,
          ongName: 'ONG Persistida',
          createdAt: '2024-02-02T11:10:00.000Z'
        }
      ],
      createdAt: '2024-02-02T11:05:00.000Z'
    });

    database.getUsers().splice(0, database.getUsers().length);
    database.getOngs().splice(0, database.getOngs().length);
    database.getPlanos().splice(0, database.getPlanos().length);
    database.getNoticias().splice(0, database.getNoticias().length);
    database.getDoacoes().splice(0, database.getDoacoes().length);
    database.getAssinaturasPlano().splice(0, database.getAssinaturasPlano().length);
    database.getMensagensContato().splice(0, database.getMensagensContato().length);
    database.getDenuncias().splice(0, database.getDenuncias().length);

    database.createUser({
      name: 'Usuario Novo',
      email: 'novo@example.com',
      password: 'hash',
      type: 'user',
      ongName: null
    });
    database.createOng({
      name: 'ONG Nova',
      description: 'Descricao nova',
      contact: 'nova@ong.com',
      phone: '(11) 96666-0000',
      address: 'Rua D',
      userId: 1
    });
    database.createDoacao({
      ongId: 1,
      userId: 1,
      donorName: 'Doador Novo',
      donorEmail: 'doador.novo@example.com',
      donorPhone: '(11) 95555-0000',
      donorDocument: '456',
      donorCep: '03000-000',
      donorStreet: 'Rua E',
      donorNumber: '30',
      donorNeighborhood: 'Bairro Novo',
      donorCity: 'Sao Paulo',
      donorState: 'SP',
      amount: 250,
      message: 'Nova doacao',
      paymentMethod: 'pix'
    });
    database.createAssinaturaPlano({
      planId: 1,
      userId: 1,
      planName: 'Plano Novo',
      planPrice: 29.9,
      subscriberName: 'Assinante Novo',
      subscriberEmail: 'assinante.novo@example.com',
      subscriberPhone: '(11) 94444-0000',
      subscriberDocument: '654',
      subscriberCep: '04000-000',
      subscriberStreet: 'Rua F',
      subscriberNumber: '40',
      subscriberNeighborhood: 'Bairro Novo',
      subscriberCity: 'Sao Paulo',
      subscriberState: 'SP',
      paymentMethod: 'cartao'
    });
    database.createMensagemContato({
      userId: 1,
      name: 'Contato Novo',
      email: 'contato.novo@example.com',
      subject: 'Assunto novo',
      message: 'Mensagem nova',
      newsletter: true
    });
    await database.createDenuncia({
      title: 'Denuncia nova',
      description: 'Descricao nova o suficiente para teste.',
      location: 'Bairro Novo - SP',
      category: 'agua',
      userId: 1,
      userName: 'Usuario Novo',
      responses: [
        {
          id: 1,
          text: 'Resposta nova',
          ongId: 1,
          ongName: 'ONG Nova'
        }
      ]
    });

    await database.__private__.persistDenunciaWithResponses({
      id: 2,
      title: 'Denuncia direta',
      description: 'Descricao direta o suficiente para teste.',
      location: 'Bairro Direto - SP',
      category: 'agua',
      status: 'pendente',
      userId: 1,
      userName: 'Usuario Novo',
      responses: [
        {
          id: 1,
          text: 'Resposta nova',
          ongId: 1,
          ongName: 'ONG Nova',
          createdAt: '2024-02-02T11:10:00.000Z'
        }
      ],
      createdAt: '2024-02-02T11:05:00.000Z'
    });

    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      expect.arrayContaining([1, 'Usuario Novo'])
    );
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ongs'),
      expect.arrayContaining([1, 'ONG Nova'])
    );
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO donations'),
      expect.arrayContaining([1, 1, 1])
    );
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO plan_subscriptions'),
      expect.arrayContaining([1, 1, 1])
    );
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO contact_messages'),
      expect.arrayContaining([1, 1, 'Contato Novo'])
    );
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO denuncias'),
      expect.arrayContaining([1, 'Denuncia nova'])
    );
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO denuncia_responses'),
      expect.arrayContaining([1, 2, 1, 'ONG Nova', 'Resposta nova'])
    );
  });

  test('retorna dados em cache quando o resultado do carregamento ja esta pronto', async () => {
    const { database } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: true
    });

    database.__private__.ensureDataLoaded.ready = Promise.resolve('em cache');

    await expect(database.ensureDataLoaded()).resolves.toBe('em cache');
  });

  test('volta para os dados padrao quando o carregamento do banco falha', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { database } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: true,
      executeImpl: () => Promise.reject(new Error('falha ao carregar'))
    });

    database.__private__.ensureDataLoaded.ready = undefined;

    await expect(database.ensureDataLoaded()).resolves.toBe(false);
    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('registra erro quando a sincronizacao do banco falha', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { database, connection } = loadDatabase({
      isConfigured: true,
      canUseDatabaseValue: true
    });

    connection.execute.mockImplementationOnce(() => {
      throw new Error('falha na sincronizacao');
    });

    database.getUsers().splice(0, database.getUsers().length, {
      id: 1,
      name: 'Usuario',
      email: 'usuario@example.com',
      password: 'hash',
      type: 'user',
      ongName: null,
      createdAt: '2024-02-02T12:00:00.000Z'
    });

    database.__private__.syncDatabaseFromCache();

    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(connection.rollback).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
