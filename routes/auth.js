const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { redirectIfLoggedIn } = require('../middleware/auth');
const { getUserByEmail, createUser, createOng } = require('../data/database');

// Página de login
router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        error: req.query.error
    });
});

// Processar login - APENAS VALIDAÇÃO, SEM PERSISTÊNCIA
router.post('/login', [
    // Validação de e-mail (Geral)
    body('email', 'E-mail inválido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
    // Validação de senha (apenas obrigatório para login)
    body('password', 'Senha é obrigatória').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.redirect('/auth/login?error=' + encodeURIComponent(firstError));
    }
    
    // Simulação de login bem-sucedido
    // A lógica de autenticação real (getUserByEmail, bcrypt.compare) está comentada ou simulada neste projeto
    
    // Validação bem-sucedida, redireciona para a página de login sem mensagem
    return res.redirect('/auth/login');
});

// Página de cadastro
router.get('/cadastro', redirectIfLoggedIn, (req, res) => {
    res.render('auth/cadastro', {
        title: 'Cadastro',
        error: req.query.error
    });
});

// Processar cadastro - APENAS VALIDAÇÃO, SEM PERSISTÊNCIA
router.post('/cadastro', [
    // Validação de Nome Completo (Geral)
    body('name', 'Nome Completo deve ter no mínimo 10 caracteres').isLength({ min: 10 }),
    // Validação de E-mail (Geral)
    body('email', 'E-mail inválido. Deve conter @ e terminar com .com').isEmail().matches(/@.+\.com$/),
    // Validação de Senha (Cadastro)
    body('password', 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
    // Validação de Confirmação de Senha (Cadastro)
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('As senhas não coincidem');
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

    // Validações adicionais para ONG (se userType for 'admin')
    if (userType === 'admin') {
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
    
    // Validação bem-sucedida, redireciona para a página de cadastro sem mensagem
    return res.redirect('/auth/cadastro');
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao fazer logout:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
