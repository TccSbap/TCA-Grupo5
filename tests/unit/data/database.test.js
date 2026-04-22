const database = require('../../../data/mockDatabase');

describe('camada de dados em memória', () => {
  test('inicia com os dados padrão esperados', () => {
    expect(database.getUsers()).toHaveLength(11);
    expect(database.getOngs()).toHaveLength(10);
    expect(database.getDenuncias()).toHaveLength(16);
  });

  test('getDenuncias filtra as denuncias pela ONG informada', () => {
    const denuncias = database.getDenuncias(2);

    expect(denuncias).toHaveLength(1);
    expect(denuncias[0]).toMatchObject({
      id: 2,
      status: 'em_andamento'
    });
    expect(denuncias[0].responses[0]).toMatchObject({
      ongId: 2,
      ongName: 'Saneamento para Todos'
    });
  });

  test('getOngs filtra a ONG pelo id informado', () => {
    const ongs = database.getOngs(2);

    expect(ongs).toHaveLength(1);
    expect(ongs[0]).toMatchObject({
      id: 2,
      userId: 2,
      name: 'Saneamento para Todos'
    });
  });

  test('getUserByEmail retorna o usuário correspondente', () => {
    const user = database.getUserByEmail('joao@email.com');

    expect(user).toMatchObject({
      id: 11,
      name: 'João Silva',
      email: 'joao@email.com',
      type: 'user'
    });
  });

  test('createUser cria o próximo id incremental', () => {
    const created = database.createUser({
      name: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      password: 'hash',
      type: 'user'
    });

    expect(created.id).toBe(12);
    expect(database.getUsers()).toHaveLength(12);
  });

  test('createDenuncia força status pendente e respostas vazias', () => {
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

  test('getDenunciaById encontra o registro usando id em texto', () => {
    const denuncia = database.getDenunciaById('1');

    expect(denuncia).toMatchObject({
      id: 1,
      title: 'Esgoto a céu aberto na Rua das Flores'
    });
  });

  test('updateDenuncia mescla campos e mantém os dados existentes', () => {
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

  test('updateDenuncia retorna null quando o registro não existe', () => {
    const updated = database.updateDenuncia(99999, {
      status: 'resolvida'
    });

    expect(updated).toBeNull();
  });

  test('createOng cria um novo id incremental', () => {
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

  test('resetData restaura o estado original dos dados', () => {
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
