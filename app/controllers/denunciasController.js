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
            const { title, description, location, category } = req.body;

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

                const user = req.session.user;
                await data.createDenuncia({
                    title,
                    description,
                    location,
                    category,
                    userId: user.id,
                    userName: user.name || user.ongName || 'Usuário'
                });

                return res.redirect('/denuncias/nova?success=Validação concluída!');
            } catch (error) {
                console.error('Erro ao validar denúncia:', error);
                res.redirect('/denuncias/nova?error=Erro ao validar denúncia');
            }
        },

        async details(req, res) {
            const denunciaId = req.params.id;
            const denuncia = await data.getDenunciaById(denunciaId);

            if (!denuncia) {
                return res.status(404).render('404', { title: 'Denúncia não encontrada' });
            }

            const pageUrl = `/denuncias/${denuncia.id}`;
            const description = `${denuncia.description} Acompanhe a localização, o status e as respostas enviadas pelas ONGs parceiras.`;
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

        async responder(req, res) {
            const denunciaId = req.params.id;
            const { response, newStatus } = req.body;
            const user = req.session.user;

            try {
                const denuncia = await data.getDenunciaById(denunciaId);
                const userOng = await findUserOng(user.id);

                if (!denuncia) {
                    return res.status(404).json({ error: 'Denúncia não encontrada' });
                }

                if (!userOng) {
                    return res.status(404).render('404', { title: 'ONG não encontrada' });
                }

                const newResponse = {
                    id: denuncia.responses.length + 1,
                    text: response,
                    ongName: userOng.name || user.ongName || user.name,
                    ongId: userOng.id,
                    createdAt: new Date().toISOString()
                };

                const updatedDenuncia = {
                    ...denuncia,
                    responses: [...denuncia.responses, newResponse]
                };

                if (newStatus) {
                    updatedDenuncia.status = newStatus;
                }

                await data.updateDenuncia(denunciaId, updatedDenuncia);

                res.redirect(`/denuncias/${denunciaId}?success=Resposta adicionada com sucesso!`);
            } catch (error) {
                console.error('Erro ao responder denúncia:', error);
                res.redirect(`/denuncias/${denunciaId}?error=Erro ao adicionar resposta`);
            }
        },

        async updateStatus(req, res) {
            const denunciaId = req.params.id;
            const { status } = req.body;

            try {
                const denuncia = await data.getDenunciaById(denunciaId);

                if (!denuncia) {
                    return res.status(404).json({ error: 'Denúncia não encontrada' });
                }

                await data.updateDenuncia(denunciaId, { status });

                res.redirect(`/denuncias/${denunciaId}?success=Status atualizado com sucesso!`);
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
                res.redirect(`/denuncias/${denunciaId}?error=Erro ao atualizar status`);
            }
        }
    };
};

module.exports = {
    createDenunciasController
};
