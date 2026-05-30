const { toSessionUser } = require('../middleware/sessionUser');
const {
    buildAdminAnalytics,
    buildCsv
} = require('../utils/analytics');
const regenerateSession = (req) => new Promise((resolve, reject) => {
    if (!req.session || typeof req.session.regenerate !== 'function') {
        resolve();
        return;
    }

    req.session.regenerate((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

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
            res.render('admin/login', { title: 'Login do Administrador', error: req.query.error });
        },

        async login(req, res) {
            const { email, password } = req.body;

            const user = await data.authenticateUser(email, password);
            if (!user || user.type !== 'admin') {
                return res.render('admin/login', {
                    title: 'Login do Administrador',
                    error: 'Credenciais inválidas'
                });
            }

            try {
                await regenerateSession(req);
            } catch (error) {
                console.error('Erro ao regenerar sessão do administrador:', error);
                return res.render('admin/login', {
                    title: 'Login do Administrador',
                    error: 'Não foi possível iniciar sua sessão. Tente novamente.'
                });
            }

            req.session.user = toSessionUser(user);
            res.redirect('/admin');
        },

        async dashboard(req, res) {
            const summary = await buildDashboardSummary();
            const analytics = buildAdminAnalytics({
                denuncias: summary.denuncias,
                ongs: summary.ongs,
                mensagensContato: summary.mensagensContato,
                doacoes: summary.doacoes,
                assinaturasPlano: summary.assinaturasPlano
            });

            return res.render('admin/dashboard', {
                title: 'Painel Administrativo',
                user: req.session.user,
                extraStyles: ['/css/analytics.css'],
                analytics,
                reportCsvPath: '/admin/relatorio.csv',
                ...summary
            });
        },

        async report(req, res) {
            const summary = await buildDashboardSummary();
            const analytics = buildAdminAnalytics({
                denuncias: summary.denuncias,
                ongs: summary.ongs,
                mensagensContato: summary.mensagensContato,
                doacoes: summary.doacoes,
                assinaturasPlano: summary.assinaturasPlano
            });

            const rows = [
                ['Seção', 'Indicador', 'Valor'],
                ['Resumo geral', 'Usuários', summary.totalUsers],
                ['Resumo geral', 'ONGs', summary.totalOngs],
                ['Resumo geral', 'Denúncias', summary.totalDenuncias],
                ['Resumo geral', 'Pendentes', summary.denunciasPendentes],
                ['Resumo geral', 'Em andamento', summary.denunciasEmAndamento],
                ['Resumo geral', 'Resolvidas', summary.denunciasResolvidas],
                ['Resumo geral', 'Respostas', summary.totalResponses],
                ['Resumo geral', 'Mensagens', summary.totalMensagensContato],
                ['Resumo geral', 'Doações', summary.totalDoacoes],
                ['Resumo geral', 'Assinaturas', summary.totalAssinaturas],
                ['Taxa', 'Resolução', `${analytics.resolution.rate}%`]
            ];

            analytics.statusCounts.forEach((item) => {
                rows.push(['Denúncias por status', item.label, item.value]);
            });

            analytics.category.labels.forEach((label, index) => {
                rows.push(['Denúncias por categoria', label, analytics.category.values[index]]);
            });

            analytics.responsesByOng.labels.forEach((label, index) => {
                rows.push(['Respostas por ONG', label, analytics.responsesByOng.values[index]]);
            });

            analytics.monthlyActivity.labels.forEach((label, index) => {
                analytics.monthlyActivity.datasets.forEach((dataset) => {
                    rows.push(['Atividade mensal', `${dataset.label} - ${label}`, dataset.data[index] || 0]);
                });
            });

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="painel-administrativo.csv"');
            return res.send(buildCsv(rows));
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
