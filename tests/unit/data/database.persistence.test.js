const waitForPromises = () => new Promise((resolve) => setImmediate(resolve));

const loadDatabaseWithMockedConnection = ({
  canUseDatabaseValue = true,
  poolExecuteImpl,
  connectionExecuteImpl
} = {}) => {
  const connection = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn(connectionExecuteImpl || (() => Promise.resolve([[], []]))),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn()
  };

  const pool = {
    execute: jest.fn(poolExecuteImpl || (() => Promise.resolve([[], []]))),
    getConnection: jest.fn().mockResolvedValue(connection)
  };

  const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);

  jest.doMock('../../../config/database', () => ({
    pool,
    isConfigured: true,
    canUseDatabase
  }));

  let database;
  jest.isolateModules(() => {
    database = require('../../../data/database');
  });

  return { database, pool, connection, canUseDatabase };
};

describe('caminhos de persistência da camada de dados', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../../../config/database');
  });

  test('createUser e createOng persistem via pool.execute quando o banco está disponível', async () => {
    const { database, pool } = loadDatabaseWithMockedConnection();

    database.createUser({
      name: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      password: 'hash',
      type: 'user'
    });

    database.createOng({
      name: 'Nova ONG',
      description: 'Descricao da ONG',
      contact: 'contato@novaong.org',
      phone: '(11) 99999-0000',
      address: 'Sao Paulo, SP',
      userId: 99
    });

    await waitForPromises();
    await waitForPromises();

    expect(pool.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO users'))).toBe(true);
    expect(pool.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO ongs'))).toBe(true);
  });

  test('saveUsers e saveOngs sincronizam o cache em memória com o banco', async () => {
    const { database, pool, connection } = loadDatabaseWithMockedConnection();

    database.saveUsers([
      {
        id: 99,
        name: 'User Persistido',
        email: 'persistido@exemplo.com',
        password: 'hash',
        type: 'user'
      }
    ]);

    database.saveOngs([
      {
        id: 50,
        name: 'ONG Persistida',
        description: 'Descricao da ONG',
        contact: 'contato@ong.com',
        phone: '(11) 11111-1111',
        address: 'Sao Paulo, SP',
        userId: 99
      }
    ]);

    await waitForPromises();
    await waitForPromises();

    expect(database.getUsers()).toHaveLength(1);
    expect(database.getOngs()).toHaveLength(1);
    expect(pool.getConnection).toHaveBeenCalled();
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('DELETE FROM users'))).toBe(true);
    expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('DELETE FROM ongs'))).toBe(true);
    expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('DELETE FROM denuncias'))).toBe(true);
  });

  test('saveDenuncias sincroniza respostas e usa timestamps padrão quando faltam datas', async () => {
    const { database, connection } = loadDatabaseWithMockedConnection();

    database.saveDenuncias([
      {
        id: 77,
        title: 'Denuncia persistida',
        description: 'Descricao longa o suficiente para ser persistida.',
        location: 'Centro - SP',
        category: 'agua',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
          {
            id: 1,
            ongId: 2,
            ongName: 'Saneamento para Todos',
            text: 'Resposta registrada.'
          }
        ]
      }
    ]);

    await waitForPromises();
    await waitForPromises();

    expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncias'))).toBe(true);
    expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncia_responses'))).toBe(true);
  });

  test('createDenuncia faz rollback quando a persistência falha', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let callCount = 0;
    const { database, connection } = loadDatabaseWithMockedConnection({
      connectionExecuteImpl: () => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.reject(new Error('forced failure'));
        }
        return Promise.resolve([[], []]);
      }
    });

    database.createDenuncia({
      title: 'Nova denuncia persistida',
      description: 'Descricao longa o suficiente para persistir.',
      location: 'Centro - SP',
      category: 'agua'
    });

    await waitForPromises();
    await waitForPromises();

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('resetData reconstrói o cache inicial e sincroniza novamente', async () => {
    const { database, pool, connection } = loadDatabaseWithMockedConnection();

    database.resetData();

    await waitForPromises();
    await waitForPromises();

    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(database.getDenuncias()).toHaveLength(16);
    expect(pool.getConnection).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
  });
});
