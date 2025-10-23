const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getOngs, getDenuncias } = require('../data/database');

// Listar todas as ONGs
router.get('/', (req, res) => {
    const ongs = getOngs();
    
    res.render('ongs/index', {
        title: 'ONGs Parceiras',
        ongs
    });
});

// Página de detalhes de uma ONG
router.get('/:id', (req, res) => {
    const ongId = parseInt(req.params.id);
    const ongs = getOngs();
    const ong = ongs.find(o => o.id === ongId);
    
    if (!ong) {
        return res.status(404).render('404', { title: 'ONG não encontrada' });
    }
    
    // Buscar denúncias respondidas por esta ONG
    const denuncias = getDenuncias();
    const ongResponses = denuncias.filter(d => 
        d.responses.some(r => r.ongId === ong.userId)
    );
    
    res.render('ongs/detalhes', {
        title: `ONG: ${ong.name}`,
        ong,
        responses: ongResponses
    });
});

// Área administrativa da ONG (apenas para ONGs)
router.get('/admin/dashboard', requireAdmin, (req, res) => {
    const user = req.session.user;
    const ongs = getOngs();
    const userOng = ongs.find(o => o.userId === user.id);
    
    if (!userOng) {
        return res.status(404).render('404', { title: 'ONG não encontrada' });
    }
    
    // Buscar denúncias para responder
    const denuncias = getDenuncias();
    const pendingDenuncias = denuncias.filter(d => d.status === 'pendente');
    const respondedDenuncias = denuncias.filter(d => 
        d.responses.some(r => r.ongId === user.id)
    );
    
    res.render('ongs/admin', {
        title: 'Administração da ONG',
        ong: userOng,
        pendingDenuncias,
        respondedDenuncias
    });
});

// Dashboard de estatísticas para ONGs
router.get('/admin/stats', requireAdmin, (req, res) => {
    const user = req.session.user;
    const denuncias = getDenuncias();
    
    // Estatísticas da ONG
    const totalResponses = denuncias.reduce((count, d) => {
        return count + d.responses.filter(r => r.ongId === user.id).length;
    }, 0);
    
    const resolvedByOng = denuncias.filter(d => 
        d.status === 'resolvida' && d.responses.some(r => r.ongId === user.id)
    ).length;
    
    const pendingDenuncias = denuncias.filter(d => d.status === 'pendente').length;
    
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

module.exports = router;
