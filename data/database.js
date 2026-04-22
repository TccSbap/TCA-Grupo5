const bcrypt = require('bcryptjs');
const { pool, isConfigured, canUseDatabase } = require('../config/database');
const createUsersSeed = require('./tables/users');
const createOngsSeed = require('./tables/ongs');
const createPlanosSeed = require('./tables/planos');
const createNoticiasSeed = require('./tables/noticias');
const createDoacoesSeed = require('./tables/doacoes');
const createAssinaturasPlanoSeed = require('./tables/assinaturasPlano');
const createMensagensContatoSeed = require('./tables/mensagensContato');
const createDenunciasSeed = require('./tables/denuncias');

const isTestEnvironment = Boolean(process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');

// Cache em memÃ³ria usado para leitura rÃ¡pida e para o modo de teste
let users = [];
let denuncias = [];
let ongs = [];
let planos = [];
let noticias = [];
let doacoes = [];
let assinaturasPlano = [];
let mensagensContato = [];
const defaultPasswordHash = bcrypt.hashSync('123456', 10);
const hasDatabaseConnection = () => isConfigured;
const persistAsync = (operation, label) => {
    if (!hasDatabaseConnection()) {
        return;
    }

    Promise.resolve()
        .then(() => canUseDatabase())
        .then((dbAvailable) => {
            if (!dbAvailable) {
                if (!isTestEnvironment) {
                    throw new Error(`Banco de dados indisponÃ­vel para persistir ${label}`);
                }
                return null;
            }
            return operation();
        })
        .catch((error) => {
            console.error(`Erro ao persistir ${label}:`, error);
        });
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
    category: row.category,
    status: row.status,
    userId: row.user_id,
    userName: row.user_name,
    responses: [],
    createdAt: toIsoString(row.created_at)
});
const normalizePlanoRow = (row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    subtitle: row.subtitle,
    features: parseJsonArray(row.features_json),
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
    createdAt: toIsoString(row.created_at)
});
const normalizeAssinaturaPlanoRow = (row) => ({
    id: row.id,
    planId: row.plan_id,
    userId: row.user_id,
    planName: row.plan_name,
    planPrice: row.plan_price,
    subscriberName: row.subscriber_name,
    subscriberEmail: row.subscriber_email,
    subscriberPhone: row.subscriber_phone,
    subscriberDocument: row.subscriber_document,
    subscriberCep: row.subscriber_cep,
    subscriberStreet: row.subscriber_street,
    subscriberNumber: row.subscriber_number,
    subscriberNeighborhood: row.subscriber_neighborhood,
    subscriberCity: row.subscriber_city,
    subscriberState: row.subscriber_state,
    paymentMethod: row.payment_method,
    status: row.status,
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

// Inicializar dados padrão
const initializeData = () => {
    users = createUsersSeed(defaultPasswordHash);
    ongs = createOngsSeed();
    planos = createPlanosSeed();
    noticias = createNoticiasSeed();
    doacoes = createDoacoesSeed();
    assinaturasPlano = createAssinaturasPlanoSeed();
    mensagensContato = createMensagensContatoSeed();
    denuncias = createDenunciasSeed();
};

const loadFromDatabase = async () => {
    const [userRows] = await pool.execute(
        'SELECT id, name, email, password_hash, type, ong_name, created_at FROM users ORDER BY id'
    );
    const [ongRows] = await pool.execute(
        'SELECT id, name, description, contact_email, phone, address, user_id, created_at FROM ongs ORDER BY id'
    );
    const [planRows] = await pool.execute(
        'SELECT id, title, price, subtitle, features_json, created_at FROM plans ORDER BY id'
    );
    const [newsRows] = await pool.execute(
        'SELECT id, title, date_label, description, image, url, icon_class, sort_order, created_at FROM news ORDER BY sort_order ASC, id ASC'
    );
    const [donationRows] = await pool.execute(
        'SELECT id, ong_id, user_id, donor_name, donor_email, donor_phone, donor_document, donor_cep, donor_street, donor_number, donor_neighborhood, donor_city, donor_state, amount, message, payment_method, status, created_at FROM donations ORDER BY id'
    );
    const [subscriptionRows] = await pool.execute(
        'SELECT id, plan_id, user_id, plan_name, plan_price, subscriber_name, subscriber_email, subscriber_phone, subscriber_document, subscriber_cep, subscriber_street, subscriber_number, subscriber_neighborhood, subscriber_city, subscriber_state, payment_method, status, created_at FROM plan_subscriptions ORDER BY id'
    );
    const [contactRows] = await pool.execute(
        'SELECT id, user_id, name, email, subject, message, newsletter, status, created_at FROM contact_messages ORDER BY id'
    );
    const [denunciaRows] = await pool.execute(
        'SELECT id, title, description, location, category, status, user_id, user_name, created_at FROM denuncias ORDER BY id'
    );
    const [responseRows] = await pool.execute(
        'SELECT id, denuncia_id, ong_id, ong_name, response_text, created_at FROM denuncia_responses ORDER BY id'
    );

    users = userRows.map(normalizeUserRow);
    ongs = ongRows.map(normalizeOngRow);
    planos = planRows.map(normalizePlanoRow);
    noticias = newsRows.map(normalizeNoticiaRow);
    doacoes = donationRows.map(normalizeDoacaoRow);
    assinaturasPlano = subscriptionRows.map(normalizeAssinaturaPlanoRow);
    mensagensContato = contactRows.map(normalizeMensagemContatoRow);
    denuncias = denunciaRows.map(normalizeDenunciaRow);

    const denunciasById = new Map(denuncias.map(denuncia => [denuncia.id, denuncia]));
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
};

const ensureDataLoaded = async () => {
    if (typeof ensureDataLoaded.ready !== 'undefined') {
        return ensureDataLoaded.ready;
    }

    if (!isConfigured) {
        ensureDataLoaded.ready = false;
        return ensureDataLoaded.ready;
    }

    ensureDataLoaded.ready = (async () => {
        if (await canUseDatabase()) {
            try {
                await loadFromDatabase();
                return true;
            } catch (error) {
                return false;
            }
        }

        return false;
    })();

    return ensureDataLoaded.ready;
};

// FunÃ§Ãµes para usuÃ¡rios
const getUsers = () => users;
const saveUsers = (newUsers) => {
    users = newUsers;
    syncDatabaseFromCache();
};

const getUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

const getUserById = (id) => {
    return users.find(user => user.id === parseInt(id));
};

const buildSessionUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    ongName: user.ongName || null,
    createdAt: user.createdAt
});

