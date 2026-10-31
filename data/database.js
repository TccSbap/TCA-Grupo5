const bcrypt = require('bcryptjs');
const { canUseDatabase, isConfigured, pool } = require('../config/database');
const createUsersModel = require('../app/models/users.model');
const createDenunciasModel = require('../app/models/denuncias.model');
const createOngsModel = require('../app/models/ongs.model');
const createNoticiasModel = require('../app/models/noticias.model');
const createDoacoesModel = require('../app/models/doacoes.model');
const createMensagensContatoModel = require('../app/models/mensagensContato.model');

const defaultPasswordHash = process.env.NODE_ENV === 'production'
    ? null
    : bcrypt.hashSync('123456', 10);

const ensureDataLoaded = async () => {
    if (!isConfigured) {
        return false;
    }

    return canUseDatabase();
};

const users = createUsersModel({
    pool,
    canUseDatabase,
    defaultPasswordHash
});

const denuncias = createDenunciasModel({
    pool,
    canUseDatabase
});

const ongs = createOngsModel({
    pool,
    canUseDatabase
});

const noticias = createNoticiasModel({
    pool,
    canUseDatabase
});

const doacoes = createDoacoesModel({
    pool,
    canUseDatabase
});

const mensagensContato = createMensagensContatoModel({
    pool,
    canUseDatabase
});

const resetData = async () => false;

module.exports = {
    ensureDataLoaded,
    ...users,
    ...denuncias,
    ...ongs,
    ...noticias,
    ...doacoes,
    ...mensagensContato,
    resetData,
    canUseDatabase
};
