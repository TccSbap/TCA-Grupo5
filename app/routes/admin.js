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
    router.get('/ongs', requireAdmin, controller.ongs);

    return router;
};

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
