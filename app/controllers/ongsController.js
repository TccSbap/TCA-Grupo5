const {
    buildAbsoluteUrl,
    buildBreadcrumbStructuredData,
    buildCollectionPageStructuredData,
    buildItemListStructuredData,
    buildOrganizationProfileStructuredData,
    buildPageStructuredData,
    getSiteUrl
} = require('../utils/seo');

const createOngsController = (data) => {
    const findUserOng = async (userId) => {
        if (typeof data.getOngByUserId === 'function') {
            return data.getOngByUserId(userId);
        }

        if (typeof data.getOngs !== 'function') {
            return null;
        }

        const ongs = await data.getOngs();
        return ongs.find((ong) => ong.userId === userId) || null;
    };

    const buildSeoPayload = (res, pathname, title, description, options = {}) => ({
        title,
        seoCanonical: buildAbsoluteUrl(pathname, getSiteUrl()),
        seoDescription: description,
        seoOgDescription: options.seoOgDescription || description,
        seoOgTitle: options.seoOgTitle || title,
        seoOgType: options.seoOgType || 'website',
        seoStructuredData: buildPageStructuredData(
            res.locals.seoStructuredData,
            options.structuredData || []
        )
    });

    return {
        async index(req, res) {
            const ongs = await data.getOngs();
            const pageUrl = '/ongs';
            const description = 'Conheça as ONGs parceiras e veja como cada organização atua em saneamento e água limpa.';
            const structuredData = [
                buildCollectionPageStructuredData({
                    name: 'ONGs parceiras',
                    description,
                    url: pageUrl,
                    mainEntity: buildItemListStructuredData(
                        ongs.map((ong) => ({
                            type: 'Organization',
                            name: ong.name,
                            url: `/ongs/${ong.id}`,
                            description: ong.description,
                            image: undefined
                        })),
                        getSiteUrl(),
                        {
                            name: 'ONGs parceiras',
                            description: 'Organizações parceiras destacadas na Água Consciente.',
                            url: pageUrl,
                            itemType: 'Organization'
                        }
                    )
                })
            ];

            res.render('ongs/index', {
                ...buildSeoPayload(res, pageUrl, 'ONGs parceiras', description, {
                    seoOgTitle: 'ONGs parceiras | Água Consciente',
                    structuredData
                }),
                ongs: ongs.map((ong) => ({
                    ...ong,
                    focus: ong.focus || ong.description
                }))
            });
        },

        async adminDashboard(req, res) {
            const user = req.session.user;
            const userOng = await findUserOng(user.id);

            if (!userOng) {
                return res.status(404).render('404', { title: 'ONG não encontrada' });
            }

            const denuncias = await data.getDenuncias();
            const pendingDenuncias = denuncias.filter((denuncia) => denuncia.status === 'pendente');
            const respondedDenuncias = denuncias.filter((denuncia) =>
                denuncia.responses.some((response) => response.ongId === userOng.id)
            );

            res.render('ongs/admin', {
                title: 'Painel da ONG',
                ong: userOng,
                pendingDenuncias,
                respondedDenuncias
            });
        },

        async stats(req, res) {
            const user = req.session.user;
            const userOng = await findUserOng(user.id);

            if (!userOng) {
                return res.status(404).render('404', { title: 'ONG não encontrada' });
            }

            const denuncias = await data.getDenuncias();

            const totalResponses = denuncias.reduce((count, denuncia) => {
                return count + denuncia.responses.filter((response) => response.ongId === userOng.id).length;
            }, 0);

            const resolvedByOng = denuncias.filter((denuncia) =>
                denuncia.status === 'resolvida' && denuncia.responses.some((response) => response.ongId === userOng.id)
            ).length;

            const pendingDenuncias = denuncias.filter((denuncia) => denuncia.status === 'pendente').length;

            res.render('ongs/stats', {
                title: 'Estatísticas da ONG',
                stats: {
                    totalResponses,
                    resolvedByOng,
                    pendingDenuncias,
                    totalDenuncias: denuncias.length
                }
            });
        },

        async details(req, res) {
            const ongId = parseInt(req.params.id, 10);
            const ong = (await data.getOngs()).find((item) => item.id === ongId);

            if (!ong) {
                return res.status(404).render('404', { title: 'ONG não encontrada' });
            }

            const denuncias = await data.getDenuncias();
            const ongResponses = denuncias.filter((denuncia) =>
                denuncia.responses.some((response) => response.ongId === ong.id)
            );
            const pageUrl = `/ongs/${ong.id}`;
            const description = `${ong.description} Entre em contato, conheça a atuação da organização e acompanhe as denúncias respondidas.`;
            const structuredData = [
                buildOrganizationProfileStructuredData({
                    ...ong,
                    focus: ong.focus || ong.description
                }, getSiteUrl(), pageUrl),
                buildBreadcrumbStructuredData([
                    { name: 'ONGs parceiras', url: '/ongs' },
                    { name: ong.name, url: pageUrl }
                ], getSiteUrl())
            ];

            res.render('ongs/detalhes', {
                ...buildSeoPayload(res, pageUrl, ong.name, description, {
                    seoOgTitle: `${ong.name} | Água Consciente`,
                    seoOgType: 'article',
                    structuredData
                }),
                ong: {
                    ...ong,
                    focus: ong.focus || ong.description
                },
                responses: ongResponses
            });
        }
    };
};

module.exports = {
    createOngsController
};
