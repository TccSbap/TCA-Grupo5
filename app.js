const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });
const useMockDatabase = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
const defaultData = useMockDatabase
    ? require('./data/mockDatabase')
    : require('./data/database');
const { createIndexRouter } = require('./app/routes/index');
const { createAuthRouter } = require('./app/routes/auth');
const { createDenunciasRouter } = require('./app/routes/denuncias.js');
const { createOngsRouter } = require('./app/routes/ongs');
const { createAdminRouter } = require('./app/routes/admin');
const { getDashboardPathForUser } = require('./app/middleware/auth');
const appPath = path.join(__dirname, 'app');

const createApp = (data = defaultData) => {
    const app = express();
    const watchReloadEnabled = process.env.WATCH_RELOAD === 'true';
    const watchVersionFile = path.join(__dirname, 'tmp', 'prod-watch-version.txt');
    const sessionSecret = process.env.SESSION_SECRET || 'ods6-secret-key-dev';

    const readWatchVersion = () => {
        try {
            return fs.readFileSync(watchVersionFile, 'utf8').trim() || '0';
        } catch (error) {
            return '0';
        }
    };

    app.set('view engine', 'ejs');
    app.set('views', path.join(appPath, 'views'));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(express.static(path.join(appPath, 'public')));

    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        }
    }));

    app.use((req, res, next) => {
        const user = req.session.user || null;

        res.locals.user = user;
        res.locals.isLoggedIn = !!user;
        res.locals.isAdmin = !!user && user.type === 'admin';
        res.locals.isOng = !!user && user.type === 'ong';
        res.locals.dashboardPath = getDashboardPathForUser(user);
        res.locals.currentPath = req.path;
        res.locals.watchReload = watchReloadEnabled;
        res.locals.assetVersion = watchReloadEnabled ? readWatchVersion() : '1';
        next();
    });

    if (watchReloadEnabled) {
        app.get('/__watch-version', (req, res) => {
            res.type('text/plain').send(readWatchVersion());
        });
    }

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
