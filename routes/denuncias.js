const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getDenuncias, createDenuncia, getDenunciaById, updateDenuncia } = require('../data/database');

// Listar todas as denúncias
router.get('/', (req, res) => {
    const denuncias = getDenuncias();
    const status = req.query.status;
    
    let filteredDenuncias = denuncias;
    if (status) {
        filteredDenuncias = denuncias.filter(d => d.status === status);
    }
    
    res.render('denuncias/index', {
        title: 'Denúncias',
        denuncias: filteredDenuncias,
        currentStatus: status
    });
});

// Formulário para nova denúncia - APENAS ILUSTRATIVO
router.get('/nova', (req, res) => {
    // Removido requireAuth - permite acesso sem login
    res.render('denuncias/nova', {
        title: 'Nova Denúncia',
        error: req.query.error,
        success: req.query.success
    });
});

// Processar nova denúncia - APENAS VALIDAÇÃO, SEM PERSISTÊNCIA
router.post('/nova', (req, res) => {
    const { title, description, location, category } = req.body;
    
    try {
        // Validações
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

        // Validação bem-sucedida, mas NÃO persiste a denúncia
        return res.redirect('/denuncias/nova?success=Validação concluída! Esta é uma página demonstrativa sem persistência de dados.');
        
    } catch (error) {
        console.error('Erro ao validar denúncia:', error);
        res.redirect('/denuncias/nova?error=Erro ao validar denúncia');
    }
});

// Ver detalhes de uma denúncia
router.get('/:id', (req, res) => {
    const denunciaId = req.params.id;
    const denuncia = getDenunciaById(denunciaId);
    
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

// Responder a uma denúncia (apenas ONGs)
router.post('/:id/responder', requireAdmin, (req, res) => {
    const denunciaId = req.params.id;
    const { response, newStatus } = req.body;
    const user = req.session.user;
    
    try {
        const denuncia = getDenunciaById(denunciaId);
        
        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        // Adicionar resposta
        const newResponse = {
            id: denuncia.responses.length + 1,
            text: response,
            ongName: user.ongName,
            ongId: user.id,
            createdAt: new Date().toISOString()
        };
        
        denuncia.responses.push(newResponse);
        
        // Atualizar status se fornecido
        if (newStatus) {
            denuncia.status = newStatus;
        }
        
        updateDenuncia(denunciaId, denuncia);
        
        res.redirect(`/denuncias/${denunciaId}?success=Resposta adicionada com sucesso!`);
    } catch (error) {
        console.error('Erro ao responder denúncia:', error);
        res.redirect(`/denuncias/${denunciaId}?error=Erro ao adicionar resposta`);
    }
});

// Atualizar status de uma denúncia (apenas ONGs)
router.post('/:id/status', requireAdmin, (req, res) => {
    const denunciaId = req.params.id;
    const { status } = req.body;
    
    try {
        const denuncia = getDenunciaById(denunciaId);
        
        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        updateDenuncia(denunciaId, { status });
        
        res.redirect(`/denuncias/${denunciaId}?success=Status atualizado com sucesso!`);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.redirect(`/denuncias/${denunciaId}?error=Erro ao atualizar status`);
    }
});

module.exports = router;
