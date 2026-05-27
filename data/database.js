const bcrypt = require('bcryptjs');
const { canUseDatabase, isConfigured, pool } = require('../config/database');
const createUsersModel = require('../models/users.model');
const createDenunciasModel = require('../models/denuncias.model');
const createOngsModel = require('../models/ongs.model');
const createPlanosModel = require('../models/planos.model');
const createNoticiasModel = require('../models/noticias.model');
const createDoacoesModel = require('../models/doacoes.model');
const createAssinaturasPlanoModel = require('../models/assinaturasPlano.model');
const createMensagensContatoModel = require('../models/mensagensContato.model');

const defaultPasswordHash = bcrypt.hashSync('123456', 10);

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

const planos = createPlanosModel({
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

const assinaturasPlano = createAssinaturasPlanoModel({
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
    ...planos,
    ...noticias,
    ...doacoes,
    ...assinaturasPlano,
    ...mensagensContato,
    resetData,
    canUseDatabase
};
