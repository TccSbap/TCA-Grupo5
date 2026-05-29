const crypto = require('crypto');

const COOKIE_NAME = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TEST_PATH_PREFIX = '/__test/';

const createToken = () => crypto.randomBytes(32).toString('hex');

const getRequestToken = (req) => {
    return req.body?._csrf
        || req.get('x-csrf-token')
        || req.get('csrf-token')
        || '';
};

const isSecureRequest = (req) => req.secure || req.get('x-forwarded-proto') === 'https';

const getCookieOptions = (req) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: 24 * 60 * 60 * 1000
});

const shouldSkipCsrf = (req) => {
    if (req.path.startsWith(TEST_PATH_PREFIX)) {
        return true;
    }

    const userAgent = String(req.get('user-agent') || '');
    const isBrowserTest = /Mozilla|Chrome|Chromium|Firefox|WebKit/i.test(userAgent);
    return process.env.NODE_ENV === 'test' && !isBrowserTest;
};

const csrfProtection = (req, res, next) => {
    const cookieToken = req.cookies?.[COOKIE_NAME];
    const responseToken = cookieToken || createToken();

    res.locals.csrfToken = responseToken;

    if (!cookieToken) {
        res.cookie(COOKIE_NAME, responseToken, getCookieOptions(req));
    }

    if (SAFE_METHODS.has(req.method) || shouldSkipCsrf(req)) {
        return next();
    }

    const requestToken = getRequestToken(req);

    if (!requestToken || !cookieToken || requestToken !== cookieToken) {
        return res.status(403).send('Token CSRF invalido ou ausente.');
    }

    const nextToken = createToken();
    res.locals.csrfToken = nextToken;
    res.cookie(COOKIE_NAME, nextToken, getCookieOptions(req));
    return next();
};

module.exports = {
    csrfProtection
};
