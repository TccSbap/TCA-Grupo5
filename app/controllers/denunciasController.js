const {
    buildAbsoluteUrl,
    buildBreadcrumbStructuredData,
    buildCollectionPageStructuredData,
    buildDenunciaStructuredData,
    buildItemListStructuredData,
    buildPageStructuredData,
    getSiteUrl
} = require('../utils/seo');

const createDenunciasController = (data) => {
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
            const denuncias = await data.getDenuncias();
            const status = req.query.status;

            let filteredDenuncias = denuncias;
            if (status) {
                filteredDenuncias = denuncias.filter((d) => d.status === status);
            }

            const pageUrl = '/denuncias';
            const statusLabelMap = {
                pendente: 'pendentes',
                em_andamento: 'em andamento',
                resolvida: 'resolvidas'
            };
            const description = status
                ? `Acompanhe as denúncias ${statusLabelMap[status] || 'filtradas'} registradas sobre água e saneamento básico.`
                : 'Acompanhe denúncias registradas e o andamento das ações relacionadas ao saneamento básico.';
            const structuredData = [
                buildCollectionPageStructuredData({
                    name: 'Denúncias registradas',
                    description,
                    url: pageUrl,
                    mainEntity: buildItemListStructuredData(
                        filteredDenuncias.map((denuncia) => ({
                            type: 'Report',
                            name: denuncia.title,
                            url: `/denuncias/${denuncia.id}`,
                            description: denuncia.description,
                            datePublished: denuncia.createdAt
                        })),
                        getSiteUrl(),
                        {
                            name: 'Denúncias registradas',
                            description: 'Itens destacados na página pública de denúncias da Água Consciente.',
                            url: pageUrl,
                            itemType: 'Report'
                        }
                    )
                }),
                ...filteredDenuncias.map((denuncia) => buildDenunciaStructuredData(denuncia, getSiteUrl(), `/denuncias/${denuncia.id}`))
            ];

            res.render('denuncias/index', {
                ...buildSeoPayload(res, pageUrl, 'Denúncias registradas', description, {
                    seoOgTitle: 'Denúncias registradas | Água Consciente',
                    seoOgType: 'website',
                    structuredData
                }),
                denuncias: filteredDenuncias,
                currentStatus: status
            });
        },

        nova(req, res) {
            res.render('denuncias/nova', {
                ...buildSeoPayload(
                    res,
                    '/denuncias/nova',
                    'Nova denúncia',
                    'Registre uma denúncia sobre água, esgoto ou saneamento básico de forma rápida e segura.'
                ),
                error: req.query.error,
                success: req.query.success
            });
        },

        async create(req, res) {
            const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
            const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
            const location = typeof req.body.location === 'string' ? req.body.location.trim() : '';
            const aliases = { lixo: 'poluicao', drenagem: 'geral', outros: 'geral' };
            const rawCategory = req.body.category || 'geral';
            const category = typeof rawCategory === 'string' && Object.hasOwn(aliases, rawCategory) ? aliases[rawCategory] : rawCategory;

            try {
                if (!title || !description || !location) {
                    return res.redirect('/denuncias/nova?error=Preencha todos os campos obrigatórios');
                }

                if (title.length < 10) {
                    return res.redirect('/denuncias/nova?error=O título deve ter no mínimo 10 caracteres');
                }

                if (description.length < 20) {
                    return res.redirect('/denuncias/nova?error=A descrição deve ter no mínimo 20 caracteres');
                }

                if (location.length < 5) {
                    return res.redirect('/denuncias/nova?error=Informe uma localização válida');
                }

                if (title.length > 200 || location.length > 255 || description.length > 10000) {
                    return res.redirect('/denuncias/nova?error=' + encodeURIComponent('Título, localização ou descrição excedem o tamanho permitido.'));
                }
                if (!['agua', 'esgoto', 'poluicao', 'geral'].includes(category)) {
                    return res.redirect('/denuncias/nova?error=' + encodeURIComponent('Selecione uma categoria válida.'));
                }

                const user = req.session.user;
                await data.createDenuncia({
                    title,
                    description,
                    location,
                    category,
                    userId: user.id,
                    userName: user.name || user.ongName || 'Usuário'
                });

                return res.redirect('/denuncias/nova?success=' + encodeURIComponent('Denúncia registrada com sucesso.'));
            } catch (error) {
                console.error('Erro ao registrar denúncia:', error);
                res.redirect('/denuncias/nova?error=' + encodeURIComponent('Não foi possível registrar a denúncia. Tente novamente.'));
            }
        },

        async details(req, res) {
            const denunciaId = req.params.id;
            const denuncia = await data.getDenunciaById(denunciaId);

            if (!denuncia) {
                return res.status(404).render('404', { title: 'Denúncia não encontrada' });
            }

            const pageUrl = `/denuncias/${denuncia.id}`;
            const description = `${denuncia.description}`;
            const structuredData = [
                buildBreadcrumbStructuredData([
                    { name: 'Denúncias', url: '/denuncias' },
                    { name: denuncia.title, url: pageUrl }
                ], getSiteUrl()),
                buildDenunciaStructuredData(denuncia, getSiteUrl(), pageUrl)
            ];

            res.render('denuncias/detalhes', {
                ...buildSeoPayload(res, pageUrl, denuncia.title, description, {
                    seoOgTitle: `${denuncia.title} | Água Consciente`,
                    seoOgType: 'article',
                    structuredData
                }),
                denuncia,
                success: req.query.success,
                error: req.query.error
            });
        },


    };
};

module.exports = {
    createDenunciasController
};
