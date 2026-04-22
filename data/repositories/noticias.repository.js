const {
    normalizeNoticiaRow,
    normalizeFilterId
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar notícias');
        }
    };

    const getNoticias = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, title, date_label, description, image, url, icon_class, sort_order, created_at FROM news ORDER BY sort_order ASC, id ASC'
        );
        return rows.map(normalizeNoticiaRow);
    };

    const getNoticiaById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, title, date_label, description, image, url, icon_class, sort_order, created_at FROM news WHERE id = ? LIMIT 1',
            [normalizeFilterId(id)]
        );

        return rows.length > 0 ? normalizeNoticiaRow(rows[0]) : null;
    };

    return {
        getNoticias,
        getNoticiaById
    };
};
