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

    return {
        async index(req, res) {
            const denuncias = await data.getDenuncias();
            const status = req.query.status;

            let filteredDenuncias = denuncias;
            if (status) {
                filteredDenuncias = denuncias.filter((d) => d.status === status);
            }

            res.render('denuncias/index', {
                title: 'Denúncias',
                denuncias: filteredDenuncias,
                currentStatus: status
            });
        },

        nova(req, res) {
            res.render('denuncias/nova', {
                title: 'Nova Denúncia',
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

            res.render('denuncias/detalhes', {
                title: `Denúncia: ${denuncia.title}`,
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
