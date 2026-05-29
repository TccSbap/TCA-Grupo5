const COOKIE_CONSENT_COOKIE_NAME = 'ods6_cookie_consent';
const COOKIE_CONSENT_ACCEPTED = 'accepted';
const COOKIE_CONSENT_REJECTED = 'rejected';
const COOKIE_CONSENT_VALUES = new Set([
    COOKIE_CONSENT_ACCEPTED,
    COOKIE_CONSENT_REJECTED
]);

const isSecureRequest = (req) => req.secure || req.get('x-forwarded-proto') === 'https';

const getCookieConsent = (req) => {
    const value = req.cookies?.[COOKIE_CONSENT_COOKIE_NAME];
    return COOKIE_CONSENT_VALUES.has(value) ? value : null;
};

const getCookieConsentOptions = (req) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
    maxAge: 365 * 24 * 60 * 60 * 1000
});

const getClearCookieConsentOptions = (req) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/'
});

const normalizeReturnTo = (value) => {
    if (typeof value !== 'string' || !value.startsWith('/')) {
        return '/';
    }

    return value;
};

module.exports = {
    COOKIE_CONSENT_ACCEPTED,
    COOKIE_CONSENT_COOKIE_NAME,
    COOKIE_CONSENT_REJECTED,
    getClearCookieConsentOptions,
    getCookieConsent,
    getCookieConsentOptions,
    normalizeReturnTo
};
