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
    test('loads denunciations and preserves historical response records without ONG filtering', async () => {
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
        await expect(model.getDenunciaById('1')).resolves.toMatchObject({ id: 1, title: 'Leak' });
    });

    test('creates a denuncia without accepting responses', async () => {
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
        expect(connection.execute.mock.calls.some((call) => String(call[0]).includes('INSERT INTO denuncia_responses'))).toBe(false);
    });

    test('updates denúncia fields with approximate coordinates and deletes by id', async () => {
        const { model, pool } = buildModel();
        pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }, []])
            .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

        await expect(model.updateDenuncia(4, {
            title: 'Updated report',
            description: 'Updated description',
            location: 'Updated location',
            latitude: -23.55,
            longitude: -46.631,
            category: 'agua',
            status: 'resolvida',
            userId: 11,
            userName: 'Reporter',
            createdAt: '2024-01-02T03:04:05.000Z'
        })).resolves.toBe(true);
        await expect(model.deleteDenuncia(4)).resolves.toBe(true);

        expect(pool.execute.mock.calls[0][0]).toContain('UPDATE denuncias');
        expect(pool.execute.mock.calls[0][1][4]).not.toBe(-46.631);
        expect(pool.execute.mock.calls[1][0]).toContain('DELETE FROM denuncias');
    });


    test('rejects when the database is unavailable', async () => {
        const { model } = buildModel(false);

        await expect(model.getDenuncias()).rejects.toThrow(/Banco de dados indispon/i);
    });
});
