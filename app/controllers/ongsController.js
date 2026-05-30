const {
    buildAbsoluteUrl,
    buildBreadcrumbStructuredData,
    buildCollectionPageStructuredData,
    buildItemListStructuredData,
    buildOrganizationProfileStructuredData,
    buildPageStructuredData,
    getSiteUrl
} = require('../utils/seo');
const {
    buildOngOperationalAnalytics,
    buildCsv
} = require('../utils/analytics');

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
            const analytics = buildOngOperationalAnalytics({
                denuncias,
                ong: userOng
            });

            res.render('ongs/admin', {
                title: 'Painel da ONG',
                ong: userOng,
                extraStyles: ['/css/analytics.css'],
                analytics,
                pendingDenuncias: analytics.pendingDenuncias,
                respondedDenuncias: analytics.respondedCases,
                reportCsvPath: '/ongs/admin/relatorio.csv'
            });
        },

        async report(req, res) {
            const user = req.session.user;
            const userOng = await findUserOng(user.id);

            if (!userOng) {
                return res.status(404).render('404', { title: 'ONG não encontrada' });
            }

            const denuncias = await data.getDenuncias();
            const analytics = buildOngOperationalAnalytics({
                denuncias,
                ong: userOng
            });

            const rows = [
                ['Seção', 'Indicador', 'Valor'],
                ['Resumo', 'Pendências', analytics.pendingDenuncias.length],
                ['Resumo', 'Respostas', analytics.responseVolume],
                ['Resumo', 'Casos resolvidos', analytics.resolvedCases.length],
                ['Resumo', 'Casos em aberto', analytics.openCases.length],
                ['Resumo', 'Taxa de resolução', `${analytics.resolutionRate}%`],
                ['Resumo', 'Tempo médio até 1ª resposta', analytics.avgFirstResponseLabel]
            ];

            analytics.pendingByCategory.labels.forEach((label, index) => {
                rows.push(['Pendências por categoria', label, analytics.pendingByCategory.values[index]]);
            });

            analytics.responsesByMonth.labels.forEach((label, index) => {
                rows.push(['Respostas por mês', label, analytics.responsesByMonth.values[index]]);
            });

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="painel-ong.csv"');
            return res.send(buildCsv(rows));
        },

        async stats(req, res) {
            const user = req.session.user;
            const userOng = await findUserOng(user.id);

            if (!userOng) {
                return res.status(404).render('404', { title: 'ONG não encontrada' });
            }

            const denuncias = await data.getDenuncias();
            const analytics = buildOngOperationalAnalytics({
                denuncias,
                ong: userOng
            });

            res.render('ongs/stats', {
                title: 'Estatísticas da ONG',
                ong: userOng,
                extraStyles: ['/css/analytics.css'],
                analytics,
                pendingDenuncias: analytics.pendingDenuncias,
                respondedDenuncias: analytics.respondedCases,
                reportCsvPath: '/ongs/admin/relatorio.csv',
                stats: {
                    totalResponses: analytics.responseVolume,
                    resolvedByOng: analytics.resolvedCases.length,
                    pendingDenuncias: analytics.pendingDenuncias.length,
                    totalDenuncias: denuncias.length,
                    openCases: analytics.openCases.length,
                    resolutionRate: analytics.resolutionRate,
                    avgFirstResponseLabel: analytics.avgFirstResponseLabel
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
