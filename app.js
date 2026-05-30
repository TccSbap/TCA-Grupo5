const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });
const isProduction = process.env.NODE_ENV === 'production';
const useMockDatabase = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';

if (isProduction && useMockDatabase) {
    throw new Error('USE_MOCK_DB nao pode ser true em producao.');
}

const defaultData = useMockDatabase
    ? require('./data/mockDatabase')
    : require('./data/database');
const { createIndexRouter } = require('./app/routes/index');
const { createAuthRouter } = require('./app/routes/auth');
const { createDenunciasRouter } = require('./app/routes/denuncias.js');
const { createOngsRouter } = require('./app/routes/ongs');
const { createAdminRouter } = require('./app/routes/admin');
const { getDashboardLabelForUser, getDashboardPathForUser } = require('./app/middleware/auth');
const { csrfProtection } = require('./app/middleware/csrf');
const { createSessionStore } = require('./app/middleware/sessionStore');
const { getCookieConsent } = require('./app/utils/cookieConsent');
const {
    buildRobotsTxt,
    buildSitemapXml,
    getSeoMetadataForPath,
    getSiteUrl
} = require('./app/utils/seo');
const { pool, isConfigured } = require('./config/database');
const appPath = path.join(__dirname, 'app');

const createApp = (data = defaultData) => {
    const app = express();
    const watchReloadEnabled = process.env.WATCH_RELOAD === 'true';
    const watchVersionFile = path.join(__dirname, 'tmp', 'watch-version.txt');
    const sessionSecret = process.env.SESSION_SECRET || 'ods6-secret-key-dev';
    const usePersistentSessionStore = process.env.NODE_ENV !== 'test' && isConfigured;
    const siteUrl = getSiteUrl();

    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
        console.error('SESSION_SECRET must be set in production');
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'production' && !isConfigured) {
        throw new Error('Banco de dados configurado é obrigatório em produção para persistir sessões.');
    }

    const readWatchVersion = () => {
        try {
            return fs.readFileSync(watchVersionFile, 'utf8').trim() || '0';
        } catch (error) {
            return '0';
        }
    };

    app.set('view engine', 'ejs');
    app.set('views', path.join(appPath, 'views'));
    app.set('trust proxy', 1);

    app.use(helmet({
        contentSecurityPolicy: false
    }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(express.static(path.join(appPath, 'public')));
    app.use((req, res, next) => {
        res.locals.cspNonce = crypto.randomBytes(16).toString('base64');

        const cspDirectives = [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "img-src 'self' data: https:",
            "style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com 'unsafe-inline'",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
            `script-src 'self' https://cdnjs.cloudflare.com 'nonce-${res.locals.cspNonce}'`,
            "connect-src 'self'"
        ];

        if (isProduction) {
            cspDirectives.push('upgrade-insecure-requests');
        }

        res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
        next();
    });

    const sessionOptions = {
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
            maxAge: 24 * 60 * 60 * 1000
        }
    };

    if (usePersistentSessionStore) {
        sessionOptions.store = createSessionStore(pool);
        sessionOptions.store.pruneExpired().catch((error) => {
            console.error('Falha ao realizar limpeza inicial de sessoes expiradas:', error);
        });
    }

    app.use(session(sessionOptions));

    app.use((req, res, next) => {
        const user = req.session.user || null;
        const cookieConsent = getCookieConsent(req);
        const seo = getSeoMetadataForPath(req.path, siteUrl);

        res.locals.user = user;
        res.locals.isLoggedIn = !!user;
        res.locals.isAdmin = !!user && user.type === 'admin';
        res.locals.isOng = !!user && user.type === 'ong';
        res.locals.dashboardPath = getDashboardPathForUser(user);
        res.locals.dashboardLabel = getDashboardLabelForUser(user);
        res.locals.changePasswordPath = '/auth/alterar-senha';
        res.locals.changePasswordLabel = 'Alterar senha';
        res.locals.currentPath = req.path;
        res.locals.siteName = seo.siteName;
        res.locals.seoCanonical = seo.canonical;
        res.locals.seoDescription = seo.description;
        res.locals.seoOgDescription = seo.ogDescription;
        res.locals.seoOgImage = seo.ogImage;
        res.locals.seoOgType = seo.ogType;
        res.locals.seoRobots = seo.robots;
        res.locals.seoStructuredData = seo.structuredData;
        res.locals.cookieConsent = cookieConsent;
        res.locals.showCookieBanner = !cookieConsent;
        res.locals.watchReload = watchReloadEnabled;
        res.locals.assetVersion = watchReloadEnabled ? readWatchVersion() : '1';

        if (seo.robots.startsWith('noindex')) {
            res.set('X-Robots-Tag', seo.robots);
        }

        next();
    });

    app.use(csrfProtection);

    app.get('/robots.txt', (req, res) => {
        res.type('text/plain').send(buildRobotsTxt(siteUrl));
    });

    app.get('/sitemap.xml', async (req, res) => {
        const sitemapXml = await buildSitemapXml(data, siteUrl);
        res.type('application/xml').send(sitemapXml);
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
        res.set('X-Robots-Tag', 'noindex, nofollow');
        res.status(404).render('404', {
            title: 'Pagina nao encontrada',
            seoRobots: 'noindex, nofollow',
            seoDescription: 'A página solicitada não foi encontrada.',
            seoCanonical: `${siteUrl}${req.path === '/' ? '/' : req.path}`,
            seoOgType: 'website',
            seoOgDescription: 'A página solicitada não foi encontrada.'
        });
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

        const serverApp = createApp(data);

        return serverApp.listen(port, () => {
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
