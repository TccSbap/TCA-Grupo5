const express = require('express');
const defaultData = require('../../data/database');
const { requireAdmin } = require('../middleware/auth');
const { createLoginRateLimiter } = require('../middleware/rateLimit');
const { createAdminController } = require('../controllers/adminController');

const createAdminRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createAdminController(data);
    const loginRateLimiter = createLoginRateLimiter();

    router.get('/login', controller.loginPage);
    router.post('/login', loginRateLimiter, controller.login);
    router.post('/dashboard', loginRateLimiter, controller.login);
    router.get('/', requireAdmin, controller.dashboard);
    router.get('/relatorio.csv', requireAdmin, controller.report);
    router.get('/dashboard_admin', requireAdmin, (req, res) => res.redirect('/admin'));
    router.get('/denuncias', requireAdmin, controller.denuncias);
    router.get('/denuncias/:id', requireAdmin, controller.denunciaManagementPage);
    router.post('/denuncias/:id/status', requireAdmin, controller.updateDenunciaStatus);
    router.post('/denuncias/:id/responder', requireAdmin, controller.createDenunciaResponse);
    router.get('/denuncias/:id/editar', requireAdmin, controller.denunciaEditPage);
    router.post('/denuncias/:id/editar', requireAdmin, controller.updateDenuncia);
    router.post('/denuncias/:id/excluir', requireAdmin, controller.deleteDenuncia);
    router.get('/ongs', requireAdmin, controller.ongs);
    router.get('/ongs/:id/editar', requireAdmin, controller.ongEditPage);
    router.post('/ongs/:id/editar', requireAdmin, controller.updateOng);
    router.post('/ongs/:id/excluir', requireAdmin, controller.deactivateOng);
    router.post('/ongs/:id/reativar', requireAdmin, controller.reactivateOng);

    return router;
};

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
