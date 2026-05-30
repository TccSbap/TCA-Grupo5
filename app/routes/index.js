const express = require('express');
const defaultData = require('../../data/database');
const { requireUser } = require('../middleware/auth');
const {
    createIndexController
} = require('../controllers/indexController');

const createIndexRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createIndexController(data);

    router.get('/', controller.home);
    router.get('/dashboard', requireUser, controller.dashboard);
    router.get('/sobre', controller.sobre);
    router.get('/contato', controller.contato);
    router.post('/contato', controller.submitContato);
    router.get('/privacidade', controller.privacidade);
    router.get('/lgpd', controller.privacidade);
    router.post('/cookies/consent', controller.setCookieConsent);
    router.post('/cookies/consent/reset', controller.resetCookieConsent);
    router.get('/doacoes/:ongId/doar', controller.donateForm);
    router.post('/doar', controller.donate);
    router.get('/doacoes', controller.doacoes);
    router.get('/planos/:planoId/assinar', controller.planForm);
    router.post('/assinar-plano', controller.subscribePlan);
    router.get('/planos', controller.planos);
    router.get('/noticias', controller.noticias);
    router.get('/impacto', controller.impacto);
    router.get('/impacto/relatorio.csv', controller.impactoCsv);

    return router;
};

const router = createIndexRouter();

module.exports = router;
module.exports.createIndexRouter = createIndexRouter;
