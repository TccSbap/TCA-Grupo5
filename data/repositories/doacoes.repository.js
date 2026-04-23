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
            'SELECT id, ong_id, user_id, donor_name, donor_email, donor_phone, donor_document, donor_cep, donor_street, donor_number, donor_neighborhood, donor_city, donor_state, amount, message, payment_method, status, created_at FROM donations ORDER BY id'
        );
        return rows.map(normalizeDoacaoRow);
    };

    const createDoacao = async (donationData) => {
        await ensureDatabase();

        const createdAt = donationData.createdAt || new Date().toISOString();
        const [result] = await pool.execute(
            `INSERT INTO donations (
                ong_id, user_id, donor_name, donor_email, donor_phone,
                donor_document, donor_cep, donor_street, donor_number,
                donor_neighborhood, donor_city, donor_state, amount, message,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                donationData.ongId || null,
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

    return {
        createDoacao,
        getDoacoes
    };
};