const authenticateUser = (email, password) => {
    const user = getUserByEmail(email);
    if (!user) {
        return null;
    }

    const passwordHash = user.password || user.password_hash || defaultPasswordHash;
    if (!bcrypt.compareSync(password, passwordHash)) {
        return null;
    }

    return buildSessionUser(user);
};

const buildUserRecord = (userData) => ({
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...userData,
    createdAt: new Date().toISOString()
});

const persistUserToDatabase = async (user) => {
    if (!(await canUseDatabase())) {
        throw new Error('Banco de dados indisponÃ­vel para persistir usuÃ¡rio');
    }

    await pool.execute(
        `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            type = VALUES(type),
            ong_name = VALUES(ong_name),
            created_at = VALUES(created_at)`,
        [
            user.id,
            user.name,
            user.email,
            user.password || user.password_hash || defaultPasswordHash,
            user.type,
            user.ongName || user.ong_name || null,
            toSqlDateTime(user.createdAt)
        ]
    );
};

const createUser = (userData) => {
    const newUser = buildUserRecord(userData);
    users.push(newUser);
    persistUser(newUser);
    return newUser;
};

const createUserAndPersist = async (userData) => {
    const newUser = buildUserRecord(userData);
    await persistUserToDatabase(newUser);
    users.push(newUser);
    return newUser;
};

// FunÃ§Ãµes para denÃºncias
const normalizeFilterId = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const getDenuncias = (ongId = null) => {
    const normalizedOngId = normalizeFilterId(ongId);

    if (normalizedOngId === null) {
        return denuncias;
    }

    return denuncias.filter((denuncia) =>
        denuncia.responses.some((response) => response.ongId === normalizedOngId)
    );
};
const saveDenuncias = (newDenuncias) => {
    denuncias = newDenuncias;
    syncDatabaseFromCache();
};

