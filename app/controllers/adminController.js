const { toSessionUser } = require('../middleware/sessionUser');
const {
    buildAdminAnalytics,
    buildCsv
} = require('../utils/analytics');
const { normalizeApproximateCoordinates } = require('../utils/coordinates');
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

const toDateTimeInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
};

const parseAdminId = (value) => {
    if (!/^\d+$/.test(String(value || ''))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const textValue = (value) => typeof value === 'string' ? value.trim() : '';

const parseDateTimeInput = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return new Date(NaN);
    }
    const date = new Date(`${value}:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 16) !== value
        ? new Date(NaN)
        : date;
};

const createAdminController = (data) => {
    const loadCollection = async (methodName, fallback = []) => {
        if (typeof data[methodName] !== 'function') {
            return fallback;
        }

        return data[methodName]();
    };

    const loadAdminUsers = async () => (await loadCollection('getUsers'))
        .map(({ id, name, email, type }) => ({ id, name, email, type }));

    const renderDenunciaEdit = async (res, { denuncia, formData = denuncia, error = null, status = 200 }) =>
        res.status(status).render('admin/denuncia-form', {
            title: `Editar denúncia #${denuncia.id}`,
            user: res.locals.adminUser,
            denuncia,
            formData,
            createdAtInput: toDateTimeInput(formData.createdAt),
            users: await loadAdminUsers(),
            error
        });

    const renderOngEdit = async (res, { ong, formData = ong, error = null, status = 200 }) =>
        res.status(status).render('admin/ong-form', {
            title: `Editar ONG #${ong.id}`,
            user: res.locals.adminUser,
            ong,
            formData,
            createdAtInput: toDateTimeInput(formData.createdAt),
            users: await loadAdminUsers(),
            error
        });

    const buildDashboardSummary = async () => {
        const [users, ongs, denuncias, mensagensContato, doacoes] = await Promise.all([
            loadCollection('getUsers'),
            loadCollection('getOngs'),
            loadCollection('getDenuncias'),
            loadCollection('getMensagensContato'),
            loadCollection('getDoacoes')
        ]);

        return {
            users,
            ongs,
            denuncias,
            mensagensContato,
            doacoes,
            totalUsers: users.length,
            totalOngs: ongs.length,
            totalDenuncias: denuncias.length,
            denunciasPendentes: denuncias.filter((denuncia) => denuncia.status === 'pendente').length,
            denunciasEmAndamento: denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length,
            denunciasResolvidas: denuncias.filter((denuncia) => denuncia.status === 'resolvida').length,
            totalMensagensContato: mensagensContato.length,
            totalDoacoes: doacoes.length,
            recentDenuncias: [...denuncias].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
            recentOngs: [...ongs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
            recentMensagensContato: [...mensagensContato].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        };
    };

    return {
        async loginPage(req, res) {
            res.render('admin/login', { title: 'Login do Administrador', error: req.query.error });
        },

        async login(req, res) {
            const { email, password } = req.body;

            if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
                return res.status(400).render('admin/login', { title: 'Login do Administrador', error: 'Informe e-mail e senha.' });
            }

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
                doacoes: summary.doacoes
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
                doacoes: summary.doacoes
            });

            const rows = [
                ['Seção', 'Indicador', 'Valor'],
                ['Resumo geral', 'Usuários', summary.totalUsers],
                ['Resumo geral', 'ONGs', summary.totalOngs],
                ['Resumo geral', 'Denúncias', summary.totalDenuncias],
                ['Resumo geral', 'Pendentes', summary.denunciasPendentes],
                ['Resumo geral', 'Em andamento', summary.denunciasEmAndamento],
                ['Resumo geral', 'Resolvidas', summary.denunciasResolvidas],
                ['Resumo geral', 'Mensagens', summary.totalMensagensContato],
                ['Resumo geral', 'Doações', summary.totalDoacoes],
                ['Taxa', 'Resolução', `${analytics.resolution.rate}%`]
            ];

            analytics.statusCounts.forEach((item) => {
                rows.push(['Denúncias por status', item.label, item.value]);
            });

            analytics.category.labels.forEach((label, index) => {
                rows.push(['Denúncias por categoria', label, analytics.category.values[index]]);
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
                success: req.query.success,
                error: req.query.error,
                totalDenuncias: denuncias.length,
                denunciasPendentes: denuncias.filter((denuncia) => denuncia.status === 'pendente').length,
                denunciasEmAndamento: denuncias.filter((denuncia) => denuncia.status === 'em_andamento').length,
                denunciasResolvidas: denuncias.filter((denuncia) => denuncia.status === 'resolvida').length
            });
        },

        async denunciaEditPage(req, res) {
            const id = parseAdminId(req.params.id);
            const denuncia = id ? await data.getDenunciaById(id) : null;
            if (!denuncia) return res.status(404).render('404', { title: 'Denúncia não encontrada' });
            res.locals.adminUser = req.session.user;
            return renderDenunciaEdit(res, { denuncia, error: req.query.error });
        },

        async updateDenuncia(req, res) {
            const id = parseAdminId(req.params.id);
            const denuncia = id ? await data.getDenunciaById(id) : null;
            if (!denuncia) return res.status(404).render('404', { title: 'Denúncia não encontrada' });

            const users = await loadAdminUsers();
            const title = textValue(req.body.title);
            const description = textValue(req.body.description);
            const location = textValue(req.body.location);
            const category = textValue(req.body.category);
            const status = textValue(req.body.status);
            const userId = parseAdminId(req.body.userId);
            const userName = textValue(req.body.userName);
            const createdAt = parseDateTimeInput(req.body.createdAt);
            const latitudeInput = req.body.latitude;
            const longitudeInput = req.body.longitude;
            const hasLatitude = latitudeInput !== undefined && latitudeInput !== null && String(latitudeInput).trim() !== '';
            const hasLongitude = longitudeInput !== undefined && longitudeInput !== null && String(longitudeInput).trim() !== '';
            // A localização no mapa é opcional. Só tentamos validar quando o par
            // está completo; coordenadas antigas/incompletas não devem bloquear a edição.
            const coordinates = hasLatitude && hasLongitude
                ? normalizeApproximateCoordinates(latitudeInput, longitudeInput)
                : { latitude: null, longitude: null };

            let error = null;
            if (!title || title.length > 200) error = 'O título é obrigatório e deve ter até 200 caracteres.';
            else if (!description || description.length > 10000) error = 'A descrição é obrigatória e deve ter até 10.000 caracteres.';
            else if (!location || location.length > 255) error = 'A localização é obrigatória e deve ter até 255 caracteres.';
            else if (!['agua', 'esgoto', 'poluicao', 'geral'].includes(category)) error = 'Selecione uma categoria válida.';
            else if (!['pendente', 'em_andamento', 'resolvida'].includes(status)) error = 'Selecione um status válido.';
            else if (!userId || !users.some((candidate) => Number(candidate.id) === userId)) error = 'Selecione um usuário existente para associar à denúncia.';
            else if (!userName || userName.length > 150) error = 'O nome do autor é obrigatório e deve ter até 150 caracteres.';
            else if (Number.isNaN(createdAt.getTime())) error = 'Informe uma data válida.';
            else if (coordinates.error) error = coordinates.error;

            const formData = {
                ...denuncia,
                ...req.body,
                title,
                description,
                location,
                category,
                status,
                userId,
                userName,
                latitude: req.body.latitude === '' ? null : req.body.latitude,
                longitude: req.body.longitude === '' ? null : req.body.longitude,
                createdAt: req.body.createdAt
            };
            if (error) {
                res.locals.adminUser = req.session.user;
                return renderDenunciaEdit(res, { denuncia, formData, error, status: 400 });
            }

            try {
                const updated = await data.updateDenuncia(id, {
                    title,
                    description,
                    location,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    category,
                    status,
                    userId,
                    userName,
                    createdAt: createdAt.toISOString()
                });
                if (!updated) return res.status(404).render('404', { title: 'Denúncia não encontrada' });
                return res.redirect('/admin/denuncias?success=' + encodeURIComponent('Denúncia atualizada.'));
            } catch (saveError) {
                console.error('Falha administrativa ao atualizar denúncia:', saveError.code || saveError.message);
                res.locals.adminUser = req.session.user;
                return renderDenunciaEdit(res, {
                    denuncia,
                    formData,
                    error: 'Não foi possível salvar a denúncia. Confira os dados e tente novamente.',
                    status: 500
                });
            }
        },

        async deleteDenuncia(req, res) {
            const id = parseAdminId(req.params.id);
            if (!id) return res.status(400).redirect('/admin/denuncias?error=' + encodeURIComponent('Identificador de denúncia inválido.'));
            const deleted = await data.deleteDenuncia(id);
            if (!deleted) return res.status(404).redirect('/admin/denuncias?error=' + encodeURIComponent('Denúncia não encontrada.'));
            return res.redirect('/admin/denuncias?success=' + encodeURIComponent('Denúncia excluída.'));
        },

        async ongs(req, res) {
            const ongs = await loadCollection('getOngs');

            res.render('admin/ongs', {
                title: 'Gerenciar ONGs',
                user: req.session.user,
                ongs,
                totalOngs: ongs.length,
                success: req.query.success,
                error: req.query.error
            });
        },

        async ongEditPage(req, res) {
            const id = parseAdminId(req.params.id);
            const ong = id ? await data.getOngById(id) : null;
            if (!ong) return res.status(404).render('404', { title: 'ONG não encontrada' });
            res.locals.adminUser = req.session.user;
            return renderOngEdit(res, { ong, error: req.query.error });
        },

        async updateOng(req, res) {
            const id = parseAdminId(req.params.id);
            const ong = id ? await data.getOngById(id) : null;
            if (!ong) return res.status(404).render('404', { title: 'ONG não encontrada' });

            const users = await loadAdminUsers();
            const name = textValue(req.body.name);
            const description = textValue(req.body.description);
            const contact = textValue(req.body.contact);
            const cnpj = textValue(req.body.cnpj);
            const rg = textValue(req.body.rg);
            const phone = textValue(req.body.phone);
            const address = textValue(req.body.address);
            const userId = parseAdminId(req.body.userId);
            const createdAt = parseDateTimeInput(req.body.createdAt);
            const isActive = req.body.isActive === '1';

            let error = null;
            if (!name || name.length > 150) error = 'O nome é obrigatório e deve ter até 150 caracteres.';
            else if (!description || description.length > 10000) error = 'A descrição é obrigatória e deve ter até 10.000 caracteres.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || contact.length > 255) error = 'Informe um e-mail de contato válido.';
            else if (cnpj.length > 18 || rg.length > 20 || phone.length > 30 || address.length > 255) error = 'Um ou mais campos excedem o tamanho máximo permitido.';
            else if (!userId || !users.some((candidate) => Number(candidate.id) === userId && candidate.type === 'ong')) error = 'Selecione uma conta existente do tipo ONG.';
            else if (Number.isNaN(createdAt.getTime())) error = 'Informe uma data de parceria válida.';
            else if (!['0', '1'].includes(String(req.body.isActive))) error = 'Selecione se a ONG está ativa.';

            const formData = {
                ...ong,
                ...req.body,
                name,
                description,
                contact,
                cnpj,
                rg,
                phone,
                address,
                userId,
                createdAt: req.body.createdAt,
                isActive: req.body.isActive
            };
            if (error) {
                res.locals.adminUser = req.session.user;
                return renderOngEdit(res, { ong, formData, error, status: 400 });
            }

            try {
                const updated = await data.updateOng(id, {
                    name,
                    description,
                    contact,
                    cnpj,
                    rg,
                    phone,
                    address,
                    userId,
                    createdAt: createdAt.toISOString(),
                    isActive
                });
                if (!updated) return res.status(404).render('404', { title: 'ONG não encontrada' });
                return res.redirect('/admin/ongs?success=' + encodeURIComponent('Dados da ONG atualizados.'));
            } catch (saveError) {
                console.error('Falha administrativa ao atualizar ONG:', saveError.code || saveError.message);
                const message = saveError.code === 'ER_DUP_ENTRY'
                    ? 'Já existe uma ONG com esse nome ou vinculada a essa conta.'
                    : 'Não foi possível salvar os dados da ONG. Confira os campos e tente novamente.';
                res.locals.adminUser = req.session.user;
                return renderOngEdit(res, { ong, formData, error: message, status: 400 });
            }
        },

        async deactivateOng(req, res) {
            const id = parseAdminId(req.params.id);
            if (!id) return res.status(400).redirect('/admin/ongs?error=' + encodeURIComponent('Identificador de ONG inválido.'));
            const updated = await data.setOngActive(id, false);
            if (!updated) return res.status(404).redirect('/admin/ongs?error=' + encodeURIComponent('ONG não encontrada.'));
            return res.redirect('/admin/ongs?success=' + encodeURIComponent('ONG excluída da área pública. Os vínculos e históricos foram preservados.'));
        },

        async reactivateOng(req, res) {
            const id = parseAdminId(req.params.id);
            if (!id) return res.status(400).redirect('/admin/ongs?error=' + encodeURIComponent('Identificador de ONG inválido.'));
            const updated = await data.setOngActive(id, true);
            if (!updated) return res.status(404).redirect('/admin/ongs?error=' + encodeURIComponent('ONG não encontrada.'));
            return res.redirect('/admin/ongs?success=' + encodeURIComponent('ONG reativada e novamente visível ao público.'));
        }
    };
};

module.exports = {
    createAdminController
};
