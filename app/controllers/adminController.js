const createAdminController = (data) => {
    const loadCollection = async (methodName, fallback = []) => {
        if (typeof data[methodName] !== 'function') {
            return fallback;
        }

        return data[methodName]();
    };

    const buildDashboardSummary = async () => {
        const [users, ongs, denuncias, mensagensContato, doacoes, assinaturasPlano] = await Promise.all([
            loadCollection('getUsers'),
            loadCollection('getOngs'),
            loadCollection('getDenuncias'),
            loadCollection('getMensagensContato'),
            loadCollection('getDoacoes'),
            loadCollection('getAssinaturasPlano')
        ]);

        const totalResponses = denuncias.reduce((count, denuncia) => {
            return count + (Array.isArray(denuncia.responses) ? denuncia.responses.length : 0);
        }, 0);

        return {
            users,
            ongs,
            denuncias,
            mensagensContato,
            doacoes,
            assinaturasPlano,
            totalUsers: users.length,
            totalOngs: ongs.length,
            totalDenuncias: denuncias.length,
            denunciasPendentes: denuncias.filter((denuncia) => denuncia.status === 'pendente').length,
            denunciasEmAndamento: denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length,
            denunciasResolvidas: denuncias.filter((denuncia) => denuncia.status === 'resolvida').length,
            totalResponses,
            totalMensagensContato: mensagensContato.length,
            totalDoacoes: doacoes.length,
            totalAssinaturas: assinaturasPlano.length,
            recentDenuncias: denuncias.slice(0, 5),
            recentOngs: ongs.slice(0, 5),
            recentMensagensContato: mensagensContato.slice(0, 5)
        };
    };

    return {
        async loginPage(req, res) {
            res.render('admin/login', { title: 'Login de Administrador', error: req.query.error });
        },

        async login(req, res) {
            const { email, password } = req.body;

            const user = await data.authenticateUser(email, password);
            if (!user || user.type !== 'admin') {
                return res.render('admin/login', {
                    title: 'Login de Administrador',
                    error: 'Credenciais inválidas'
                });
            }

            req.session.user = user;
            res.redirect('/admin');
        },

        async dashboard(req, res) {
            const summary = await buildDashboardSummary();

            return res.render('admin/dashboard', {
                title: 'Painel Administrativo',
                user: req.session.user,
                ...summary
            });
        },

        async denuncias(req, res) {
            const denuncias = await loadCollection('getDenuncias');

            res.render('admin/denuncias', {
                title: 'Gerenciar Denúncias',
                user: req.session.user,
                denuncias,
                totalDenuncias: denuncias.length,
                denunciasPendentes: denuncias.filter((denuncia) => denuncia.status === 'pendente').length,
                denunciasEmAndamento: denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length,
                denunciasResolvidas: denuncias.filter((denuncia) => denuncia.status === 'resolvida').length
            });
        },

        async ongs(req, res) {
            const ongs = await loadCollection('getOngs');

            res.render('admin/ongs', {
                title: 'Gerenciar ONGs',
                user: req.session.user,
                ongs,
                totalOngs: ongs.length
            });
        }
    };
};

module.exports = {
    createAdminController
};
