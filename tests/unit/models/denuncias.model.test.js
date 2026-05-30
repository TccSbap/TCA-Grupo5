const createDenunciasModel = require('../../../app/models/denuncias.model');

const buildModel = (canUseDatabaseValue = true) => {
    const pool = {
        execute: jest.fn(),
        getConnection: jest.fn()
    };
    const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);
    const model = createDenunciasModel({ pool, canUseDatabase });

    return { model, pool, canUseDatabase };
};

describe('models/denuncias.model', () => {
    test('loads denuncias with responses and supports filtered results', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel();

        pool.execute.mockImplementation((query) => {
            if (query.includes('FROM denuncias')) {
                return Promise.resolve([[
                    {
                        id: 1,
                        title: 'Leak',
                        description: 'Long description',
                        location: 'Center',
                        category: 'water',
                        status: 'em_andamento',
                        user_id: 11,
                        user_name: 'Reporter',
                        created_at: iso
                    }
                ], []]);
            }

            if (query.includes('FROM denuncia_responses')) {
                return Promise.resolve([[
                    {
                        id: 9,
                        denuncia_id: 1,
                        ong_id: 2,
                        ong_name: 'Org One',
                        response_text: 'Response',
                        created_at: iso
                    }
                ], []]);
            }

            return Promise.resolve([[], []]);
        });

        await expect(model.getDenuncias()).resolves.toEqual([expect.objectContaining({
            id: 1,
            responses: [expect.objectContaining({ id: 9, ongId: 2, text: 'Response' })]
        })]);
        await expect(model.getDenuncias(2)).resolves.toHaveLength(1);
        await expect(model.getDenuncias(99)).resolves.toEqual([]);
        await expect(model.getDenunciaById('1')).resolves.toMatchObject({ id: 1, title: 'Leak' });
    });

    test('creates a denuncia and persists nested responses', async () => {
        const connection = {
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            execute: jest.fn()
                .mockResolvedValueOnce([{ insertId: 22 }, []])
                .mockResolvedValueOnce([[], []])
                .mockResolvedValueOnce([[], []]),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn()
        };
        const { model, pool } = buildModel();
        pool.getConnection.mockResolvedValue(connection);

        await expect(model.createDenuncia({
            title: 'New leak',
            description: 'Long description for the new leak',
            location: 'Center',
            category: 'water',
            responses: [
                {
                    ongId: 2,
                    ongName: 'Org One',
                    text: 'Initial response'
                }
            ]
        })).resolves.toMatchObject({
            id: 22,
            status: 'pendente'
        });

        expect(connection.beginTransaction).toHaveBeenCalled();
        expect(connection.commit).toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalled();
        expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncias'))).toBe(true);
        expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncia_responses'))).toBe(true);
    });

    test('updates an existing denuncia and preserves responses when omitted', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const connection = {
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            execute: jest.fn().mockResolvedValue([{ insertId: 1 }, []]),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn()
        };
        const { model, pool } = buildModel();
        pool.getConnection.mockResolvedValue(connection);
        pool.execute.mockImplementation((query) => {
            if (query.includes('FROM denuncias')) {
                return Promise.resolve([[
                    {
                        id: 1,
                        title: 'Leak',
                        description: 'Long description',
                        location: 'Center',
                        category: 'water',
                        status: 'pendente',
                        user_id: 11,
                        user_name: 'Reporter',
                        created_at: iso
                    }
                ], []]);
            }

            if (query.includes('FROM denuncia_responses')) {
                return Promise.resolve([[], []]);
            }

            return Promise.resolve([[], []]);
        });

        await expect(model.updateDenuncia(1, {
            status: 'resolvida'
        })).resolves.toMatchObject({
            id: 1,
            status: 'resolvida'
        });

        expect(connection.beginTransaction).toHaveBeenCalled();
        expect(connection.commit).toHaveBeenCalled();
        expect(connection.release).toHaveBeenCalled();
    });

    test('rejects when the database is unavailable', async () => {
        const { model } = buildModel(false);

        await expect(model.getDenuncias()).rejects.toThrow(/Banco de dados indispon/i);
    });
});
