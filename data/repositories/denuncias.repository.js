const {
    normalizeDenunciaRow,
    normalizeFilterId,
    toIsoString,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar denúncias');
        }
    };

    const loadDenuncias = async () => {
        await ensureDatabase();

        const [denunciaRows] = await pool.execute(
            'SELECT id, title, description, location, category, status, user_id, user_name, created_at FROM denuncias ORDER BY id'
        );
        const [responseRows] = await pool.execute(
            'SELECT id, denuncia_id, ong_id, ong_name, response_text, created_at FROM denuncia_responses ORDER BY id'
        );

        const denuncias = denunciaRows.map(normalizeDenunciaRow);
        const denunciasById = new Map(denuncias.map((denuncia) => [denuncia.id, denuncia]));

        for (const response of responseRows) {
            const denuncia = denunciasById.get(response.denuncia_id);
            if (!denuncia) {
                continue;
            }

            denuncia.responses.push({
                id: response.id,
                text: response.response_text,
                ongName: response.ong_name,
                ongId: response.ong_id,
                createdAt: toIsoString(response.created_at)
            });
        }

        return denuncias;
    };

    const persistDenuncia = async (denuncia) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const hasExplicitId = denuncia.id !== null && denuncia.id !== undefined;
            const query = hasExplicitId
                ? `INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE
                      title = VALUES(title),
                      description = VALUES(description),
                      location = VALUES(location),
                      category = VALUES(category),
                      status = VALUES(status),
                      user_id = VALUES(user_id),
                      user_name = VALUES(user_name),
                      created_at = VALUES(created_at)`
                : `INSERT INTO denuncias (title, description, location, category, status, user_id, user_name, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = hasExplicitId
                ? [
                    denuncia.id,
                    denuncia.title,
                    denuncia.description,
                    denuncia.location,
                    denuncia.category || 'geral',
                    denuncia.status || 'pendente',
                    denuncia.userId || denuncia.user_id || null,
                    denuncia.userName || denuncia.user_name || null,
                    toSqlDateTime(denuncia.createdAt)
                ]
                : [
                    denuncia.title,
                    denuncia.description,
                    denuncia.location,
                    denuncia.category || 'geral',
                    denuncia.status || 'pendente',
                    denuncia.userId || denuncia.user_id || null,
                    denuncia.userName || denuncia.user_name || null,
                    toSqlDateTime(denuncia.createdAt)
                ];

            const [result] = await connection.execute(query, values);

            const denunciaId = hasExplicitId ? denuncia.id : result.insertId;
            await connection.execute('DELETE FROM denuncia_responses WHERE denuncia_id = ?', [denunciaId]);

            const responses = Array.isArray(denuncia.responses) ? denuncia.responses : [];
            for (const response of responses) {
                await connection.execute(
                    `INSERT INTO denuncia_responses (denuncia_id, ong_id, ong_name, response_text, created_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        denunciaId,
                        response.ongId || response.ong_id || null,
                        response.ongName || response.ong_name || null,
                        response.text || response.response_text || '',
                        toSqlDateTime(response.createdAt)
                    ]
                );
            }

            await connection.commit();
            return {
                ...denuncia,
                id: denunciaId
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    };

    const getDenuncias = async (ongId = null) => {
        const denuncias = await loadDenuncias();
        const normalizedOngId = normalizeFilterId(ongId);

        if (normalizedOngId === null) {
            return denuncias;
        }

        return denuncias.filter((denuncia) =>
            denuncia.responses.some((response) => response.ongId === normalizedOngId)
        );
    };

    const getDenunciaById = async (id) => {
        const denuncias = await loadDenuncias();
        return denuncias.find((denuncia) => denuncia.id === parseInt(id, 10)) || null;
    };

    const createDenuncia = async (denunciaData) => {
        const newDenuncia = await persistDenuncia({
            ...denunciaData,
            status: denunciaData.status || 'pendente',
            responses: Array.isArray(denunciaData.responses) ? denunciaData.responses : []
        });

        return {
            ...newDenuncia,
            responses: Array.isArray(denunciaData.responses) ? denunciaData.responses : []
        };
    };

    const updateDenuncia = async (id, updateData) => {
        const existingDenuncia = await getDenunciaById(id);
        if (!existingDenuncia) {
            return null;
        }

        const mergedDenuncia = {
            ...existingDenuncia,
            ...updateData,
            id: existingDenuncia.id,
            responses: Array.isArray(updateData.responses) ? updateData.responses : existingDenuncia.responses
        };

        await persistDenuncia(mergedDenuncia);
        return mergedDenuncia;
    };

    return {
        createDenuncia,
        getDenunciaById,
        getDenuncias,
        updateDenuncia
    };
};
