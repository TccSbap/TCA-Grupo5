const normalizeText = (value) => String(value || '').trim();
const digitsOnly = (value) => normalizeText(value).replace(/\D/g, '');
const hasTwoWords = (value) => normalizeText(value).split(/\s+/).filter(Boolean).length >= 2;
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
const isValidState = (value) => /^[A-Z]{2}$/.test(normalizeText(value));
const isLongEnough = (value, min) => normalizeText(value).length >= min;
const isChecked = (value) => value === true || value === 'true' || value === 'on' || value === '1';

const isValidCpf = (value) => {
    const cpf = digitsOnly(value);

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calculateDigit = (base, weightsStart) => {
        const sum = base
            .split('')
            .reduce((acc, digit, index) => acc + Number(digit) * (weightsStart - index), 0);
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };

    return calculateDigit(cpf.slice(0, 9), 10) === Number(cpf[9])
        && calculateDigit(cpf.slice(0, 10), 11) === Number(cpf[10]);
};

const isValidDonationAmount = (value) => {
    const amount = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(amount) && amount >= 5;
};

const isValidCardNumber = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 13 && digits.length <= 19;
};

const isValidCardExpiry = (value) => {
    const match = normalizeText(value).match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

    if (!match) {
        return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const expiry = new Date(year, month, 0, 23, 59, 59);

    return expiry >= new Date();
};

const isValidCvv = (value) => /^\d{3,4}$/.test(digitsOnly(value));

const validateDonation = (body) => {
    if (!hasTwoWords(body.nomeCompleto)) {
        return 'Nome completo deve conter pelo menos 2 palavras.';
    }

    if (!isValidEmail(body.emailDoador)) {
        return 'E-mail do doador invalido.';
    }

    if (digitsOnly(body.telefoneDoador).length < 10) {
        return 'Telefone invalido.';
    }

    if (!isValidCpf(body.documentoDoador)) {
        return 'CPF invalido.';
    }

    if (digitsOnly(body.cepDoador).length !== 8) {
        return 'CEP invalido. Deve ter 8 digitos numericos.';
    }

    if (!isLongEnough(body.ruaDoador, 3)) {
        return 'Rua invalida.';
    }

    if (!isLongEnough(body.numeroDoador, 1)) {
        return 'Numero invalido.';
    }

    if (!isLongEnough(body.bairroDoador, 3)) {
        return 'Bairro invalido.';
    }

    if (!isLongEnough(body.cidadeDoador, 3)) {
        return 'Cidade invalida.';
    }

    if (!isValidState(body.estadoDoador)) {
        return 'Estado invalido. Use a sigla de 2 letras maiusculas.';
    }

    if (!isValidDonationAmount(body.valorDoacao)) {
        return 'O valor da doacao deve ser de pelo menos R$ 5,00.';
    }

    if (!['cartao', 'pix', 'boleto'].includes(body.metodoPagamento)) {
        return 'Selecione um metodo de pagamento valido.';
    }

    if (body.metodoPagamento === 'cartao') {
        if (!isValidCardNumber(body.numeroCartao)) {
            return 'Numero do cartao invalido.';
        }

        if (!isValidCardExpiry(body.validadeCartao)) {
            return 'Validade do cartao invalida.';
        }

        if (!isValidCvv(body.cvvCartao)) {
            return 'CVV invalido.';
        }
    }

    if (!isChecked(body.confirmacao)) {
        return 'Confirme os dados para continuar.';
    }

    return null;
};

const validatePlanSubscription = (body) => {
    if (!hasTwoWords(body.nomeCompleto)) {
        return 'Nome completo deve conter pelo menos 2 palavras.';
    }

    if (!isValidEmail(body.emailComprador)) {
        return 'E-mail do comprador invalido.';
    }

    if (digitsOnly(body.telefoneComprador).length < 10) {
        return 'Telefone invalido.';
    }

    if (digitsOnly(body.documentoComprador).length !== 11) {
        return 'CPF invalido. Deve ter 11 digitos numericos.';
    }

    if (digitsOnly(body.cepComprador).length !== 8) {
        return 'CEP invalido. Deve ter 8 digitos numericos.';
    }

    if (!isLongEnough(body.ruaComprador, 3)) {
        return 'Rua invalida.';
    }

    if (!isLongEnough(body.numeroComprador, 1)) {
        return 'Numero invalido.';
    }

    if (!isLongEnough(body.bairroComprador, 3)) {
        return 'Bairro invalido.';
    }

    if (!isLongEnough(body.cidadeComprador, 3)) {
        return 'Cidade invalida.';
    }

    if (!isValidState(body.estadoComprador)) {
        return 'Estado invalido. Use a sigla de 2 letras maiusculas.';
    }

    if (!['cartao', 'pix', 'boleto'].includes(body.metodoPagamento)) {
        return 'Selecione um metodo de pagamento valido.';
    }

    return null;
};

const validateContactMessage = (body) => {
    if (!hasTwoWords(body.name)) {
        return 'Informe seu nome completo.';
    }

    if (!isValidEmail(body.email)) {
        return 'Informe um e-mail valido.';
    }

    if (!normalizeText(body.subject)) {
        return 'Selecione um assunto.';
    }

    if (!isLongEnough(body.message, 10)) {
        return 'A mensagem deve ter pelo menos 10 caracteres.';
    }

    return null;
};

module.exports = {
    validateDonation,
    validatePlanSubscription,
    validateContactMessage,
    normalizeText,
    digitsOnly,
    hasTwoWords,
    isValidEmail,
    isValidState,
    isLongEnough,
    isChecked,
    isValidCpf,
    isValidDonationAmount,
    isValidCardNumber,
    isValidCardExpiry,
    isValidCvv
};
