const createCadastro = require('../../../app/models/cadastro.model');

const user = { name: 'Admin ONG', email: 'ong@example.org', password: 'hash', type: 'ong', ongName: 'ONG Teste' };
const ong = { name: 'ONG Teste', description: 'Apoio comunitário', contact: 'ong@example.org' };

const build = () => {
    const connection = {
        execute: jest.fn().mockResolvedValue([{ insertId: 42 }]),
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
    };
    const pool = { getConnection: jest.fn().mockResolvedValue(connection) };
    return { connection, model: createCadastro({ pool, canUseDatabase: async () => true }) };
};

test('conta e organizacao sao gravadas na mesma transacao', async () => {
    const { connection, model } = build();
    await expect(model.createUserWithOng(user, ong)).resolves.toMatchObject({ id: 42 });
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.execute.mock.calls[1][1]).toContain(42);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
});

test('falha na ONG reverte tambem a criacao da conta', async () => {
    const { connection, model } = build();
    connection.execute.mockResolvedValueOnce([{ insertId: 42 }]).mockRejectedValueOnce(new Error('duplicate organization'));
    await expect(model.createUserWithOng(user, ong)).rejects.toThrow('duplicate organization');
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
});
