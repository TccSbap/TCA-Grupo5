const express = require('express');
const { body } = require('express-validator');
const defaultData = require('../../data/database');
const { redirectIfLoggedIn } = require('../middleware/auth');
const { createAuthController } = require('../controllers/authController');

const createAuthRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createAuthController(data);

    router.get('/login', redirectIfLoggedIn, controller.loginPage);
    router.post('/login', [
        body('email', 'E-mail inválido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
        body('password', 'Senha é obrigatória').notEmpty()
    ], controller.login);
    router.get('/cadastro', redirectIfLoggedIn, controller.cadastroPage);
    router.post('/cadastro', [
        body('name', 'Nome Completo deve ter no mínimo 10 caracteres').isLength({ min: 10 }),
        body('email', 'E-mail inválido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
        body('password', 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('As senhas não coincidem');
            }
            return true;
        })
    ], controller.cadastro);
    router.get('/logout', controller.logout);

    return router;
};

const router = createAuthRouter();

module.exports = router;
module.exports.createAuthRouter = createAuthRouter;
