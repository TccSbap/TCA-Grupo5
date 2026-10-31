const { MySqlSessionStore } = require('../../../app/middleware/sessionStore');

test('inicializacao de sessoes se recupera de uma falha temporaria do banco', async () => {
    const pool = { execute: jest.fn().mockRejectedValueOnce(new Error('temporary outage')).mockResolvedValue([[]]) };
    const store = new MySqlSessionStore(pool, { cleanupIntervalMs: 0 });
    await expect(store.ensureTable()).rejects.toThrow('temporary outage');
    await expect(store.ensureTable()).resolves.toBeUndefined();
    expect(pool.execute).toHaveBeenCalledTimes(2);
    store.close();
});
