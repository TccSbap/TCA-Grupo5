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
        const [rows] = await pool.execute('SELECT * FROM ongs ORDER BY id');
        const ongs = rows.map(normalizeOngRow);
        const normalizedOngId = normalizeFilterId(ongId);
        if (normalizedOngId === null) {
            return ongs;
        }

        return ongs.filter((ong) => ong.id === normalizedOngId);
    };

    const normalizePublicOngRow = (row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        contact: row.contact_email,
        phone: row.phone || null,
        address: row.address || null,
        createdAt: new Date(row.created_at).toISOString()
    });

    const normalizePublicOngProfileRow = (row) => ({
        id: row.id,
        name: row.name,
        contact: row.contact_email,
        phone: row.phone || null,
        address: row.address || null,
        createdAt: new Date(row.created_at).toISOString()
    });

    const getPublicOngs = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, description, contact_email, phone, address, created_at FROM ongs WHERE is_active = 1 ORDER BY id'
        );

        return rows.map(normalizePublicOngRow);
    };

    const getPublicOngById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, contact_email, phone, address, created_at FROM ongs WHERE id = ? AND is_active = 1 LIMIT 1',
            [parseInt(id, 10)]
        );

        return rows.length > 0 ? normalizePublicOngProfileRow(rows[0]) : null;
    };

    const getOngById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT * FROM ongs WHERE id = ? LIMIT 1',
            [parseInt(id, 10)]
        );

        return rows.length > 0 ? normalizeOngRow(rows[0]) : null;
    };

    const getOngByUserId = async (userId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT * FROM ongs WHERE user_id = ? AND is_active = 1 LIMIT 1',
            [parseInt(userId, 10)]
        );

        return rows.length > 0 ? normalizeOngRow(rows[0]) : null;
    };

    const createOng = async (ongData) => {
        await ensureDatabase();

        const createdAt = ongData.createdAt || new Date().toISOString();
        const focus = ongData.focus || ongData.description || ongData.name;
        const name = String(ongData.name || '').trim();
        const description = String(ongData.description || '').trim();
        const contact = String(ongData.contact || ongData.contact_email || '').trim();
        const cnpj = String(ongData.cnpj || '').trim() || null;
        const rg = String(ongData.rg || '').trim() || null;
        const phone = String(ongData.phone || '').trim() || null;
        const address = String(ongData.address || '').trim() || null;
        const userId = ongData.userId || ongData.user_id || null;
        const createdAtSql = toSqlDateTime(createdAt);

        const extendedQuery = `INSERT INTO ongs (name, description, contact_email, cnpj, rg, phone, address, user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const extendedValues = [
            name,
            description,
            contact,
            cnpj,
            rg,
            phone,
            address,
            userId,
            createdAtSql
        ];

        const legacyQuery = `INSERT INTO ongs (name, description, contact_email, phone, address, user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const legacyValues = [
            name,
            description,
            contact,
            phone,
            address,
            userId,
            createdAtSql
        ];

        let persistedWithDocuments = true;
        let result;

        try {
            [result] = await pool.execute(extendedQuery, extendedValues);
        } catch (error) {
            const isMissingDocumentColumns =
                (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054)) &&
                /cnpj|rg/i.test(String(error.sqlMessage || error.message || ''));

            if (!isMissingDocumentColumns) {
                throw error;
            }

            persistedWithDocuments = false;
            [result] = await pool.execute(legacyQuery, legacyValues);
        }

        return {
            id: result.insertId,
            name,
            description,
            contact,
            cnpj: persistedWithDocuments ? cnpj : null,
            rg: persistedWithDocuments ? rg : null,
            phone,
            address,
            userId,
            focus,
            createdAt,
            isActive: true
        };
    };

    const createOngAndPersist = async (ongData) => createOng(ongData);

    const updateOng = async (id, ongData) => {
        await ensureDatabase();
        const name = String(ongData.name || '').trim();
        const description = String(ongData.description || '').trim();
        const contact = String(ongData.contact || '').trim();
        const cnpj = String(ongData.cnpj || '').trim() || null;
        const rg = String(ongData.rg || '').trim() || null;
        const phone = String(ongData.phone || '').trim() || null;
        const address = String(ongData.address || '').trim() || null;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const [existingRows] = await connection.execute(
                'SELECT id FROM ongs WHERE id = ? LIMIT 1 FOR UPDATE',
                [Number(id)]
            );
            if (existingRows.length === 0) {
                await connection.rollback();
                return false;
            }

            const nextUserId = Number(ongData.userId);
            await connection.execute(
                `UPDATE ongs
                 SET name = ?, description = ?, contact_email = ?, cnpj = ?, rg = ?,
                     phone = ?, address = ?, user_id = ?, created_at = ?, is_active = ?
                 WHERE id = ?`,
                [
                    name,
                    description,
                    contact,
                    cnpj,
                    rg,
                    phone,
                    address,
                    nextUserId,
                    toSqlDateTime(ongData.createdAt),
                    ongData.isActive ? 1 : 0,
                    Number(id)
                ]
            );

            await connection.execute(
                'UPDATE users SET ong_name = ? WHERE id = ? AND type = \'ong\'',
                [name, nextUserId]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    };

    const setOngActive = async (id, isActive) => {
        await ensureDatabase();
        const [result] = await pool.execute(
            'UPDATE ongs SET is_active = ? WHERE id = ?',
            [isActive ? 1 : 0, Number(id)]
        );
        if (result.affectedRows > 0) return true;

        const [rows] = await pool.execute('SELECT id FROM ongs WHERE id = ? LIMIT 1', [Number(id)]);
        return rows.length > 0;
    };

    return {
        createOng,
        createOngAndPersist,
        getOngById,
        getOngByUserId,
        getOngs,
        getPublicOngById,
        getPublicOngs,
        setOngActive,
        updateOng
    };
};
