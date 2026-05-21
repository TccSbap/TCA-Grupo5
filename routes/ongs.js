const express = require('express');
const defaultData = require('../data/database');
const { requireAdmin } = require('../middleware/auth');

const createOngsRouter = (data = defaultData) => {
    const router = express.Router();

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

    router.get('/', async (req, res) => {
        const ongs = await data.getOngs();
        res.render('ongs/index', {
            title: 'ONGs Parceiras',
            ongs: ongs.map((ong) => ({
                ...ong,
                focus: ong.focus || ong.description
            }))
        });
    });

    router.get('/admin/dashboard', requireAdmin, async (req, res) => {
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
            title: 'Administração da ONG',
            ong: userOng,
            pendingDenuncias,
            respondedDenuncias
        });
    });

    router.get('/admin/stats', requireAdmin, async (req, res) => {
        const user = req.session.user;
        const userOng = await findUserOng(user.id);

        if (!userOng) {
            return res.status(404).render('404', { title: 'ONG nÃ£o encontrada' });
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
    });

    router.get('/:id', async (req, res) => {
        const ongId = parseInt(req.params.id, 10);
        const ong = (await data.getOngs()).find((item) => item.id === ongId);

        if (!ong) {
            return res.status(404).render('404', { title: 'ONG não encontrada' });
        }

        const denuncias = await data.getDenuncias();
        const ongResponses = denuncias.filter((denuncia) =>
            denuncia.responses.some((response) => response.ongId === ong.id)
        );

        res.render('ongs/detalhes', {
            title: `ONG: ${ong.name}`,
            ong: {
                ...ong,
                focus: ong.focus || ong.description
            },
            responses: ongResponses
        });
    });

    return router;
};

const router = createOngsRouter();

module.exports = router;
module.exports.createOngsRouter = createOngsRouter;
