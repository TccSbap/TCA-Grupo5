const {
    normalizeMensagemContatoRow,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar mensagens de contato');
        }
    };

    const getMensagensContato = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, user_id, name, email, subject, message, newsletter, status, created_at FROM contact_messages ORDER BY id'
        );
        return rows.map(normalizeMensagemContatoRow);
    };

    const createMensagemContato = async (messageData) => {
        await ensureDatabase();

        const createdAt = messageData.createdAt || new Date().toISOString();
        const [result] = await pool.execute(
            `INSERT INTO contact_messages (
                user_id, name, email, subject, message, newsletter, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                messageData.userId || null,
                messageData.name,
                messageData.email,
                messageData.subject,
                messageData.message,
                messageData.newsletter ? 1 : 0,
                messageData.status || 'nova',
                toSqlDateTime(createdAt)
            ]
        );

        return {
            id: result.insertId,
            userId: messageData.userId || null,
            name: messageData.name,
            email: messageData.email,
            subject: messageData.subject,
            message: messageData.message,
            newsletter: !!messageData.newsletter,
            status: messageData.status || 'nova',
            createdAt
        };
    };

    return {
        createMensagemContato,
        getMensagensContato
    };
};
