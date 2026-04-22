const express = require('express');
const defaultData = require('../data/database');

const isOngRole = (user) => Boolean(user && (user.type === 'admin' || user.type === 'ong'));

const createAdminRouter = (data = defaultData) => {
    const router = express.Router();

    router.get('/login', (req, res) => {
        res.render('admin/login', { title: 'Login de Administrador', error: req.query.error });
    });

    router.post('/dashboard', (req, res) => {
        const { email, password } = req.body;

        const user = data.authenticateUser(email, password);
        if (!isOngRole(user)) {
            return res.render('admin/login', {
                title: 'Login de Administrador',
                error: 'Credenciais inválidas'
            });
        }

        req.session.user = user;
        res.redirect('/admin/dashboard_admin');
    });

    const renderAdminDashboard = (req, res) => {
        if (!req.session.user) {
            return res.redirect('/admin/login');
        }

        if (!isOngRole(req.session.user)) {
            return res.redirect('/dashboard');
        }

        const user = req.session.user;
        const userOng = typeof data.getOngByUserId === 'function' ? data.getOngByUserId(user.id) : null;
        const ongId = userOng ? userOng.id : null;
        const allDenuncias = ongId ? data.getDenuncias(ongId) : data.getDenuncias();
        const allOngs = ongId ? data.getOngs(ongId) : data.getOngs();

        return res.render('admin/dashboard', {
            title: 'Painel Administrativo',
            user,
            totalDenuncias: allDenuncias.length,
            totalOngs: allOngs.length,
            denunciasResolvidas: allDenuncias.filter((denuncia) => denuncia.status === 'resolvida').length,
            denunciasEmAndamento: allDenuncias.filter((denuncia) => denuncia.status === 'em_andamento').length,
            denunciasPendentes: allDenuncias.filter((denuncia) => denuncia.status === 'pendente').length
        });
    };

    router.get('/', renderAdminDashboard);
    router.get('/dashboard_admin', renderAdminDashboard);

    router.get('/denuncias', (req, res) => {
        if (!isOngRole(req.session.user)) {
            return res.redirect('/dashboard');
        }

        res.render('admin/denuncias', {
            title: 'Gerenciar Denúncias',
            user: req.session.user,
            denuncias: data.getDenuncias()
        });
    });

    router.get('/ongs', (req, res) => {
        if (!isOngRole(req.session.user)) {
            return res.redirect('/dashboard');
        }

        res.render('admin/ongs', {
            title: 'Gerenciar ONGs',
            user: req.session.user,
            ongs: data.getOngs()
        });
    });

    return router;
};

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
