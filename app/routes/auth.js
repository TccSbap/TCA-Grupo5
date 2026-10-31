const express = require('express');
const { body } = require('express-validator');
const defaultData = require('../../data/database');
const { redirectIfLoggedIn, requireAuth } = require('../middleware/auth');
const { createLoginRateLimiter } = require('../middleware/rateLimit');
const { createAuthController } = require('../controllers/authController');

const createAuthRouter = (data = defaultData) => {
    const router = express.Router();
    const controller = createAuthController(data);
    const loginRateLimiter = createLoginRateLimiter();

    router.get('/login', redirectIfLoggedIn, controller.loginPage);
    router.post('/login', loginRateLimiter, [
        body('email', 'E-mail inválido.').isString().bail().isEmail(),
        body('password', 'Senha é obrigatória').isString().bail().notEmpty()
    ], controller.login);
    router.get('/alterar-senha', requireAuth, controller.changePasswordPage);
    router.post('/alterar-senha', requireAuth, [
        body('currentPassword', 'A senha atual é obrigatória.').isString().bail().notEmpty(),
        body('newPassword', 'A nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.')
            .isString().bail().isLength({ min: 8, max: 72 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
        body('confirmNewPassword').custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('A confirmação da nova senha não coincide.');
            }
            return true;
        })
    ], controller.changePassword);
    router.get('/cadastro', redirectIfLoggedIn, controller.cadastroPage);
    router.post('/cadastro', [
        body('name', 'Nome Completo deve ter no mínimo 10 caracteres').isString().bail().isLength({ min: 10, max: 150 }),
        body('email', 'E-mail inválido.').isString().bail().isEmail(),
        body('password', 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.')
            .isString().bail().isLength({ min: 8, max: 72 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('As senhas não coincidem');
            }
            return true;
        })
    ], controller.cadastro);
    router.post('/logout', controller.logout);
    router.get('/logout', (req, res) => res.redirect('/'));

    return router;
};

const router = createAuthRouter();

module.exports = router;
module.exports.createAuthRouter = createAuthRouter;
