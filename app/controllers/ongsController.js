const {
    buildAbsoluteUrl, buildBreadcrumbStructuredData, buildCollectionPageStructuredData,
    buildItemListStructuredData, buildOrganizationProfileStructuredData, buildPageStructuredData, getSiteUrl
} = require('../utils/seo');
const { loadPublicOngById, loadPublicOngs, toPublicOngProfile } = require('../utils/publicOngs');

const createOngsController = (data) => {
    const findUserOng = async (userId) => {
        if (typeof data.getOngByUserId === 'function') return data.getOngByUserId(userId);
        return (await data.getOngs()).find((ong) => ong.userId === userId) || null;
    };
    const buildSeoPayload = (res, pathname, title, description, extra = []) => ({
        title, seoCanonical: buildAbsoluteUrl(pathname, getSiteUrl()), seoDescription: description,
        seoOgDescription: description, seoOgTitle: title, seoOgType: 'website',
        seoStructuredData: buildPageStructuredData(res.locals.seoStructuredData, extra)
    });
    return {
        async index(req, res) {
            const ongs = await loadPublicOngs(data);
            const pageUrl = '/ongs';
            const description = 'Conhe\u00e7a as ONGs parceiras e veja como apoiam e orientam as comunidades em saneamento e \u00e1gua limpa.';
            const structuredData = [buildCollectionPageStructuredData({
                name: 'ONGs parceiras', description, url: pageUrl,
                mainEntity: buildItemListStructuredData(ongs.map((ong) => ({ type: 'Organization', name: ong.name, url: '/ongs/' + ong.id, description: ong.description })), getSiteUrl(), { name: 'ONGs parceiras', description, url: pageUrl, itemType: 'Organization' })
            })];
            res.render('ongs/index', { ...buildSeoPayload(res, pageUrl, 'ONGs parceiras', description, structuredData), ongs });
        },
        async adminDashboard(req, res) {
            const ong = await findUserOng(req.session.user.id);
            if (!ong) return res.status(404).render('404', { title: 'ONG n\u00e3o encontrada' });

            let mercadoPagoAccount = null;
            let mercadoPagoMigrationReady = typeof data.getOngPaymentAccount === 'function';
            if (typeof data.getOngPaymentAccount === 'function') {
                try {
                    mercadoPagoAccount = await data.getOngPaymentAccount(ong.id);
                } catch (error) {
                    mercadoPagoMigrationReady = false;
                    console.error('Não foi possível consultar a conexão Mercado Pago da ONG. Verifique as migrações.');
                }
            }

            const mercadoPagoMessages = {
                conectado: 'Conta Mercado Pago conectada com sucesso.',
                'config-pendente': 'A conexão ainda não foi configurada no servidor.',
                indisponivel: 'A conexão não está disponível neste ambiente.',
                'ong-nao-encontrada': 'Não foi possível localizar o perfil da ONG.',
                'autorizacao-cancelada': 'A autorização foi cancelada no Mercado Pago.',
                'oauth-invalido': 'A autorização expirou ou não pôde ser validada. Inicie a conexão novamente.',
                erro: 'Não foi possível concluir a conexão. Tente novamente.'
            };
            const mercadoPagoMessage = mercadoPagoMessages[req.query.mercadopago] || null;

            res.render('ongs/admin', {
                title: 'Perfil da ONG',
                ong,
                mercadoPagoAccount,
                mercadoPagoMigrationReady,
                mercadoPagoOAuthReady: require('../routes/mercadoPago').isOAuthConfigured()
                    && typeof data.saveOngPaymentAccount === 'function',
                mercadoPagoMessage
            });
        },
        async details(req, res) {
            const ongId = parseInt(req.params.id, 10);
            const ong = await loadPublicOngById(data, ongId);
            if (!ong) return res.status(404).render('404', { title: 'ONG n\u00e3o encontrada' });
            const pageUrl = '/ongs/' + ong.id;
            const description = `Consulte o e-mail, telefone de contato, localiza\u00e7\u00e3o e data de parceria da ONG ${ong.name}.`;
            const structuredData = [
                buildOrganizationProfileStructuredData(ong, getSiteUrl(), pageUrl),
                buildBreadcrumbStructuredData([{ name: 'ONGs parceiras', url: '/ongs' }, { name: ong.name, url: pageUrl }], getSiteUrl())
            ];
            res.render('ongs/detalhes', {
                ...buildSeoPayload(res, pageUrl, ong.name, description, structuredData),
                seoOgType: 'article',
                ong: toPublicOngProfile(ong)
            });
        }
    };
};
module.exports = { createOngsController };