const createDenuncia = (denunciaData) => {
    const newDenuncia = {
        id: denuncias.length > 0 ? Math.max(...denuncias.map(d => d.id)) + 1 : 1,
        ...denunciaData,
        status: 'pendente',
        responses: [],
        createdAt: new Date().toISOString()
    };
    denuncias.push(newDenuncia);
    persistDenuncia(newDenuncia);
    return newDenuncia;
};

const getDenunciaById = (id) => {
    return denuncias.find(d => d.id === parseInt(id));
};

const updateDenuncia = (id, updateData) => {
    const index = denuncias.findIndex(d => d.id === parseInt(id));
    if (index !== -1) {
        denuncias[index] = { ...denuncias[index], ...updateData };
        persistDenuncia(denuncias[index]);
        return denuncias[index];
    }
    return null;
};

// FunÃ§Ãµes para ONGs
const getOngs = (ongId = null) => {
    const normalizedOngId = normalizeFilterId(ongId);

    if (normalizedOngId === null) {
        return ongs;
    }

    return ongs.filter((ong) => ong.id === normalizedOngId);
};
const saveOngs = (newOngs) => {
    ongs = newOngs;
    syncDatabaseFromCache();
};

const getOngById = (id) => {
    return ongs.find(ong => ong.id === parseInt(id));
};

const getOngByUserId = (userId) => {
    return ongs.find(ong => ong.userId === parseInt(userId));
};

const buildOngRecord = (ongData) => ({
    id: ongs.length > 0 ? Math.max(...ongs.map(o => o.id)) + 1 : 1,
    ...ongData,
    focus: ongData.focus || ongData.description || ongData.name,
    createdAt: new Date().toISOString()
});

const persistOngToDatabase = async (ong) => {
    if (!(await canUseDatabase())) {
        throw new Error('Banco de dados indisponÃ­vel para persistir ONG');
    }

    await pool.execute(
        `INSERT INTO ongs (id, name, description, contact_email, phone, address, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            contact_email = VALUES(contact_email),
            phone = VALUES(phone),
            address = VALUES(address),
            user_id = VALUES(user_id),
            created_at = VALUES(created_at)`,
        [
            ong.id,
            ong.name,
            ong.description,
            ong.contact || ong.contact_email,
            ong.phone || null,
            ong.address || null,
            ong.userId || ong.user_id || null,
            toSqlDateTime(ong.createdAt)
        ]
    );
};

const createOng = (ongData) => {
    const newOng = buildOngRecord(ongData);
    ongs.push(newOng);
    persistAsync(() => persistOngToDatabase(newOng), 'ONG');
    return newOng;
};

const createOngAndPersist = async (ongData) => {
    const newOng = buildOngRecord(ongData);
    await persistOngToDatabase(newOng);
    ongs.push(newOng);
    return newOng;
};

// FunÃ§Ãµes para planos
const getPlanos = () => planos;
const getPlanoById = (id) => planos.find(plano => plano.id === parseInt(id));

// FunÃ§Ãµes para notÃ­cias
const getNoticias = () => noticias;
const getNoticiaById = (id) => noticias.find(noticia => noticia.id === parseInt(id));

// FunÃ§Ãµes para doaÃ§Ãµes
const getDoacoes = () => doacoes;
const createDoacao = (donationData) => {
    const newDoacao = {
        id: doacoes.length > 0 ? Math.max(...doacoes.map(item => item.id)) + 1 : 1,
        ...donationData,
        status: donationData.status || 'pendente',
        createdAt: new Date().toISOString()
    };
    doacoes.push(newDoacao);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO donations (
                id, ong_id, user_id, donor_name, donor_email, donor_phone,
                donor_document, donor_cep, donor_street, donor_number,
                donor_neighborhood, donor_city, donor_state, amount, message,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newDoacao.id,
                newDoacao.ongId || null,
                newDoacao.userId || null,
                newDoacao.donorName,
                newDoacao.donorEmail,
                newDoacao.donorPhone,
                newDoacao.donorDocument,
                newDoacao.donorCep,
                newDoacao.donorStreet,
                newDoacao.donorNumber,
                newDoacao.donorNeighborhood,
                newDoacao.donorCity,
                newDoacao.donorState,
                newDoacao.amount,
                newDoacao.message || null,
                newDoacao.paymentMethod,
                newDoacao.status,
                toSqlDateTime(newDoacao.createdAt)
            ]
        );
    }, 'doaÃ§Ã£o');
    return newDoacao;
};

