const {
    normalizePlanoRow,
    normalizeFilterId
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar planos');
        }
    };

    const getPlanos = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, title, price, subtitle, features_json, created_at FROM plans ORDER BY id'
        );
        return rows.map(normalizePlanoRow);
    };

    const getPlanoById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, title, price, subtitle, features_json, created_at FROM plans WHERE id = ? LIMIT 1',
            [normalizeFilterId(id)]
        );

        return rows.length > 0 ? normalizePlanoRow(rows[0]) : null;
    };

    return {
        getPlanoById,
        getPlanos
    };
};
