const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');


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


const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const denunciasRoutes = require('./routes/denuncias');
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

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

module.exports = app;