// FunÃ§Ãµes para assinaturas de plano
const getAssinaturasPlano = () => assinaturasPlano;
const createAssinaturaPlano = (subscriptionData) => {
    const newSubscription = {
        id: assinaturasPlano.length > 0 ? Math.max(...assinaturasPlano.map(item => item.id)) + 1 : 1,
        ...subscriptionData,
        status: subscriptionData.status || 'pendente',
        createdAt: new Date().toISOString()
    };
    assinaturasPlano.push(newSubscription);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO plan_subscriptions (
                id, plan_id, user_id, plan_name, plan_price, subscriber_name,
                subscriber_email, subscriber_phone, subscriber_document,
                subscriber_cep, subscriber_street, subscriber_number,
                subscriber_neighborhood, subscriber_city, subscriber_state,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newSubscription.id,
                newSubscription.planId || null,
                newSubscription.userId || null,
                newSubscription.planName,
                newSubscription.planPrice,
                newSubscription.subscriberName,
                newSubscription.subscriberEmail,
                newSubscription.subscriberPhone,
                newSubscription.subscriberDocument,
                newSubscription.subscriberCep,
                newSubscription.subscriberStreet,
                newSubscription.subscriberNumber,
                newSubscription.subscriberNeighborhood,
                newSubscription.subscriberCity,
                newSubscription.subscriberState,
                newSubscription.paymentMethod,
                newSubscription.status,
                toSqlDateTime(newSubscription.createdAt)
            ]
        );
    }, 'assinatura de plano');
    return newSubscription;
};

// FunÃ§Ãµes para mensagens de contato
const getMensagensContato = () => mensagensContato;
const createMensagemContato = (messageData) => {
    const newMessage = {
        id: mensagensContato.length > 0 ? Math.max(...mensagensContato.map(item => item.id)) + 1 : 1,
        ...messageData,
        newsletter: !!messageData.newsletter,
        status: messageData.status || 'nova',
        createdAt: new Date().toISOString()
    };
    mensagensContato.push(newMessage);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO contact_messages (
                id, user_id, name, email, subject, message, newsletter, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newMessage.id,
                newMessage.userId || null,
                newMessage.name,
                newMessage.email,
                newMessage.subject,
                newMessage.message,
                newMessage.newsletter ? 1 : 0,
                newMessage.status,
                toSqlDateTime(newMessage.createdAt)
            ]
        );
    }, 'mensagem de contato');
    return newMessage;
};

