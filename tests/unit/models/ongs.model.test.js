const createOngsModel = require('../../../models/ongs.model');

const buildModel = (canUseDatabaseValue = true) => {
    const pool = {
        execute: jest.fn()
    };
    const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);
    const model = createOngsModel({ pool, canUseDatabase });

    return { model, pool, canUseDatabase };
};

describe('models/ongs.model', () => {
    test('lists and filters ongs and resolves lookups', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel();
        const rows = [
            {
                id: 1,
                name: 'Org One',
                description: 'Description One',
                contact_email: 'one@example.com',
                cnpj: '111',
                rg: '222',
                phone: '111',
                address: 'Address One',
                user_id: 10,
                focus: 'Focus One',
                created_at: iso
            },
            {
                id: 2,
                name: 'Org Two',
                description: 'Description Two',
                contact_email: 'two@example.com',
                cnpj: '333',
                rg: '444',
                phone: '222',
                address: 'Address Two',
                user_id: 20,
                focus: '',
                created_at: iso
            }
        ];

        pool.execute.mockImplementation((query, params) => {
            if (query.includes('WHERE id')) {
                return Promise.resolve([[rows[0]], []]);
            }

            if (query.includes('WHERE user_id')) {
                return Promise.resolve([[rows[1]], []]);
            }

            return Promise.resolve([rows, []]);
        });

        await expect(model.getOngs()).resolves.toHaveLength(2);
        await expect(model.getOngs(2)).resolves.toEqual([expect.objectContaining({ id: 2, focus: 'Description Two' })]);
        await expect(model.getOngById(1)).resolves.toMatchObject({ id: 1, name: 'Org One' });
        await expect(model.getOngByUserId(20)).resolves.toMatchObject({ id: 2, userId: 20 });
    });

    test('creates ongs using the extended schema', async () => {
        const { model, pool } = buildModel();
        pool.execute.mockResolvedValueOnce([{ insertId: 11 }, []]);

        await expect(model.createOng({
            name: 'New Org',
            description: 'New Description',
            contact: 'contact@example.com',
            cnpj: '123',
            rg: '456',
            phone: '11999999999',
            address: 'New Address',
            userId: 99
        })).resolves.toMatchObject({
            id: 11,
            name: 'New Org',
            cnpj: '123',
            rg: '456',
            focus: 'New Description'
        });
    });

    test('falls back to the legacy schema when cnpj and rg columns are unavailable', async () => {
        const executeImpl = jest.fn((query) => {
            if (String(query).includes('INSERT INTO ongs') && String(query).includes('cnpj')) {
                const error = new Error("Unknown column 'cnpj' in 'field list'");
                error.code = 'ER_BAD_FIELD_ERROR';
                error.errno = 1054;
                error.sqlMessage = "Unknown column 'cnpj' in 'field list'";
                return Promise.reject(error);
            }

            return Promise.resolve([{ insertId: 77 }, []]);
        });

        const { model, pool } = buildModel();
        pool.execute = executeImpl;

        await expect(model.createOng({
            name: 'Legacy Org',
            description: 'Legacy Description',
            contact: 'legacy@example.com',
            cnpj: '123',
            rg: '456',
            phone: '11999999999',
            address: 'Legacy Address',
            userId: 88
        })).resolves.toMatchObject({
            id: 77,
            cnpj: null,
            rg: null
        });

        expect(executeImpl).toHaveBeenCalled();
    });

    test('rejects when the database is unavailable', async () => {
        const { model } = buildModel(false);

        await expect(model.getOngs()).rejects.toThrow(/Banco de dados indispon/i);
    });
});
