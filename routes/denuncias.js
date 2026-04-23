const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const defaultData = require('../data/database');

const createDenunciasRouter = (data = defaultData) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
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
    });

    router.get('/nova', requireAuth, (req, res) => {
        res.render('denuncias/nova', {
            title: 'Nova Denúncia',
            error: req.query.error,
            success: req.query.success
        });
    });

    router.post('/nova', requireAuth, async (req, res) => {
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
    });

    router.get('/:id', async (req, res) => {
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
    });

    router.post('/:id/responder', requireAdmin, async (req, res) => {
        const denunciaId = req.params.id;
        const { response, newStatus } = req.body;
        const user = req.session.user;

        try {
            const denuncia = await data.getDenunciaById(denunciaId);

            if (!denuncia) {
                return res.status(404).json({ error: 'Denúncia não encontrada' });
            }

            const newResponse = {
                id: denuncia.responses.length + 1,
                text: response,
                ongName: user.ongName,
                ongId: user.id,
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
    });

    router.post('/:id/status', requireAdmin, async (req, res) => {
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
    });

    return router;
};

const router = createDenunciasRouter();

module.exports = router;
module.exports.createDenunciasRouter = createDenunciasRouter;
