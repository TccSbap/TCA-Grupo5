const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { toSessionUser } = require('../middleware/sessionUser');

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');
const regenerateSession = (req) => new Promise((resolve, reject) => {
    if (!req.session || typeof req.session.regenerate !== 'function') {
        resolve();
        return;
    }

    req.session.regenerate((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

const destroySession = (req) => new Promise((resolve, reject) => {
    if (!req.session || typeof req.session.destroy !== 'function') {
        resolve();
        return;
    }

    req.session.destroy((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

const isValidTelefone = (telefone) => {
    const digits = normalizeDigits(telefone);
    return digits.length === 10 || digits.length === 11;
};

const isValidCnpj = (cnpj) => {
    const digits = normalizeDigits(cnpj);

    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
        return false;
    }

    const calculateDigit = (base, weights) => base
        .split('')
        .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);

    const firstDigitRest = calculateDigit(
        digits.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    ) % 11;
    const firstDigit = firstDigitRest < 2 ? 0 : 11 - firstDigitRest;

    const secondDigitRest = calculateDigit(
        digits.slice(0, 13),
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    ) % 11;
    const secondDigit = secondDigitRest < 2 ? 0 : 11 - secondDigitRest;

    return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
};

const isValidRg = (rg) => {
    const digits = normalizeDigits(rg);
    return digits.length === 9 && !/^(\d)\1{8}$/.test(digits);
};

const createAuthController = (data) => ({
    loginPage(req, res) {
        res.render('auth/login', {
            title: 'Login',
            error: req.query.error,
            success: req.query.success
        });
    },

    changePasswordPage(req, res) {
        res.render('auth/alterar-senha', {
            title: 'Alterar senha',
            error: req.query.error,
            success: req.query.success,
            user: req.session.user
        });
    },

    async login(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array()[0].msg;
            return res.redirect('/auth/login?error=' + encodeURIComponent(firstError));
        }

        const { email, password } = req.body;
        const authenticatedUser = await data.authenticateUser(email, password);

        if (!authenticatedUser) {
            return res.redirect('/auth/login?error=' + encodeURIComponent('E-mail ou senha inválidos'));
        }

        try {
            await regenerateSession(req);
        } catch (error) {
            console.error('Erro ao regenerar sessão durante o login:', error);
            return res.redirect('/auth/login?error=' + encodeURIComponent('Não foi possível iniciar sua sessão. Tente novamente.'));
        }

        req.session.user = toSessionUser(authenticatedUser);
        if (req.session.user.type === 'admin') {
            return res.redirect('/admin');
        }

        if (req.session.user.type === 'ong') {
            return res.redirect('/ongs/admin/dashboard');
        }

        return res.redirect('/');
    },

    async changePassword(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array()[0].msg;
            return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent(firstError));
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user && req.session.user.id;

        try {
            const storedUser = await data.getUserById(userId);

            if (!storedUser || !storedUser.password) {
                return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent('Não foi possível validar sua senha atual.'));
            }

            if (!bcrypt.compareSync(currentPassword, storedUser.password)) {
                return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent('Senha atual inválida.'));
            }

            if (currentPassword === newPassword) {
                return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent('A nova senha deve ser diferente da senha atual.'));
            }

            const newPasswordHash = bcrypt.hashSync(newPassword, 10);
            const updated = await data.updateUserPassword(userId, newPasswordHash);

            if (!updated) {
                return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent('Não foi possível atualizar sua senha. Tente novamente.'));
            }

            try {
                await destroySession(req);
            } catch (destroyError) {
                console.error('Erro ao encerrar sessão após troca de senha:', destroyError);
            }

            res.clearCookie('connect.sid');
            return res.redirect('/auth/login?success=' + encodeURIComponent('Senha alterada com sucesso. Faça login novamente.'));
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return res.redirect('/auth/alterar-senha?error=' + encodeURIComponent('Não foi possível alterar sua senha.'));
        }
    },

    cadastroPage(req, res) {
        res.render('auth/cadastro', {
            title: 'Cadastro',
            error: req.query.error
        });
    },

    async cadastro(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array()[0].msg;
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent(firstError));
        }

        const {
            userType,
            ongName,
            ongDescription,
            ongContact,
            ongCnpj,
            ongRg,
            ongPhone,
            ongAddress
        } = req.body;
        const existingUser = await data.getUserByEmail(req.body.email);

        if (existingUser) {
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Já existe uma conta cadastrada com este e-mail'));
        }

        const isOngSignup = userType === 'admin' || userType === 'ong';

        if (isOngSignup) {
            const trimmedOngName = String(ongName || '').trim();
            const trimmedOngDescription = String(ongDescription || '').trim();
            const trimmedOngContact = String(ongContact || '').trim();
            const trimmedOngCnpj = String(ongCnpj || '').trim();
            const trimmedOngRg = String(ongRg || '').trim();
            const trimmedOngPhone = String(ongPhone || '').trim();
            const trimmedOngAddress = String(ongAddress || '').trim();

            if (!trimmedOngName || !trimmedOngDescription || !trimmedOngContact || !trimmedOngCnpj || !trimmedOngRg) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Preencha todos os campos da ONG'));
            }

            if (trimmedOngName.length < 3) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Nome da ONG deve ter no mínimo 3 caracteres'));
            }

            if (trimmedOngDescription.length < 10) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Descrição da ONG deve ter no mínimo 10 caracteres'));
            }

            const contactRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!contactRegex.test(trimmedOngContact)) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('O e-mail de contato da ONG deve ser válido.'));
            }

            if (!isValidCnpj(trimmedOngCnpj)) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('CNPJ da ONG inválido.'));
            }

            if (!isValidRg(trimmedOngRg)) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('RG do responsável inválido.'));
            }

            if (trimmedOngPhone && !isValidTelefone(trimmedOngPhone)) {
                return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Telefone da ONG inválido. Use 10 ou 11 dígitos numéricos.'));
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
                    name: String(ongName || '').trim(),
                    description: String(ongDescription || '').trim(),
                    contact: String(ongContact || '').trim(),
                    cnpj: String(ongCnpj || '').trim(),
                    rg: String(ongRg || '').trim(),
                    phone: String(ongPhone || '').trim() || null,
                    address: String(ongAddress || '').trim() || null,
                    userId: newUser.id
                });
            }

            return res.redirect('/auth/login?success=' + encodeURIComponent('Cadastro realizado com sucesso. Faça login para continuar.'));
        } catch (error) {
            console.error('Erro ao salvar cadastro:', error);
            return res.redirect('/auth/cadastro?error=' + encodeURIComponent('Não foi possível salvar o cadastro no banco de dados. Verifique a conexão e tente novamente.'));
        }
    },

    logout(req, res) {
        destroySession(req)
            .catch((err) => {
                console.error('Erro ao fazer logout:', err);
            })
            .finally(() => {
                res.clearCookie('connect.sid');
                res.redirect('/');
            });
    }
});

module.exports = {
    createAuthController
};
