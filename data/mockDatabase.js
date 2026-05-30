const bcrypt = require('bcryptjs');
const createUsersSeed = require('./tables/users');
const createOngsSeed = require('./tables/ongs');
const createPlanosSeed = require('./tables/planos');
const createNoticiasSeed = require('./tables/noticias');
const createDoacoesSeed = require('./tables/doacoes');
const createAssinaturasPlanoSeed = require('./tables/assinaturasPlano');
const createMensagensContatoSeed = require('./tables/mensagensContato');
const createDenunciasSeed = require('./tables/denuncias');

const defaultPasswordHash = bcrypt.hashSync('123456', 10);

let users = [];
let denuncias = [];
let ongs = [];
let planos = [];
let noticias = [];
let doacoes = [];
let assinaturasPlano = [];
let mensagensContato = [];

const nextId = (items) => (items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1);

const normalizeFilterId = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const initializeData = () => {
    users = createUsersSeed(defaultPasswordHash);
    ongs = createOngsSeed().map((ong) => ({
        cnpj: null,
        rg: null,
        ...ong
    }));
    planos = createPlanosSeed();
    noticias = createNoticiasSeed();
    doacoes = createDoacoesSeed();
    assinaturasPlano = createAssinaturasPlanoSeed();
    mensagensContato = createMensagensContatoSeed();
    denuncias = createDenunciasSeed();
};

const resetData = () => {
    initializeData();
};

const buildSessionUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    ongName: user.ongName || null,
    createdAt: user.createdAt
});

const getUsers = () => users;
const getUserByEmail = (email) => users.find((user) => user.email === email);
const getUserById = (id) => users.find((user) => user.id === parseInt(id, 10));
const authenticateUser = (email, password) => {
    const user = getUserByEmail(email);
    if (!user) {
        return null;
    }

    const passwordHash = user.password || defaultPasswordHash;
    if (!bcrypt.compareSync(password, passwordHash)) {
        return null;
    }

    return buildSessionUser(user);
};

const createUser = (userData) => {
    const newUser = {
        id: nextId(users),
        ...userData,
        createdAt: userData.createdAt || new Date().toISOString()
    };

    users.push(newUser);
    return newUser;
};

const createUserAndPersist = (userData) => createUser(userData);
const updateUserPassword = (id, passwordHash) => {
    const userIndex = users.findIndex((user) => user.id === parseInt(id, 10));

    if (userIndex === -1) {
        return false;
    }

    users[userIndex] = {
        ...users[userIndex],
        password: passwordHash
    };

    return true;
};
const saveUsers = (newUsers) => {
    users = newUsers;
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

const getDenunciaById = (id) => denuncias.find((denuncia) => denuncia.id === parseInt(id, 10));

const createDenuncia = (denunciaData) => {
    const newDenuncia = {
        id: nextId(denuncias),
        ...denunciaData,
        status: 'pendente',
        responses: [],
        createdAt: denunciaData.createdAt || new Date().toISOString()
    };

    denuncias.push(newDenuncia);
    return newDenuncia;
};

const updateDenuncia = (id, updateData) => {
    const index = denuncias.findIndex((denuncia) => denuncia.id === parseInt(id, 10));
    if (index === -1) {
        return null;
    }

    denuncias[index] = {
        ...denuncias[index],
        ...updateData,
        responses: Array.isArray(updateData.responses) ? updateData.responses : denuncias[index].responses
    };

    return denuncias[index];
};

const saveDenuncias = (newDenuncias) => {
    denuncias = newDenuncias;
};

const createOng = (ongData) => {
    const newOng = {
        id: nextId(ongs),
        ...ongData,
        contact: ongData.contact || ongData.contact_email || null,
        cnpj: ongData.cnpj || null,
        rg: ongData.rg || null,
        userId: ongData.userId || ongData.user_id || null,
        focus: ongData.focus || ongData.description || ongData.name,
        createdAt: ongData.createdAt || new Date().toISOString()
    };

    ongs.push(newOng);
    return newOng;
};

const createOngAndPersist = (ongData) => createOng(ongData);
const getOngs = (ongId = null) => {
    const normalizedOngId = normalizeFilterId(ongId);

    if (normalizedOngId === null) {
        return ongs;
    }

    return ongs.filter((ong) => ong.id === normalizedOngId);
};
const getOngById = (id) => ongs.find((ong) => ong.id === parseInt(id, 10));
const getOngByUserId = (userId) => ongs.find((ong) => ong.userId === parseInt(userId, 10));
const saveOngs = (newOngs) => {
    ongs = newOngs;
};

const getPlanos = () => planos;
const getPlanoById = (id) => planos.find((plano) => plano.id === parseInt(id, 10));

const getNoticias = () => noticias;
const getNoticiaById = (id) => noticias.find((noticia) => noticia.id === parseInt(id, 10));

const getDoacoes = () => doacoes;
const createDoacao = (donationData) => {
    const newDoacao = {
        id: nextId(doacoes),
        ...donationData,
        status: donationData.status || 'pendente',
        createdAt: donationData.createdAt || new Date().toISOString()
    };

    doacoes.push(newDoacao);
    return newDoacao;
};

const getAssinaturasPlano = () => assinaturasPlano;
const createAssinaturaPlano = (subscriptionData) => {
    const newSubscription = {
        id: nextId(assinaturasPlano),
        ...subscriptionData,
        status: subscriptionData.status || 'pendente',
        createdAt: subscriptionData.createdAt || new Date().toISOString()
    };

    assinaturasPlano.push(newSubscription);
    return newSubscription;
};

const getMensagensContato = () => mensagensContato;
const createMensagemContato = (messageData) => {
    const newMessage = {
        id: nextId(mensagensContato),
        ...messageData,
        newsletter: !!messageData.newsletter,
        status: messageData.status || 'nova',
        createdAt: messageData.createdAt || new Date().toISOString()
    };

    mensagensContato.push(newMessage);
    return newMessage;
};

const ensureDataLoaded = async () => true;

initializeData();

module.exports = {
    ensureDataLoaded,
    authenticateUser,
    buildSessionUser,
    createAssinaturaPlano,
    createDoacao,
    createDenuncia,
    createMensagemContato,
    createOng,
    createOngAndPersist,
    createUser,
    createUserAndPersist,
    getAssinaturasPlano,
    getDenunciaById,
    getDenuncias,
    getDoacoes,
    getMensagensContato,
    getNoticias,
    getNoticiaById,
    getOngById,
    getOngByUserId,
    getOngs,
    getPlanoById,
    getPlanos,
    getUserByEmail,
    getUserById,
    getUsers,
    resetData,
    updateUserPassword,
    saveDenuncias,
    saveOngs,
    saveUsers,
    updateDenuncia
};
