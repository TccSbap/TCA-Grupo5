// Middleware para verificar se o usuário está logado
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    next();
};

const getUserRole = (user) => {
    if (!user) {
        return null;
    }

    if (user.type === 'admin') {
        return 'admin';
    }

    if (user.type === 'ong') {
        return 'ong';
    }

    return 'user';
};

const getDashboardPathForUser = (user) => {
    switch (getUserRole(user)) {
        case 'admin':
            return '/admin';
        case 'ong':
            return '/ongs/admin/dashboard';
        default:
            return '/dashboard';
    }
};

const getDashboardLabelForUser = (user) => {
    switch (getUserRole(user)) {
        case 'admin':
            return 'Painel Administrativo';
        case 'ong':
            return 'Painel da ONG';
        default:
            return 'Meu Dashboard';
    }
};

const requireRole = (role, message) => (req, res, next) => {
    const user = req.session.user;

    if (!user) {
        return res.redirect('/auth/login');
    }

    if (getUserRole(user) !== role) {
        return res.redirect(getDashboardPathForUser(user));
    }

    next();
};

const requireUser = requireRole('user');
const requireOng = requireRole('ong');
const requireAdmin = requireRole('admin');

// Middleware para redirecionar usuários logados
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return res.redirect(getDashboardPathForUser(req.session.user));
    }

    next();
};

module.exports = {
    getDashboardLabelForUser,
    getDashboardPathForUser,
    getUserRole,
    requireAuth,
    requireAdmin,
    requireOng,
    requireUser,
    redirectIfLoggedIn
};
