const nextId = (items) => (items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1);

const normalizeFilterId = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const toSqlDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    return date.toISOString().replace('T', ' ').replace('Z', '');
};

const toIsoString = (value) => {
    if (!value) {
        return new Date().toISOString();
    }

    return new Date(value).toISOString();
};

const parseJsonArray = (value, fallback = []) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const normalizeUserRow = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash,
    type: row.type,
    ongName: row.ong_name,
    createdAt: toIsoString(row.created_at)
});

const normalizeOngRow = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    contact: row.contact_email,
    cnpj: row.cnpj || null,
    rg: row.rg || null,
    phone: row.phone,
    address: row.address,
    userId: row.user_id,
    focus: row.focus || row.description,
    createdAt: toIsoString(row.created_at)
});

const normalizeDenunciaRow = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    category: row.category,
    status: row.status,
    userId: row.user_id,
    userName: row.user_name,
    responses: [],
    createdAt: toIsoString(row.created_at)
});

const normalizeNoticiaRow = (row) => ({
    id: row.id,
    title: row.title,
    date: row.date_label,
    description: row.description,
    image: row.image,
    url: row.url,
    iconClass: row.icon_class || 'fas fa-newspaper',
    sortOrder: row.sort_order || 0,
    createdAt: toIsoString(row.created_at)
});

const normalizeDoacaoRow = (row) => ({
    id: row.id,
    ongId: row.ong_id,
    recipientType: row.recipient_type || 'ong',
    userId: row.user_id,
    donorName: row.donor_name,
    donorEmail: row.donor_email,
    donorPhone: row.donor_phone,
    donorDocument: row.donor_document,
    donorCep: row.donor_cep,
    donorStreet: row.donor_street,
    donorNumber: row.donor_number,
    donorNeighborhood: row.donor_neighborhood,
    donorCity: row.donor_city,
    donorState: row.donor_state,
    amount: Number(row.amount),
    message: row.message,
    paymentMethod: row.payment_method,
    status: row.status,
    mercadoPagoOrderId: row.mercadopago_order_id || null,
    mercadoPagoPaymentId: row.mercadopago_payment_id || null,
    mercadoPagoStatus: row.mercadopago_status || null,
    createdAt: toIsoString(row.created_at)
});

const normalizeMensagemContatoRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    newsletter: !!row.newsletter,
    status: row.status,
    createdAt: toIsoString(row.created_at)
});

module.exports = {
    nextId,
    normalizeFilterId,
    toSqlDateTime,
    toIsoString,
    parseJsonArray,
    normalizeUserRow,
    normalizeOngRow,
    normalizeDenunciaRow,
    normalizeNoticiaRow,
    normalizeDoacaoRow,
    normalizeMensagemContatoRow
};
