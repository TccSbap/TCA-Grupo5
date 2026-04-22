const {
    normalizeAssinaturaPlanoRow,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar assinaturas de plano');
        }
    };

    const getAssinaturasPlano = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, plan_id, user_id, plan_name, plan_price, subscriber_name, subscriber_email, subscriber_phone, subscriber_document, subscriber_cep, subscriber_street, subscriber_number, subscriber_neighborhood, subscriber_city, subscriber_state, payment_method, status, created_at FROM plan_subscriptions ORDER BY id'
        );
        return rows.map(normalizeAssinaturaPlanoRow);
    };

    const createAssinaturaPlano = async (subscriptionData) => {
        await ensureDatabase();

        const createdAt = subscriptionData.createdAt || new Date().toISOString();
        const [result] = await pool.execute(
            `INSERT INTO plan_subscriptions (
                plan_id, user_id, plan_name, plan_price, subscriber_name,
                subscriber_email, subscriber_phone, subscriber_document,
                subscriber_cep, subscriber_street, subscriber_number,
                subscriber_neighborhood, subscriber_city, subscriber_state,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                subscriptionData.planId || null,
                subscriptionData.userId || null,
                subscriptionData.planName,
                subscriptionData.planPrice,
                subscriptionData.subscriberName,
                subscriptionData.subscriberEmail,
                subscriptionData.subscriberPhone,
                subscriptionData.subscriberDocument,
                subscriptionData.subscriberCep,
                subscriptionData.subscriberStreet,
                subscriptionData.subscriberNumber,
                subscriptionData.subscriberNeighborhood,
                subscriptionData.subscriberCity,
                subscriptionData.subscriberState,
                subscriptionData.paymentMethod,
                subscriptionData.status || 'pendente',
                toSqlDateTime(createdAt)
            ]
        );

        return {
            id: result.insertId,
            planId: subscriptionData.planId || null,
            userId: subscriptionData.userId || null,
            planName: subscriptionData.planName,
            planPrice: subscriptionData.planPrice,
            subscriberName: subscriptionData.subscriberName,
            subscriberEmail: subscriptionData.subscriberEmail,
            subscriberPhone: subscriptionData.subscriberPhone,
            subscriberDocument: subscriptionData.subscriberDocument,
            subscriberCep: subscriptionData.subscriberCep,
            subscriberStreet: subscriptionData.subscriberStreet,
            subscriberNumber: subscriptionData.subscriberNumber,
            subscriberNeighborhood: subscriptionData.subscriberNeighborhood,
            subscriberCity: subscriptionData.subscriberCity,
            subscriberState: subscriptionData.subscriberState,
            paymentMethod: subscriptionData.paymentMethod,
            status: subscriptionData.status || 'pendente',
            createdAt
        };
    };

    return {
        createAssinaturaPlano,
        getAssinaturasPlano
    };
};
