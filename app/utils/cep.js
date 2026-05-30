const https = require('https');

const lookupViaCep = (cep, options = {}) => {
    const timeoutMs = options.timeoutMs || 5000;
    const requestFn = options.requestFn || https.get;
    const url = `https://viacep.com.br/ws/${cep}/json/`;

    return new Promise((resolve, reject) => {
        const request = requestFn(url, { headers: { Accept: 'application/json' } }, (response) => {
            let rawBody = '';

            response.setEncoding('utf8');

            response.on('data', (chunk) => {
                rawBody += chunk;
            });

            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`ViaCEP respondeu com status ${response.statusCode}`));
                    return;
                }

                try {
                    resolve(JSON.parse(rawBody));
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.on('error', reject);

        request.setTimeout(timeoutMs, () => {
            request.destroy(new Error('Timeout ao consultar o ViaCEP'));
        });
    });
};

module.exports = {
    lookupViaCep
};
