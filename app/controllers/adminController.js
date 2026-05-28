const createAdminController = (data) => {
    const isOngRole = (user) => Boolean(user && (user.type === 'admin' || user.type === 'ong'));

    const renderAdminDashboard = async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/admin/login');
        }

        if (!isOngRole(req.session.user)) {
            return res.redirect('/dashboard');
        }

        const user = req.session.user;
        const userOng = typeof data.getOngByUserId === 'function' ? await data.getOngByUserId(user.id) : null;
        const ongId = userOng ? userOng.id : null;
        const allDenuncias = ongId ? await data.getDenuncias(ongId) : await data.getDenuncias();
        const allOngs = ongId ? await data.getOngs(ongId) : await data.getOngs();

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

    return {
        isOngRole,
        loginPage(req, res) {
            res.render('admin/login', { title: 'Login de Administrador', error: req.query.error });
        },

        async login(req, res) {
            const { email, password } = req.body;

            const user = await data.authenticateUser(email, password);
            if (!isOngRole(user)) {
                return res.render('admin/login', {
                    title: 'Login de Administrador',
                    error: 'Credenciais inválidas'
                });
            }

            req.session.user = user;
            res.redirect('/admin/dashboard_admin');
        },

        dashboard: renderAdminDashboard,

        async denuncias(req, res) {
            if (!isOngRole(req.session.user)) {
                return res.redirect('/dashboard');
            }

            res.render('admin/denuncias', {
                title: 'Gerenciar Denúncias',
                user: req.session.user,
                denuncias: await data.getDenuncias()
            });
        },

        async ongs(req, res) {
            if (!isOngRole(req.session.user)) {
                return res.redirect('/dashboard');
            }

            res.render('admin/ongs', {
                title: 'Gerenciar ONGs',
                user: req.session.user,
                ongs: await data.getOngs()
            });
        }
    };
};

module.exports = {
    createAdminController
};
