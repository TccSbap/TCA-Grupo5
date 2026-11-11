const crypto = require('crypto');
const { MercadoPagoConfig, Order } = require('mercadopago');
const { getPublicAppUrl } = require('./mercadoPagoMarketplace');

const getProjectConfiguration = () => ({
    accessToken: process.env.MP_PROJECT_ACCESS_TOKEN,
    webhookSecret: process.env.MP_PROJECT_WEBHOOK_SECRET
});

const isProjectCheckoutConfigured = () => {
    const config = getProjectConfiguration();
    return Boolean(config.accessToken && config.webhookSecret);
};

const isMercadoPagoCheckoutUrl = (value) => {
    try {
        const checkoutUrl = new URL(value);
        return checkoutUrl.protocol === 'https:' && (
            checkoutUrl.hostname === 'mercadopago.com.br' ||
            checkoutUrl.hostname.endsWith('.mercadopago.com.br') ||
            checkoutUrl.hostname === 'mercadopago.com' ||
            checkoutUrl.hostname.endsWith('.mercadopago.com')
        );
    } catch (error) {
        return false;
    }
};

const createProjectDonationOrder = async ({ donation }) => {
    const config = getProjectConfiguration();
    if (!config.accessToken || !config.webhookSecret) {
        throw new Error('PROJECT_MERCADO_PAGO_NOT_CONFIGURED');
    }

    const amount = Number(donation.amount).toFixed(2);
    const baseUrl = getPublicAppUrl();
    const returnUrl = `${baseUrl}/doacoes?retorno=mp`;
    const names = String(donation.donorName || '').trim().split(/\s+/);
    const description = 'Doação para o projeto Água Consciente';
    const orderClient = new Order(new MercadoPagoConfig({
        accessToken: config.accessToken,
        options: { timeout: 10000 }
    }));
    const order = await orderClient.create({
        body: {
            type: 'online',
            processing_mode: 'manual',
            capture_mode: 'automatic_async',
            total_amount: amount,
            external_reference: `doacao-projeto-${donation.id}`,
            description,
            payer: {
                email: donation.donorEmail,
                ...(names[0] ? { first_name: names[0] } : {}),
                ...(names.length > 1 ? { last_name: names.slice(1).join(' ') } : {})
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
        requestOptions: { idempotencyKey: crypto.randomUUID() }
    });

    if (
        !order.id ||
        !order.checkout_url ||
        String(order.external_reference) !== `doacao-projeto-${donation.id}` ||
        !isMercadoPagoCheckoutUrl(order.checkout_url)
    ) {
        throw new Error('PROJECT_MERCADO_PAGO_ORDER_RESPONSE_INVALID');
    }

    return {
        orderId: String(order.id),
        checkoutUrl: new URL(order.checkout_url).toString(),
        status: String(order.status || 'created')
    };
};

const getProjectDonationStatus = (providerStatus, providerStatusDetail) => {
    const status = String(providerStatus || '').toLowerCase();
    const statusDetail = String(providerStatusDetail || '').toLowerCase();
    if (status === 'processed') {
        return statusDetail === 'partially_refunded' ? 'parcialmente_reembolsada' : 'confirmada';
    }
    if (status === 'refunded') return 'reembolsada';
    if (status === 'charged_back') return 'contestada';
    if (['canceled', 'cancelled', 'expired', 'failed'].includes(status)) return 'cancelada';
    return 'pendente';
};

const getOrderPaymentMethod = (payment) => {
    const paymentType = String(payment?.payment_method?.type || '').toLowerCase();
    const paymentMethodId = String(payment?.payment_method?.id || '').toLowerCase();
    if (paymentType === 'bank_transfer' || paymentMethodId === 'pix') return 'pix';
    if (paymentType === 'ticket') return 'boleto';
    if (['credit_card', 'debit_card', 'prepaid_card'].includes(paymentType)) return 'cartao';
    return null;
};

const syncProjectDonationOrder = async ({ data, orderId }) => {
    const config = getProjectConfiguration();
    if (!config.accessToken || typeof data.getDoacaoByMercadoPagoOrderId !== 'function') return;

    const donation = await data.getDoacaoByMercadoPagoOrderId(orderId);
    if (!donation || donation.recipientType !== 'projeto') return;

    const orderClient = new Order(new MercadoPagoConfig({
        accessToken: config.accessToken,
        options: { timeout: 10000 }
    }));
    const order = await orderClient.get({ id: orderId, requestOptions: { timeout: 10000 } });
    if (
        String(order.id) !== String(orderId) ||
        String(order.external_reference) !== `doacao-projeto-${donation.id}` ||
        String(order.currency || '').toUpperCase() !== 'BRL' ||
        Number(order.total_amount).toFixed(2) !== Number(donation.amount).toFixed(2)
    ) return;

    const providerStatus = String(order.status || 'unknown').toLowerCase();
    const donationStatus = getProjectDonationStatus(providerStatus, order.status_detail);
    const payments = order.transactions && Array.isArray(order.transactions.payments)
        ? order.transactions.payments
        : [];
    const payment = payments.find((item) => item.status === 'processed') || payments[0];
    const paymentId = payment?.id ? String(payment.id) : null;
    const currentPaymentId = donation.mercadoPagoPaymentId ? String(donation.mercadoPagoPaymentId) : null;

    if (
        ['confirmada', 'reembolsada', 'parcialmente_reembolsada', 'contestada'].includes(donation.status) &&
        ['pendente', 'cancelada'].includes(donationStatus) &&
        currentPaymentId !== paymentId
    ) return;
    if (
        ['reembolsada', 'parcialmente_reembolsada', 'contestada'].includes(donationStatus) &&
        currentPaymentId && currentPaymentId !== paymentId
    ) return;

    await data.updateProjectDoacaoMercadoPagoOrderStatus({
        donationId: donation.id,
        orderId,
        paymentId,
        paymentMethod: getOrderPaymentMethod(payment),
        providerStatus,
        donationStatus
    });
};

module.exports = {
    createProjectDonationOrder,
    getProjectConfiguration,
    isProjectCheckoutConfigured,
    syncProjectDonationOrder
};
