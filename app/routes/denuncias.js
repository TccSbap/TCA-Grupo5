const express = require('express');
const defaultData = require('../../data/database');
const { requireUser, requireOng } = require('../middleware/auth');
const { createDenunciasController } = require('../controllers/denunciasController');
const { lookupViaCep } = require('../utils/cep');

const createDenunciasRouter = (data = defaultData, dependencies = {}) => {
    const router = express.Router();
    const controller = createDenunciasController(data);
    const lookupCep = dependencies.lookupCep || lookupViaCep;

    router.get('/', controller.index);
    router.get('/nova', requireUser, controller.nova);
    router.post('/nova', requireUser, controller.create);
    router.get('/cep/:cep', async (req, res) => {
        const cep = String(req.params.cep || '').replace(/\D/g, '');

        if (cep.length !== 8) {
            return res.status(400).json({ error: 'CEP invalido. Use 8 digitos numericos.' });
        }

        try {
            const address = await lookupCep(cep);

            if (!address || address.erro) {
                return res.status(404).json({ error: 'CEP nao encontrado.' });
            }

            return res.json({
                cep: address.cep || cep,
                logradouro: address.logradouro || '',
                bairro: address.bairro || '',
                localidade: address.localidade || '',
                uf: address.uf || ''
            });
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return res.status(502).json({ error: 'Nao foi possivel buscar o CEP no momento.' });
        }
    });
    router.get('/:id', controller.details);
    router.post('/:id/responder', requireOng, controller.responder);
    router.post('/:id/status', requireOng, controller.updateStatus);

    return router;
};

const router = createDenunciasRouter();

module.exports = router;
module.exports.createDenunciasRouter = createDenunciasRouter;
