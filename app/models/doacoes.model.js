const {
    normalizeDoacaoRow,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar doações');
        }
    };

    const getDoacoes = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, ong_id, recipient_type, user_id, donor_name, donor_email, donor_phone, donor_document, donor_cep, donor_street, donor_number, donor_neighborhood, donor_city, donor_state, amount, message, payment_method, status, mercadopago_order_id, mercadopago_payment_id, mercadopago_status, created_at FROM donations ORDER BY id'
        );
        return rows.map(normalizeDoacaoRow);
    };

    const createDoacao = async (donationData) => {
        await ensureDatabase();

        const createdAt = donationData.createdAt || new Date().toISOString();
        const [result] = await pool.execute(
            `INSERT INTO donations (
                ong_id, recipient_type, user_id, donor_name, donor_email, donor_phone,
                donor_document, donor_cep, donor_street, donor_number,
                donor_neighborhood, donor_city, donor_state, amount, message,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                donationData.ongId || null,
                donationData.recipientType === 'projeto' ? 'projeto' : 'ong',
                donationData.userId || null,
                donationData.donorName,
                donationData.donorEmail,
                donationData.donorPhone,
                donationData.donorDocument,
                donationData.donorCep,
                donationData.donorStreet,
                donationData.donorNumber,
                donationData.donorNeighborhood,
                donationData.donorCity,
                donationData.donorState,
                donationData.amount,
                donationData.message || null,
                donationData.paymentMethod,
                donationData.status || 'pendente',
                toSqlDateTime(createdAt)
            ]
        );

        return {
            id: result.insertId,
            ongId: donationData.ongId || null,
            recipientType: donationData.recipientType === 'projeto' ? 'projeto' : 'ong',
            userId: donationData.userId || null,
            donorName: donationData.donorName,
            donorEmail: donationData.donorEmail,
            donorPhone: donationData.donorPhone,
            donorDocument: donationData.donorDocument,
            donorCep: donationData.donorCep,
            donorStreet: donationData.donorStreet,
            donorNumber: donationData.donorNumber,
            donorNeighborhood: donationData.donorNeighborhood,
            donorCity: donationData.donorCity,
            donorState: donationData.donorState,
            amount: donationData.amount,
            message: donationData.message || null,
            paymentMethod: donationData.paymentMethod,
            status: donationData.status || 'pendente',
            createdAt
        };
    };

    const getDoacaoByMercadoPagoOrderId = async (orderId) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            `SELECT id, ong_id, recipient_type, amount, status,
                    mercadopago_order_id, mercadopago_payment_id
             FROM donations WHERE mercadopago_order_id = ? LIMIT 1`,
            [String(orderId)]
        );
        if (!rows.length) return null;
        return {
            id: Number(rows[0].id),
            ongId: rows[0].ong_id ? Number(rows[0].ong_id) : null,
            recipientType: rows[0].recipient_type || 'ong',
            amount: Number(rows[0].amount),
            status: rows[0].status,
            mercadoPagoOrderId: String(rows[0].mercadopago_order_id),
            mercadoPagoPaymentId: rows[0].mercadopago_payment_id ? String(rows[0].mercadopago_payment_id) : null
        };
    };

    const setDoacaoMercadoPagoOrder = async ({ donationId, orderId, providerStatus, recipientType = 'ong' }) => {
        await ensureDatabase();
        const [result] = await pool.execute(
            `UPDATE donations
             SET mercadopago_order_id = ?, mercadopago_status = ?
             WHERE id = ? AND recipient_type = ? AND mercadopago_order_id IS NULL`,
            [String(orderId), String(providerStatus || 'created').slice(0, 40), Number(donationId), recipientType]
        );
        if (result.affectedRows) return true;

        const [rows] = await pool.execute(
            'SELECT mercadopago_order_id FROM donations WHERE id = ? LIMIT 1',
            [Number(donationId)]
        );
        return rows.length > 0 && String(rows[0].mercadopago_order_id) === String(orderId);
    };

    const updateDoacaoMercadoPagoStatus = async ({
        donationId,
        orderId,
        paymentId = null,
        paymentMethod = null,
        providerStatus,
        donationStatus
    }) => {
        await ensureDatabase();
        if (!['pendente', 'confirmada', 'cancelada', 'reembolsada', 'parcialmente_reembolsada', 'contestada'].includes(donationStatus)) {
            throw new Error('Status de doação Mercado Pago inválido.');
        }

        const [result] = await pool.execute(
            `UPDATE donations
             SET status = ?, mercadopago_status = ?,
                 mercadopago_payment_id = COALESCE(?, mercadopago_payment_id),
                 payment_method = COALESCE(?, payment_method)
             WHERE id = ? AND mercadopago_order_id = ?`,
            [
                donationStatus,
                String(providerStatus || 'unknown').slice(0, 40),
                paymentId ? String(paymentId) : null,
                ['cartao', 'pix', 'boleto'].includes(paymentMethod) ? paymentMethod : null,
                Number(donationId),
                String(orderId)
            ]
        );
        return result.affectedRows > 0;
    };

    const updateProjectDoacaoMercadoPagoOrderStatus = async ({
        donationId,
        orderId,
        paymentId = null,
        paymentMethod = null,
        providerStatus,
        donationStatus
    }) => {
        await ensureDatabase();
        if (!['pendente', 'confirmada', 'cancelada', 'reembolsada', 'parcialmente_reembolsada', 'contestada'].includes(donationStatus)) {
            throw new Error('Status de doação Mercado Pago inválido.');
        }

        const [result] = await pool.execute(
            `UPDATE donations
             SET status = ?, mercadopago_status = ?,
                 mercadopago_payment_id = COALESCE(?, mercadopago_payment_id),
                 payment_method = COALESCE(?, payment_method)
             WHERE id = ? AND recipient_type = 'projeto' AND mercadopago_order_id = ?
               AND (status NOT IN ('confirmada', 'reembolsada', 'parcialmente_reembolsada', 'contestada')
                    OR mercadopago_payment_id = ? OR ? = 'confirmada')`,
            [
                donationStatus,
                String(providerStatus || 'unknown').slice(0, 40),
                paymentId ? String(paymentId) : null,
                ['cartao', 'pix', 'boleto'].includes(paymentMethod) ? paymentMethod : null,
                Number(donationId),
                String(orderId),
                paymentId ? String(paymentId) : '',
                donationStatus
            ]
        );
        return result.affectedRows > 0;
    };

    const updateDoacaoMercadoPagoOrderFailure = async (donationId) => {
        await ensureDatabase();
        await pool.execute(
            `UPDATE donations SET status = 'cancelada', mercadopago_status = 'order_creation_failed'
             WHERE id = ? AND mercadopago_order_id IS NULL`,
            [Number(donationId)]
        );
    };

    const updateProjectDoacaoMercadoPagoOrderFailure = async (donationId) => {
        await ensureDatabase();
        await pool.execute(
            `UPDATE donations
             SET status = 'cancelada', mercadopago_status = 'order_creation_failed'
             WHERE id = ? AND recipient_type = 'projeto' AND mercadopago_order_id IS NULL`,
            [Number(donationId)]
        );
    };

    return {
        createDoacao,
        getDoacoes,
        getDoacaoByMercadoPagoOrderId,
        setDoacaoMercadoPagoOrder,
        updateDoacaoMercadoPagoStatus,
        updateProjectDoacaoMercadoPagoOrderStatus,
        updateDoacaoMercadoPagoOrderFailure,
        updateProjectDoacaoMercadoPagoOrderFailure
    };
};
