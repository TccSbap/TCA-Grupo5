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
            'SELECT * FROM ongs ORDER BY id'
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
            'SELECT * FROM ongs WHERE id = ? LIMIT 1',
            [parseInt(id, 10)]
        );

        return rows.length > 0 ? normalizeOngRow(rows[0]) : null;
    };

    const getOngByUserId = async (userId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT * FROM ongs WHERE user_id = ? LIMIT 1',
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
