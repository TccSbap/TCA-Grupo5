const express = require('express');
const defaultData = require('../../data/database');
const { requireAdmin } = require('../middleware/auth');
const { createAdminController } = require('../controllers/adminController');

const createAdminRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createAdminController(data);

    router.get('/login', controller.loginPage);
    router.post('/login', controller.login);
    router.post('/dashboard', controller.login);
    router.get('/', requireAdmin, controller.dashboard);
    router.get('/dashboard_admin', requireAdmin, controller.dashboard);
    router.get('/denuncias', requireAdmin, controller.denuncias);
    router.get('/ongs', requireAdmin, controller.ongs);

    return router;
};

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
