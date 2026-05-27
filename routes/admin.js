const express = require('express');
const defaultData = require('../data/database');
const { createAdminController } = require('../controllers/adminController');

const createAdminRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createAdminController(data);

    router.get('/login', controller.loginPage);
    router.post('/dashboard', controller.login);
    router.get('/', controller.dashboard);
    router.get('/dashboard_admin', controller.dashboard);
    router.get('/denuncias', controller.denuncias);
    router.get('/ongs', controller.ongs);

    return router;
};

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
