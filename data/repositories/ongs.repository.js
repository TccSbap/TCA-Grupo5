const {
    normalizeOngRow,
    normalizeFilterId,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar ONGs');
        }
    };

    const getOngs = async (ongId = null) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, description, contact_email, phone, address, user_id, created_at FROM ongs ORDER BY id'
        );
        const ongs = rows.map(normalizeOngRow);
        const normalizedOngId = normalizeFilterId(ongId);
        if (normalizedOngId === null) {
            return ongs;
        }

        return ongs.filter((ong) => ong.id === normalizedOngId);
    };

    const getOngById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, description, contact_email, phone, address, user_id, created_at FROM ongs WHERE id = ? LIMIT 1',
            [parseInt(id, 10)]
        );

        return rows.length > 0 ? normalizeOngRow(rows[0]) : null;
    };

    const getOngByUserId = async (userId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, description, contact_email, phone, address, user_id, created_at FROM ongs WHERE user_id = ? LIMIT 1',
            [parseInt(userId, 10)]
        );

        return rows.length > 0 ? normalizeOngRow(rows[0]) : null;
    };

    const createOng = async (ongData) => {
        await ensureDatabase();

        const createdAt = ongData.createdAt || new Date().toISOString();
        const focus = ongData.focus || ongData.description || ongData.name;
        const [result] = await pool.execute(
            `INSERT INTO ongs (name, description, contact_email, phone, address, user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                ongData.name,
                ongData.description,
                ongData.contact || ongData.contact_email,
                ongData.phone || null,
                ongData.address || null,
                ongData.userId || ongData.user_id || null,
                toSqlDateTime(createdAt)
            ]
        );

        return {
            id: result.insertId,
            name: ongData.name,
            description: ongData.description,
            contact: ongData.contact || ongData.contact_email,
            phone: ongData.phone || null,
            address: ongData.address || null,
            userId: ongData.userId || ongData.user_id || null,
            focus,
            createdAt
        };
    };

    const createOngAndPersist = async (ongData) => createOng(ongData);

    return {
        createOng,
        createOngAndPersist,
        getOngById,
        getOngByUserId,
        getOngs
    };
};
