const { MercadoPagoConfig, OAuth, Order } = require('mercadopago');
const { decryptToken, encryptToken } = require('../utils/mercadoPagoTokens');

const getMarketplaceConfiguration = () => ({
    clientId: process.env.MP_MARKETPLACE_CLIENT_ID,
    clientSecret: process.env.MP_MARKETPLACE_CLIENT_SECRET,
    appAccessToken: process.env.MP_MARKETPLACE_APP_ACCESS_TOKEN,
    redirectUri: process.env.MP_MARKETPLACE_OAUTH_REDIRECT_URI,
    webhookSecret: process.env.MP_MARKETPLACE_WEBHOOK_SECRET,
    testMode: process.env.MP_MARKETPLACE_TEST_MODE !== 'false'
});

const isMarketplaceCheckoutConfigured = () => {
    const config = getMarketplaceConfiguration();
    return Boolean(
        config.clientId && config.clientSecret && config.appAccessToken &&
        config.redirectUri && config.webhookSecret && process.env.MP_TOKEN_ENCRYPTION_KEY
    );
};

const getPublicAppUrl = () => {
    const configuredUrl = process.env.APP_URL
        || process.env.SITE_URL
        || process.env.RENDER_EXTERNAL_URL
        || 'http://localhost:3000';

    return configuredUrl.replace(/\/+$/, '');
};

const getOngAccessToken = async (data, ongId) => {
    if (typeof data.getOngPaymentCredentials !== 'function') {
        throw new Error('ONG_MERCADO_PAGO_UNAVAILABLE');
    }

    const credentials = await data.getOngPaymentCredentials(ongId);
    if (!credentials) throw new Error('ONG_MERCADO_PAGO_NOT_CONNECTED');

    let accessToken = decryptToken(credentials.accessTokenEncrypted);
    const expiresAt = new Date(credentials.expiresAt).getTime();
    if (!Number.isFinite(expiresAt)) throw new Error('ONG_MERCADO_PAGO_RECONNECT_REQUIRED');

    if (expiresAt <= Date.now() + 5 * 60 * 1000) {
        const config = getMarketplaceConfiguration();
        const refreshToken = decryptToken(credentials.refreshTokenEncrypted);
        const oauth = new OAuth(new MercadoPagoConfig({
            accessToken: config.appAccessToken,
            options: { timeout: 10000 }
        }));
        const refreshed = await oauth.refresh({
            body: {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                refresh_token: refreshToken,
                ...(config.testMode ? { test_token: 'true' } : {})
            },
            requestOptions: { timeout: 10000 }
        });

        if (!refreshed.access_token || !refreshed.refresh_token || !refreshed.expires_in) {
            throw new Error('ONG_MERCADO_PAGO_RECONNECT_REQUIRED');
        }
        if (refreshed.user_id && String(refreshed.user_id) !== String(credentials.sellerUserId)) {
            throw new Error('ONG_MERCADO_PAGO_RECONNECT_REQUIRED');
        }

        accessToken = refreshed.access_token;
        await data.updateOngPaymentTokens({
            ongId,
            accessTokenEncrypted: encryptToken(refreshed.access_token),
            refreshTokenEncrypted: encryptToken(refreshed.refresh_token),
            expiresAt: new Date(Date.now() + Number(refreshed.expires_in) * 1000)
        });
    }

    return { accessToken, sellerUserId: String(credentials.sellerUserId) };
};

