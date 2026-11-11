const crypto = require('crypto');
const express = require('express');
const { MercadoPagoConfig, OAuth } = require('mercadopago');
const { requireOng } = require('../middleware/auth');
const { encryptToken } = require('../utils/mercadoPagoTokens');
const {
    getMarketplaceConfiguration,
    syncOngDonationOrder
} = require('../services/mercadoPagoMarketplace');
const {
    getProjectConfiguration,
    syncProjectDonationOrder
} = require('../services/mercadoPagoProject');

const OAUTH_SESSION_KEY = 'mercadoPagoOAuthTransaction';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const constantTimeEquals = (first, second) => {
    if (typeof first !== 'string' || typeof second !== 'string' || first.length !== second.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(first), Buffer.from(second));
};

const getOAuthConfiguration = getMarketplaceConfiguration;

const isOAuthConfigured = () => {
    const config = getOAuthConfiguration();
    return Boolean(
        config.clientId && config.clientSecret && config.appAccessToken &&
        config.redirectUri && process.env.MP_TOKEN_ENCRYPTION_KEY
    );
};

const createMercadoPagoRouter = (data) => {
    const router = express.Router();

    router.get('/ongs/conectar', requireOng, async (req, res) => {
        const config = getOAuthConfiguration();
        if (!isOAuthConfigured()) {
            return res.redirect('/ongs/admin/dashboard?mercadopago=config-pendente');
        }

        if (
            typeof data.getOngByUserId !== 'function' ||
            typeof data.saveOngPaymentAccount !== 'function'
        ) {
            return res.redirect('/ongs/admin/dashboard?mercadopago=indisponivel');
        }

        const ong = await data.getOngByUserId(req.session.user.id);
        if (!ong) {
            return res.redirect('/ongs/admin/dashboard?mercadopago=ong-nao-encontrada');
        }

        const state = crypto.randomBytes(32).toString('base64url');
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        req.session[OAUTH_SESSION_KEY] = {
            state,
            ongId: ong.id,
            codeVerifier,
            expiresAt: Date.now() + OAUTH_STATE_TTL_MS
        };

        const oauth = new OAuth(new MercadoPagoConfig({ accessToken: config.appAccessToken }));
        const authorizationUrl = oauth.getAuthorizationURL({
            options: {
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256'
            }
        });

        return req.session.save((error) => {
            if (error) {
                console.error('Não foi possível salvar o estado OAuth do Mercado Pago.');
                return res.redirect('/ongs/admin/dashboard?mercadopago=erro');
            }

            return res.redirect(authorizationUrl);
        });
    });

    router.get('/oauth/callback', async (req, res) => {
        const transaction = req.session?.[OAUTH_SESSION_KEY];
        if (req.session) delete req.session[OAUTH_SESSION_KEY];

        if (req.query.error) {
            return res.redirect('/ongs/admin/dashboard?mercadopago=autorizacao-cancelada');
        }

        if (
            !transaction ||
            transaction.expiresAt < Date.now() ||
            !constantTimeEquals(transaction.state, String(req.query.state || '')) ||
            typeof req.query.code !== 'string' ||
            !req.session?.user ||
            req.session.user.type !== 'ong'
        ) {
            return res.redirect('/ongs/admin/dashboard?mercadopago=oauth-invalido');
        }

        const config = getOAuthConfiguration();
        if (!isOAuthConfigured() || typeof data.getOngByUserId !== 'function' || typeof data.saveOngPaymentAccount !== 'function') {
            return res.redirect('/ongs/admin/dashboard?mercadopago=config-pendente');
        }

        try {
            const ong = await data.getOngByUserId(req.session.user.id);
            if (!ong || Number(ong.id) !== Number(transaction.ongId)) {
                return res.redirect('/ongs/admin/dashboard?mercadopago=oauth-invalido');
            }

            const oauth = new OAuth(new MercadoPagoConfig({ accessToken: config.appAccessToken }));
            const tokenResponse = await oauth.create({
                body: {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code: req.query.code,
                    redirect_uri: config.redirectUri,
                    code_verifier: transaction.codeVerifier,
                    ...(config.testMode ? { test_token: 'true' } : {})
                },
                requestOptions: { timeout: 10000 }
            });

            if (!tokenResponse.access_token || !tokenResponse.refresh_token || !tokenResponse.user_id || !tokenResponse.expires_in) {
                throw new Error('Resposta OAuth do Mercado Pago incompleta.');
            }

            await data.saveOngPaymentAccount({
                ongId: ong.id,
                sellerUserId: tokenResponse.user_id,
                accessTokenEncrypted: encryptToken(tokenResponse.access_token),
                refreshTokenEncrypted: encryptToken(tokenResponse.refresh_token),
                expiresAt: new Date(Date.now() + Number(tokenResponse.expires_in) * 1000)
            });

            return res.redirect('/ongs/admin/dashboard?mercadopago=conectado');
        } catch (error) {
            console.error('Falha ao concluir a autorização OAuth do Mercado Pago.', error.name || 'Erro');
            return res.redirect('/ongs/admin/dashboard?mercadopago=erro');
        }
    });

    const createWebhookHandler = ({ getSecret, acceptedType, synchronize, description }) => (req, res) => {
        const webhookSecret = getSecret();
        if (!webhookSecret) return res.sendStatus(503);

        const signature = req.get('x-signature') || '';
        const requestId = req.get('x-request-id') || '';
        // The Mercado Pago signature manifest uses the data.id query parameter.
        // Use that signed ID for both validation and order synchronization.
        const dataId = String(req.query['data.id'] || '');
        const signatureParts = Object.fromEntries(signature.split(',').map((part) => {
            const [key, ...valueParts] = part.trim().split('=');
            return [key, valueParts.join('=')];
        }));
        const timestamp = signatureParts.ts;
        const signatureValue = signatureParts.v1;

        if (!dataId || !timestamp || !/^[a-f0-9]{64}$/i.test(signatureValue || '')) {
            return res.sendStatus(400);
        }

        const manifest = 'id:' + dataId + ';' +
            (requestId ? 'request-id:' + requestId + ';' : '') +
            'ts:' + timestamp + ';';
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(manifest)
            .digest('hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const receivedBuffer = Buffer.from(signatureValue, 'hex');
        if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
            return res.sendStatus(401);
        }

        res.sendStatus(200);
        const eventType = String(req.body?.type || req.query.type || req.query.topic || '').toLowerCase();
        if (eventType === acceptedType) {
            setImmediate(() => {
                synchronize({ data, dataId }).catch((error) => {
                    console.error('Falha ao sincronizar notifica??o ' + description + ' do Mercado Pago.', error.code || error.name || 'Erro');
                });
            });
        }
    };

    router.post('/webhook', createWebhookHandler({
        getSecret: () => getMarketplaceConfiguration().webhookSecret,
        acceptedType: 'order',
        synchronize: ({ data, dataId }) => syncOngDonationOrder({ data, orderId: dataId }),
        description: 'de order'
    }));

    router.post('/webhook/projeto', createWebhookHandler({
        getSecret: () => getProjectConfiguration().webhookSecret,
        acceptedType: 'order',
        synchronize: ({ data, dataId }) => syncProjectDonationOrder({ data, orderId: dataId }),
        description: 'de order do projeto'
    }));

    return router;
};

module.exports = { createMercadoPagoRouter, isOAuthConfigured };
