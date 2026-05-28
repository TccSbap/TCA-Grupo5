const express = require('express');
const defaultData = require('../../data/database');
const { requireUser, requireOng } = require('../middleware/auth');
const { createDenunciasController } = require('../controllers/denunciasController');

const createDenunciasRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createDenunciasController(data);

    router.get('/', controller.index);
    router.get('/nova', requireUser, controller.nova);
    router.post('/nova', requireUser, controller.create);
    router.get('/:id', controller.details);
    router.post('/:id/responder', requireOng, controller.responder);
    router.post('/:id/status', requireOng, controller.updateStatus);

    return router;
};

const router = createDenunciasRouter();

module.exports = router;
module.exports.createDenunciasRouter = createDenunciasRouter;
