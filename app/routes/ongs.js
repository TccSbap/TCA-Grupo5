const express = require('express');
const defaultData = require('../../data/database');
const { requireAdmin } = require('../middleware/auth');
const { createOngsController } = require('../controllers/ongsController');

const createOngsRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createOngsController(data);

    router.get('/', controller.index);
    router.get('/admin/dashboard', requireAdmin, controller.adminDashboard);
    router.get('/admin/stats', requireAdmin, controller.stats);
    router.get('/:id', controller.details);

    return router;
};

const router = createOngsRouter();

module.exports = router;
module.exports.createOngsRouter = createOngsRouter;
