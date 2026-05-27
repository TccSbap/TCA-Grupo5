const express = require('express');
const defaultData = require('../data/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { createDenunciasController } = require('../controllers/denunciasController');

const createDenunciasRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createDenunciasController(data);

    router.get('/', controller.index);
    router.get('/nova', requireAuth, controller.nova);
    router.post('/nova', requireAuth, controller.create);
    router.get('/:id', controller.details);
    router.post('/:id/responder', requireAdmin, controller.responder);
    router.post('/:id/status', requireAdmin, controller.updateStatus);

    return router;
};

const router = createDenunciasRouter();

module.exports = router;
module.exports.createDenunciasRouter = createDenunciasRouter;
