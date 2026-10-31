const {
    buildAbsoluteUrl, buildBreadcrumbStructuredData, buildCollectionPageStructuredData,
    buildItemListStructuredData, buildOrganizationProfileStructuredData, buildPageStructuredData, getSiteUrl
} = require('../utils/seo');

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
            const ongs = await data.getOngs();
            const pageUrl = '/ongs';
            const description = 'Conhe\u00e7a as ONGs parceiras e veja como apoiam e orientam as comunidades em saneamento e \u00e1gua limpa.';
            const structuredData = [buildCollectionPageStructuredData({
                name: 'ONGs parceiras', description, url: pageUrl,
                mainEntity: buildItemListStructuredData(ongs.map((ong) => ({ type: 'Organization', name: ong.name, url: '/ongs/' + ong.id, description: ong.description })), getSiteUrl(), { name: 'ONGs parceiras', description, url: pageUrl, itemType: 'Organization' })
            })];
            res.render('ongs/index', { ...buildSeoPayload(res, pageUrl, 'ONGs parceiras', description, structuredData), ongs: ongs.map((ong) => ({ ...ong, focus: ong.focus || ong.description })) });
        },
        async adminDashboard(req, res) {
            const ong = await findUserOng(req.session.user.id);
            if (!ong) return res.status(404).render('404', { title: 'ONG n\u00e3o encontrada' });
            res.render('ongs/admin', { title: 'Perfil da ONG', ong });
        },
        async details(req, res) {
            const ongId = parseInt(req.params.id, 10);
            const ong = (await data.getOngs()).find((item) => item.id === ongId);
            if (!ong) return res.status(404).render('404', { title: 'ONG n\u00e3o encontrada' });
            const pageUrl = '/ongs/' + ong.id;
            const description = ong.description + ' Conhe\u00e7a o perfil e os dados de contato da organiza\u00e7\u00e3o.';
            const structuredData = [
                buildOrganizationProfileStructuredData({ ...ong, focus: ong.focus || ong.description }, getSiteUrl(), pageUrl),
                buildBreadcrumbStructuredData([{ name: 'ONGs parceiras', url: '/ongs' }, { name: ong.name, url: pageUrl }], getSiteUrl())
            ];
            res.render('ongs/detalhes', {
                ...buildSeoPayload(res, pageUrl, ong.name, description, structuredData),
                seoOgType: 'article',
                ong: { ...ong, focus: ong.focus || ong.description }
            });
        }
    };
};
module.exports = { createOngsController };
