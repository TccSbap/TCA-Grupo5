const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const defaultData = require('../data/database');
const { redirectIfLoggedIn } = require('../middleware/auth');

const createAuthRouter = (data = defaultData) => {
    const router = express.Router();

    router.get('/login', redirectIfLoggedIn, (req, res) => {
        res.render('auth/login', {
            title: 'Login',
            error: req.query.error,
            success: req.query.success
        });
    });

    router.post('/login', [
        body('email', 'E-mail invÃ¡lido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
        body('password', 'Senha Ã© obrigatÃ³ria').notEmpty()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array()[0].msg;
            return res.redirect('/auth/login?error=' + encodeURIComponent(firstError));
        }

        const { email, password } = req.body;
        const authenticatedUser = await data.authenticateUser(email, password);

        if (!authenticatedUser) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('E-mail ou senha invÃ¡lidos'));
        }

        req.session.user = authenticatedUser;
        return res.redirect(authenticatedUser.type !== 'user' ? '/admin/dashboard_admin' : '/dashboard');
    });

    router.get('/cadastro', redirectIfLoggedIn, (req, res) => {
        res.render('auth/cadastro', {
            title: 'Cadastro',
            error: req.query.error
        });
    });

    router.post('/cadastro', [
        body('name', 'Nome Completo deve ter no mÃ­nimo 10 caracteres').isLength({ min: 10 }),
        body('email', 'E-mail invÃ¡lido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
        body('password', 'A senha deve ter no mÃ­nimo 8 caracteres, uma letra maiÃºscula, uma minÃºscula e um nÃºmero.')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('As senhas nÃ£o coincidem');
            }
            return true;
        })
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array()[0].msg;
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent(firstError));
        }

        const { userType, ongName, ongDescription, ongContact } = req.body;
        const existingUser = await data.getUserByEmail(req.body.email);

        if (existingUser) {
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Já existe uma conta cadastrada com este e-mail'));
        }

        const isOngSignup = userType === 'admin' || userType === 'ong';

        if (isOngSignup) {
            if (!ongName || !ongDescription || !ongContact) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Preencha todos os campos da ONG'));
            }

            if (ongName.trim().length < 3) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Nome da ONG deve ter no mínimo 3 caracteres'));
            }

            if (ongDescription.trim().length < 10) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Descrição da ONG deve ter no mínimo 10 caracteres'));
            }

            const contactRegex = /@.+\.com$/;
            if (!contactRegex.test(ongContact)) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Email de contato da ONG inválido. Deve conter @ e terminar com .com'));
            }
        }

        const passwordHash = bcrypt.hashSync(req.body.password, 10);
        const normalizedUserType = isOngSignup ? 'ong' : 'user';

        try {
            const newUser = await data.createUser({
                name: req.body.name,
                email: req.body.email,
                password: passwordHash,
                type: normalizedUserType,
                ongName: isOngSignup ? ongName : null
            });

            if (isOngSignup && typeof data.createOng === 'function') {
                await data.createOng({
                    name: ongName,
                    description: ongDescription,
                    contact: ongContact,
                    phone: req.body.ongPhone || null,
                    address: req.body.ongAddress || null,
                    userId: newUser.id
                });
            }

            return res.redirect('/auth/login?success=' + encodeURIComponent('Cadastro realizado com sucesso. Faça login para continuar.'));
        } catch (error) {
            console.error('Erro ao salvar cadastro:', error);
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Não foi possível salvar o cadastro no banco de dados. Verifique a conexão e tente novamente.'));
        }
    });

    router.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao fazer logout:', err);
            }
            res.redirect('/');
        });
    });

    return router;
};

const router = createAuthRouter();

module.exports = router;
module.exports.createAuthRouter = createAuthRouter;
