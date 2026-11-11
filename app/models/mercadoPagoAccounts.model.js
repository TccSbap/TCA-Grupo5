module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar contas Mercado Pago.');
        }
    };

    const getOngPaymentAccount = async (ongId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            `SELECT ong_id, seller_user_id, expires_at, connected_at
             FROM ong_payment_accounts WHERE ong_id = ? LIMIT 1`,
            [Number(ongId)]
        );

        if (!rows.length) return null;

        return {
            ongId: Number(rows[0].ong_id),
            sellerUserId: String(rows[0].seller_user_id),
            expiresAt: rows[0].expires_at,
            connectedAt: rows[0].connected_at
        };
    };

    const getOngPaymentCredentials = async (ongId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            `SELECT ong_id, seller_user_id, access_token_encrypted,
                    refresh_token_encrypted, expires_at
             FROM ong_payment_accounts WHERE ong_id = ? LIMIT 1`,
            [Number(ongId)]
        );

        if (!rows.length) return null;

        return {
            ongId: Number(rows[0].ong_id),
            sellerUserId: String(rows[0].seller_user_id),
            accessTokenEncrypted: rows[0].access_token_encrypted,
            refreshTokenEncrypted: rows[0].refresh_token_encrypted,
            expiresAt: rows[0].expires_at
        };
    };

    const saveOngPaymentAccount = async (account) => {
        await ensureDatabase();
        await pool.execute(
            `INSERT INTO ong_payment_accounts (
                ong_id, seller_user_id, access_token_encrypted,
                refresh_token_encrypted, expires_at, connected_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
            ON DUPLICATE KEY UPDATE
                seller_user_id = VALUES(seller_user_id),
                access_token_encrypted = VALUES(access_token_encrypted),
                refresh_token_encrypted = VALUES(refresh_token_encrypted),
                expires_at = VALUES(expires_at),
                connected_at = CURRENT_TIMESTAMP(3)`,
            [
                Number(account.ongId),
                String(account.sellerUserId),
                account.accessTokenEncrypted,
                account.refreshTokenEncrypted,
                account.expiresAt
            ]
        );
    };

    const updateOngPaymentTokens = async (account) => {
        await ensureDatabase();
        const [result] = await pool.execute(
            `UPDATE ong_payment_accounts
             SET access_token_encrypted = ?, refresh_token_encrypted = ?, expires_at = ?
             WHERE ong_id = ?`,
            [
                account.accessTokenEncrypted,
                account.refreshTokenEncrypted,
                account.expiresAt,
                Number(account.ongId)
            ]
        );
        return result.affectedRows > 0;
    };

    return {
        getOngPaymentAccount,
        getOngPaymentCredentials,
        saveOngPaymentAccount,
        updateOngPaymentTokens
    };
};
