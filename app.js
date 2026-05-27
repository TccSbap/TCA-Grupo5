const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });
const useMockDatabase = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
const defaultData = useMockDatabase
    ? require('./data/mockDatabase')
    : require('./data/database');
const { createIndexRouter } = require('./routes/index');
const { createAuthRouter } = require('./routes/auth');
const { createDenunciasRouter } = require('./routes/denuncias.js');
const { createOngsRouter } = require('./routes/ongs');
const { createAdminRouter } = require('./routes/admin');

const createApp = (data = defaultData) => {
    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
        secret: 'ods6-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
    }));

    app.use((req, res, next) => {
        res.locals.user = req.session.user || null;
        res.locals.isLoggedIn = !!req.session.user;
        res.locals.isAdmin = req.session.user && (req.session.user.type === 'admin' || req.session.user.type === 'ong');
        res.locals.currentPath = req.path;
        next();
    });

    if (process.env.NODE_ENV === 'test') {
        app.post('/__test/session', (req, res) => {
            req.session.user = req.body.user || null;
            res.status(204).end();
        });

        app.post('/__test/session/clear', (req, res) => {
            req.session.destroy(() => {
                res.status(204).end();
            });
        });

        app.post('/__test/reset-data', async (req, res) => {
            if (typeof data.resetData === 'function') {
                await data.resetData();
            }
            res.status(204).end();
        });
    }

    app.use('/', createIndexRouter(data));
    app.use('/auth', createAuthRouter(data));
    app.use('/denuncias', createDenunciasRouter(data));
    app.use('/ongs', createOngsRouter(data));
    app.use('/admin', createAdminRouter(data));

    app.use((req, res) => {
        res.status(404).render('404', { title: 'Pagina nao encontrada' });
    });

    return app;
};

const app = createApp();
const PORT = process.env.PORT || 3000;

const startServer = async (port = PORT, data = defaultData) => {
    try {
        const dataReady = await data.ensureDataLoaded();
        if (!dataReady) {
            console.error('Banco de dados indisponivel. Verifique a configuracao antes de iniciar o servidor.');
            process.exitCode = 1;
            return null;
        }

        return app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
            console.log(`Acesse: http://localhost:${port}`);
            console.log(useMockDatabase ? 'Modo mock ativo: dados em memoria.' : 'Modo MySQL ativo.');
        });
    } catch (error) {
        console.error('Falha ao preparar a camada de dados:', error);
        process.exitCode = 1;
        return null;
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.createApp = createApp;
module.exports.startServer = startServer;
