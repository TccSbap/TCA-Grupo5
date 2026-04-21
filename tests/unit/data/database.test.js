const database = require('../../../data/database');

describe('data/database', () => {
  test('starts with the expected seed data', () => {
    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(database.getDenuncias()).toHaveLength(16);
  });

  test('getUserByEmail returns the matching user', () => {
    const user = database.getUserByEmail('joao@email.com');

    expect(user).toMatchObject({
      id: 11,
      name: 'João Silva',
      email: 'joao@email.com',
      type: 'user'
    });
  });

  test('createUser creates the next incremental id', () => {
    const created = database.createUser({
      name: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      password: 'hash',
      type: 'user'
    });

    expect(created.id).toBe(12);
    expect(database.getUsers()).toHaveLength(12);
  });

  test('createDenuncia forces pendente status and empty responses', () => {
    const created = database.createDenuncia({
      title: 'Novo problema de saneamento',
      description: 'Descricao longa suficiente para passar no teste.',
      location: 'Centro - SP',
      category: 'agua',
      status: 'resolvida',
      responses: [{ text: 'x' }]
    });

    expect(created).toMatchObject({
      id: 17,
      status: 'pendente',
      responses: []
    });
  });

  test('getDenunciaById finds the record using a string id', () => {
    const denuncia = database.getDenunciaById('1');

    expect(denuncia).toMatchObject({
      id: 1,
      title: 'Esgoto a céu aberto na Rua das Flores'
    });
  });

  test('updateDenuncia merges fields and keeps the existing data', () => {
    const updated = database.updateDenuncia(1, {
      status: 'resolvida',
      title: 'Esgoto resolvido na Rua das Flores'
    });

    expect(updated).toMatchObject({
      id: 1,
      status: 'resolvida',
      title: 'Esgoto resolvido na Rua das Flores'
    });
    expect(updated.responses).toEqual([]);
  });

  test('createOng creates a new incremental id', () => {
    const created = database.createOng({
      name: 'Nova ONG',
      description: 'Descricao da ONG',
      contact: 'contato@novaong.org',
      phone: '(11) 99999-0000',
      address: 'Sao Paulo, SP',
      userId: 99
    });

    expect(created.id).toBe(11);
    expect(database.getOngs()).toHaveLength(11);
  });

  test('resetData restores the original seed state', () => {
    database.createUser({
      name: 'Temp User',
      email: 'temp@exemplo.com',
      password: 'hash',
      type: 'user'
    });

    expect(database.getUsers()).toHaveLength(12);

    database.resetData();

    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(database.getDenuncias()).toHaveLength(16);
  });
});