const persistDenunciaWithResponses = async (denuncia) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                location = VALUES(location),
                category = VALUES(category),
                status = VALUES(status),
                user_id = VALUES(user_id),
                user_name = VALUES(user_name),
                created_at = VALUES(created_at)`,
            [
                denuncia.id,
                denuncia.title,
                denuncia.description,
                denuncia.location,
                denuncia.category || 'geral',
                denuncia.status || 'pendente',
                denuncia.userId || denuncia.user_id || 11,
                denuncia.userName || denuncia.user_name || 'JoÃ£o Silva',
                toSqlDateTime(denuncia.createdAt)
            ]
        );

        await connection.execute('DELETE FROM denuncia_responses WHERE denuncia_id = ?', [denuncia.id]);

        const responses = Array.isArray(denuncia.responses) ? denuncia.responses : [];
        for (const response of responses) {
            await connection.execute(
                `INSERT INTO denuncia_responses (id, denuncia_id, ong_id, ong_name, response_text, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    response.id,
                    denuncia.id,
                    response.ongId || response.ong_id || null,
                    response.ongName || response.ong_name || null,
                    response.text || response.response_text || '',
                    toSqlDateTime(response.createdAt)
                ]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const persistUser = (user) => {
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                email = VALUES(email),
                password_hash = VALUES(password_hash),
                type = VALUES(type),
                ong_name = VALUES(ong_name),
                created_at = VALUES(created_at)`,
            [
                user.id,
                user.name,
                user.email,
                user.password || user.password_hash || defaultPasswordHash,
                user.type,
                user.ongName || user.ong_name || null,
                toSqlDateTime(user.createdAt)
            ]
        );
    }, 'usuÃ¡rio');
};

const persistDenuncia = (denuncia) => {
    persistAsync(() => persistDenunciaWithResponses(denuncia), 'denÃºncia');
};

const syncDatabaseFromCache = () => {
    persistAsync(async () => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM contact_messages');
            await connection.execute('DELETE FROM plan_subscriptions');
            await connection.execute('DELETE FROM donations');
            await connection.execute('DELETE FROM denuncia_responses');
            await connection.execute('DELETE FROM denuncias');
            await connection.execute('DELETE FROM ongs');
            await connection.execute('DELETE FROM news');
            await connection.execute('DELETE FROM plans');
            await connection.execute('DELETE FROM users');

            for (const user of users) {
                await connection.execute(
                    `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.id,
                        user.name,
                        user.email,
                        user.password || user.password_hash || defaultPasswordHash,
                        user.type,
                        user.ongName || user.ong_name || null,
                        toSqlDateTime(user.createdAt)
                    ]
                );
            }

            for (const ong of ongs) {
                await connection.execute(
                    `INSERT INTO ongs (id, name, description, contact_email, phone, address, user_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        ong.id,
                        ong.name,
                        ong.description,
                        ong.contact || ong.contact_email,
                        ong.phone || null,
                        ong.address || null,
                        ong.userId || ong.user_id || null,
                        toSqlDateTime(ong.createdAt)
                    ]
                );
            }

            for (const plano of planos) {
                await connection.execute(
                    `INSERT INTO plans (id, title, price, subtitle, features_json, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        plano.id,
                        plano.title,
                        plano.price,
                        plano.subtitle,
                        JSON.stringify(plano.features || []),
                        toSqlDateTime(plano.createdAt)
                    ]
                );
            }

            for (const noticia of noticias) {
                await connection.execute(
                    `INSERT INTO news (id, title, date_label, description, image, url, icon_class, sort_order, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        noticia.id,
                        noticia.title,
                        noticia.date,
                        noticia.description,
                        noticia.image,
                        noticia.url,
                        noticia.iconClass || 'fas fa-newspaper',
                        noticia.sortOrder || noticia.id,
                        toSqlDateTime(noticia.createdAt)
                    ]
                );
            }

            for (const denuncia of denuncias) {
                await connection.execute(
                    `INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        denuncia.id,
                        denuncia.title,
                        denuncia.description,
                        denuncia.location,
                        denuncia.category || 'geral',
                        denuncia.status || 'pendente',
                        denuncia.userId || denuncia.user_id || 11,
                        denuncia.userName || denuncia.user_name || 'JoÃ£o Silva',
                        toSqlDateTime(denuncia.createdAt)
                    ]
                );

                for (const response of denuncia.responses || []) {
                    await connection.execute(
                        `INSERT INTO denuncia_responses (id, denuncia_id, ong_id, ong_name, response_text, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            response.id,
                            denuncia.id,
                            response.ongId || response.ong_id || null,
                            response.ongName || response.ong_name || null,
                            response.text || response.response_text || '',
                            toSqlDateTime(response.createdAt)
                        ]
                    );
                }
            }

            for (const doacao of doacoes) {
                await connection.execute(
                    `INSERT INTO donations (
                        id, ong_id, user_id, donor_name, donor_email, donor_phone,
                        donor_document, donor_cep, donor_street, donor_number,
                        donor_neighborhood, donor_city, donor_state, amount,
                        message, payment_method, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        doacao.id,
                        doacao.ongId || null,
                        doacao.userId || null,
                        doacao.donorName,
                        doacao.donorEmail,
                        doacao.donorPhone,
                        doacao.donorDocument,
                        doacao.donorCep,
                        doacao.donorStreet,
                        doacao.donorNumber,
                        doacao.donorNeighborhood,
                        doacao.donorCity,
                        doacao.donorState,
                        doacao.amount,
                        doacao.message || null,
                        doacao.paymentMethod,
                        doacao.status || 'pendente',
                        toSqlDateTime(doacao.createdAt)
                    ]
                );
            }

            for (const assinatura of assinaturasPlano) {
                await connection.execute(
                    `INSERT INTO plan_subscriptions (
                        id, plan_id, user_id, plan_name, plan_price, subscriber_name,
                        subscriber_email, subscriber_phone, subscriber_document,
                        subscriber_cep, subscriber_street, subscriber_number,
                        subscriber_neighborhood, subscriber_city, subscriber_state,
                        payment_method, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        assinatura.id,
                        assinatura.planId || null,
                        assinatura.userId || null,
                        assinatura.planName,
                        assinatura.planPrice,
                        assinatura.subscriberName,
                        assinatura.subscriberEmail,
                        assinatura.subscriberPhone,
                        assinatura.subscriberDocument,
                        assinatura.subscriberCep,
                        assinatura.subscriberStreet,
                        assinatura.subscriberNumber,
                        assinatura.subscriberNeighborhood,
                        assinatura.subscriberCity,
                        assinatura.subscriberState,
                        assinatura.paymentMethod,
                        assinatura.status || 'pendente',
                        toSqlDateTime(assinatura.createdAt)
                    ]
                );
            }

            for (const mensagem of mensagensContato) {
                await connection.execute(
                    `INSERT INTO contact_messages (
                        id, user_id, name, email, subject, message, newsletter, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        mensagem.id,
                        mensagem.userId || null,
                        mensagem.name,
                        mensagem.email,
                        mensagem.subject,
                        mensagem.message,
                        mensagem.newsletter ? 1 : 0,
                        mensagem.status || 'nova',
                        toSqlDateTime(mensagem.createdAt)
                    ]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }, 'sincronizaÃ§Ã£o do banco');
};

