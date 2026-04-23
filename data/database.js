const bcrypt = require('bcryptjs');
const { canUseDatabase, isConfigured, pool } = require('../config/database');
const createUsersRepository = require('./repositories/users.repository');
const createDenunciasRepository = require('./repositories/denuncias.repository');
const createOngsRepository = require('./repositories/ongs.repository');
const createPlanosRepository = require('./repositories/planos.repository');
const createNoticiasRepository = require('./repositories/noticias.repository');
const createDoacoesRepository = require('./repositories/doacoes.repository');
const createAssinaturasPlanoRepository = require('./repositories/assinaturasPlano.repository');
const createMensagensContatoRepository = require('./repositories/mensagensContato.repository');

const defaultPasswordHash = bcrypt.hashSync('123456', 10);

const ensureDataLoaded = async () => {
    if (!isConfigured) {
        return false;
    }

    return canUseDatabase();
};

const users = createUsersRepository({
    pool,
    canUseDatabase,
    defaultPasswordHash
});

const denuncias = createDenunciasRepository({
    pool,
    canUseDatabase
});

const ongs = createOngsRepository({
    pool,
    canUseDatabase
});

const planos = createPlanosRepository({
    pool,
    canUseDatabase
});

const noticias = createNoticiasRepository({
    pool,
    canUseDatabase
});

const doacoes = createDoacoesRepository({
    pool,
    canUseDatabase
});

const assinaturasPlano = createAssinaturasPlanoRepository({
    pool,
    canUseDatabase
});

const mensagensContato = createMensagensContatoRepository({
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
