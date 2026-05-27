const bcrypt = require('bcryptjs');
const createUsersModel = require('../../../models/users.model');

const buildModel = (canUseDatabaseValue = true) => {
    const pool = {
        execute: jest.fn()
    };
    const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);
    const model = createUsersModel({
        pool,
        canUseDatabase,
        defaultPasswordHash: 'fallback-hash'
    });

    return { model, pool, canUseDatabase };
};

describe('models/users.model', () => {
    test('lists users and resolves lookups', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel();
        const row = {
            id: 1,
            name: 'User One',
            email: 'user@example.com',
            password_hash: 'hash',
            type: 'user',
            ong_name: null,
            created_at: iso
        };

        pool.execute.mockImplementation((query) => {
            if (query.includes('WHERE email')) {
                return Promise.resolve([[row], []]);
            }

            if (query.includes('WHERE id')) {
                return Promise.resolve([[row], []]);
            }

            return Promise.resolve([[row], []]);
        });

        await expect(model.getUsers()).resolves.toEqual([{
            id: 1,
            name: 'User One',
            email: 'user@example.com',
            password: 'hash',
            type: 'user',
            ongName: null,
            createdAt: iso
        }]);
        await expect(model.getUserByEmail('user@example.com')).resolves.toMatchObject({ id: 1 });
        await expect(model.getUserById('1')).resolves.toMatchObject({ id: 1 });
    });

    test('authenticates users with password comparison', async () => {
        const { model, pool } = buildModel();
        const passwordHash = bcrypt.hashSync('secret', 10);

        pool.execute.mockResolvedValue([
            [
                {
                    id: 2,
                    name: 'Authenticated User',
                    email: 'auth@example.com',
                    password_hash: passwordHash,
                    type: 'user',
                    ong_name: null,
                    created_at: '2024-01-02T03:04:05.000Z'
                }
            ],
            []
        ]);

        await expect(model.authenticateUser('auth@example.com', 'secret')).resolves.toMatchObject({
            id: 2,
            name: 'Authenticated User',
            email: 'auth@example.com',
            type: 'user'
        });
        await expect(model.authenticateUser('auth@example.com', 'wrong')).resolves.toBeNull();
    });

    test('creates users and exposes the persistence alias', async () => {
        const { model, pool } = buildModel();

        pool.execute
            .mockResolvedValueOnce([{ insertId: 9 }, []])
            .mockResolvedValueOnce([{ insertId: 10 }, []]);

        await expect(model.createUser({
            name: 'New User',
            email: 'new@example.com',
            password: 'hash',
            type: 'user'
        })).resolves.toMatchObject({
            id: 9,
            name: 'New User',
            email: 'new@example.com',
            type: 'user'
        });

        await expect(model.createUserAndPersist({
            name: 'Persisted User',
            email: 'persisted@example.com',
            password: 'hash',
            type: 'user'
        })).resolves.toMatchObject({
            id: 10,
            name: 'Persisted User',
            email: 'persisted@example.com',
            type: 'user'
        });
    });

    test('rejects when database access is unavailable', async () => {
        const { model } = buildModel(false);

        await expect(model.getUsers()).rejects.toThrow(/Banco de dados indispon/i);
    });
});
