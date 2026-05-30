const rateLimit = require('express-rate-limit');

const createLoginRateLimiter = () => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
});

module.exports = {
    createLoginRateLimiter
};
