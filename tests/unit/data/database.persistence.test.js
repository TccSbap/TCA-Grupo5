const loadDatabase = ({
    canUseDatabaseValue = true,
    executeImpl,
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
        execute: jest.fn(executeImpl || (() => Promise.resolve([[], []]))),
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

    return { database, pool, connection };
};

describe('camada de dados com persistência via SQL', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
        jest.dontMock('../../../config/database');
    });

    test('createUser e createOng fazem INSERT direto no pool', async () => {
        const { database, pool } = loadDatabase();

        await database.createUser({
            name: 'Maria Oliveira',
            email: 'maria@exemplo.com',
            password: 'hash',
            type: 'user'
        });

        await database.createOng({
            name: 'Nova ONG',
            description: 'Descricao da ONG',
            contact: 'contato@novaong.org',
            phone: '(11) 99999-0000',
            address: 'Sao Paulo, SP',
            userId: 99
        });

        expect(pool.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO users'))).toBe(true);
        expect(pool.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO ongs'))).toBe(true);
    });

    test('getDenuncias carrega denuncias e respostas do banco', async () => {
        const executeImpl = jest.fn((query) => {
            if (query.includes('FROM denuncias')) {
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
                        }
                    ],
                    []
                ]);
            }

            return Promise.resolve([[], []]);
        });

        const { database } = loadDatabase({ executeImpl });
        const denuncias = await database.getDenuncias();

        expect(denuncias).toEqual([
            expect.objectContaining({
                id: 41,
                title: 'Denuncia do Banco',
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
    });

    test('createDenuncia usa transação e grava respostas quando existem', async () => {
        const { database, connection } = loadDatabase();

        await database.createDenuncia({
            title: 'Nova denuncia persistida',
            description: 'Descricao longa o suficiente para persistir.',
            location: 'Centro - SP',
            category: 'agua',
            responses: [
                {
                    ongId: 31,
                    ongName: 'ONG do Banco',
                    text: 'Resposta registrada.'
                }
            ]
        });

        expect(connection.beginTransaction).toHaveBeenCalled();
        expect(connection.commit).toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalled();
        expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncias'))).toBe(true);
        expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncia_responses'))).toBe(true);
    });
});
