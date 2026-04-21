// Middleware para verificar se o usuário está logado
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware para verificar se o usuário é admin (ONG)
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.status(403).render('403', { 
            title: 'Acesso Negado',
            message: 'Você precisa ser uma ONG para acessar esta área.'
        });
    }
    next();
};

// Middleware para redirecionar usuários logados
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return res.redirect(req.session.user.type === 'admin' ? '/admin/dashboard_admin' : '/dashboard');
    }
    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    redirectIfLoggedIn
};
