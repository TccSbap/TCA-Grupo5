const crypto = require('crypto');

const getEncryptionKey = () => {
    const configuredKey = process.env.MP_TOKEN_ENCRYPTION_KEY;
    if (!configuredKey) {
        throw new Error('MP_TOKEN_ENCRYPTION_KEY não foi configurada.');
    }

    const key = Buffer.from(configuredKey, 'base64');
    if (key.length !== 32) {
        throw new Error('MP_TOKEN_ENCRYPTION_KEY deve ser uma chave Base64 de 32 bytes.');
    }

    return key;
};

const encryptToken = (token) => {
    if (typeof token !== 'string' || !token) {
        throw new Error('Token Mercado Pago inválido para criptografia.');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
};

const decryptToken = (value) => {
    if (typeof value !== 'string') {
        throw new Error('Token Mercado Pago criptografado inválido.');
    }

    const [version, ivValue, tagValue, encryptedValue] = value.split('.');
    if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
        throw new Error('Formato de token Mercado Pago criptografado desconhecido.');
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        getEncryptionKey(),
        Buffer.from(ivValue, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final()
    ]).toString('utf8');
};

module.exports = { decryptToken, encryptToken };