const createOngDonationOrder = async ({ data, ong, donation }) => {
    const { accessToken, sellerUserId } = await getOngAccessToken(data, ong.id);
    const orderClient = new Order(new MercadoPagoConfig({
        accessToken,
        options: { timeout: 10000 }
    }));
    const amount = Number(donation.amount).toFixed(2);
    const baseUrl = getPublicAppUrl();
    const returnUrl = `${baseUrl}/doacoes?retorno=mp`;
    const donorName = String(donation.donorName || '').trim().split(/\s+/);
    const description = `Doação para ${ong.name}`.slice(0, 250);

    const order = await orderClient.create({
        body: {
            type: 'online',
            processing_mode: 'manual',
            capture_mode: 'automatic_async',
            total_amount: amount,
            external_reference: `doacao-${donation.id}`,
            description,
            payer: {
                email: donation.donorEmail,
                ...(donorName[0] ? { first_name: donorName[0] } : {}),
                ...(donorName.length > 1 ? { last_name: donorName.slice(1).join(' ') } : {})
            },
            items: [{
                title: description,
                quantity: 1,
                unit_price: amount
            }],
            config: {
                online: {
                    success_url: returnUrl,
                    pending_url: returnUrl,
                    failure_url: returnUrl
                }
            }
        },
        requestOptions: { idempotencyKey: require('crypto').randomUUID() }
    });

    if (!order.id || !order.checkout_url || String(order.user_id) !== sellerUserId) {
        throw new Error('MERCADO_PAGO_ORDER_RESPONSE_INVALID');
    }

    const checkoutUrl = new URL(order.checkout_url);
    if (
        checkoutUrl.protocol !== 'https:' ||
        !['mercadopago.com.br', 'www.mercadopago.com.br'].includes(checkoutUrl.hostname)
    ) {
        throw new Error('MERCADO_PAGO_CHECKOUT_URL_INVALID');
    }

    return {
        orderId: String(order.id),
        checkoutUrl: checkoutUrl.toString(),
        status: String(order.status || 'created')
    };
};

const syncOngDonationOrder = async ({ data, orderId }) => {
    if (typeof data.getDoacaoByMercadoPagoOrderId !== 'function') return;
    const donation = await data.getDoacaoByMercadoPagoOrderId(orderId);
    if (!donation || donation.recipientType !== 'ong') return;

    const { accessToken, sellerUserId } = await getOngAccessToken(data, donation.ongId);
    const orderClient = new Order(new MercadoPagoConfig({
        accessToken,
        options: { timeout: 10000 }
    }));
    const order = await orderClient.get({ id: orderId, requestOptions: { timeout: 10000 } });

    if (
        String(order.id) !== String(orderId) ||
        String(order.user_id) !== sellerUserId ||
        String(order.external_reference) !== `doacao-${donation.id}`
    ) {
        return;
    }

    const providerStatus = String(order.status || 'unknown').toLowerCase();
    const donationStatus = providerStatus === 'processed'
        ? (String(order.status_detail || '').toLowerCase() === 'partially_refunded' ? 'parcialmente_reembolsada' : 'confirmada')
        : providerStatus === 'charged_back'
            ? 'contestada'
        : ['canceled', 'cancelled', 'expired', 'failed', 'refunded'].includes(providerStatus)
            ? (providerStatus === 'refunded' ? 'reembolsada' : 'cancelada')
            : 'pendente';
    const payments = order.transactions && Array.isArray(order.transactions.payments)
        ? order.transactions.payments
        : [];
    const payment = payments.find((item) => item.status === 'processed') || payments[0];
    const paymentType = String(payment?.payment_method?.type || '').toLowerCase();
    const paymentIdFromProvider = String(payment?.payment_method?.id || '').toLowerCase();
    const paymentMethod = ['credit_card', 'debit_card', 'prepaid_card'].includes(paymentType)
        ? 'cartao'
        : paymentType === 'ticket'
            ? 'boleto'
            : paymentType === 'bank_transfer' || paymentIdFromProvider === 'pix'
                ? 'pix'
                : null;

    await data.updateDoacaoMercadoPagoStatus({
        donationId: donation.id,
        orderId,
        paymentId: payment && payment.id ? String(payment.id) : null,
        paymentMethod,
        providerStatus,
        donationStatus
    });
};

module.exports = {
    createOngDonationOrder,
    getMarketplaceConfiguration,
    getOngAccessToken,
    getPublicAppUrl,
    isMarketplaceCheckoutConfigured,
    syncOngDonationOrder
};