// Inicializar dados ao carregar o mÃ³dulo
const bootstrapData = () => {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        initializeData();
        ensureDataLoaded.ready = Promise.resolve(false);
        return ensureDataLoaded.ready;
    }

    if (!isConfigured) {
        ensureDataLoaded.ready = Promise.resolve(false);
        return ensureDataLoaded.ready;
    }

    ensureDataLoaded.ready = ensureDataLoaded();
    return ensureDataLoaded.ready;
};

bootstrapData();

const resetData = () => {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        initializeData();
    }
    ensureDataLoaded.ready = Promise.resolve(false);
    syncDatabaseFromCache();
};

const __private__ = {
    hasDatabaseConnection,
    persistAsync,
    toSqlDateTime,
    toIsoString,
    parseJsonArray,
    normalizeUserRow,
    normalizeOngRow,
    normalizeDenunciaRow,
    normalizePlanoRow,
    normalizeNoticiaRow,
    normalizeDoacaoRow,
    normalizeAssinaturaPlanoRow,
    normalizeMensagemContatoRow,
    loadFromDatabase,
    initializeData,
    syncDatabaseFromCache,
    persistUser,
    persistDenuncia,
    persistDenunciaWithResponses,
    ensureDataLoaded
};

module.exports = {
    ensureDataLoaded,
    getUsers,
    saveUsers,
    getUserByEmail,
    getUserById,
    authenticateUser,
    buildSessionUser,
    createUser,
    createUserAndPersist,
    getDenuncias,
    saveDenuncias,
    createDenuncia,
    getDenunciaById,
    updateDenuncia,
    getOngs,
    saveOngs,
    getOngById,
    getOngByUserId,
    createOng,
    createOngAndPersist,
    getPlanos,
    getPlanoById,
    getNoticias,
    getNoticiaById,
    getDoacoes,
    createDoacao,
    getAssinaturasPlano,
    createAssinaturaPlano,
    getMensagensContato,
    createMensagemContato,
    resetData,
    canUseDatabase,
    __private__
};
