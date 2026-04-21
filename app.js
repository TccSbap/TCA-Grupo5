const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { ensureDataLoaded, resetData } = require('./data/database');


const app = express();
const PORT = process.env.PORT || 3000;


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
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    res.locals.isAdmin = req.session.user && req.session.user.type === 'admin';
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

    app.post('/__test/reset-data', (req, res) => {
        resetData();
        res.status(204).end();
    });
}


const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const denunciasRoutes = require('./routes/denuncias.js');
const ongsRoutes = require('./routes/ongs');
const adminRoutes = require('./routes/admin');


app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/denuncias', denunciasRoutes);
app.use('/ongs', ongsRoutes);
app.use('/admin', adminRoutes);


app.use((req, res) => {
    res.status(404).render('404', { title: 'Página não encontrada' });
});

if (require.main === module) {
    ensureDataLoaded()
        .catch((error) => {
            console.error('Falha ao preparar a camada de dados:', error);
        })
        .finally(() => {
            app.listen(PORT, () => {
                console.log(`Servidor rodando na porta ${PORT}`);
                console.log(`Acesse: http://localhost:${PORT}`);
            });
        });
}

module.exports = app;
