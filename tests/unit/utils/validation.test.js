const {
    isValidCpf,
    validateDonation
} = require('../../../app/utils/validation');

const validDonation = {
    nomeCompleto: 'Ana Silva',
    emailDoador: 'ana@example.com',
    telefoneDoador: '(11) 99999-9999',
    documentoDoador: '529.982.247-25',
    cepDoador: '01001-000',
    ruaDoador: 'Rua das Aguas',
    numeroDoador: '123',
    bairroDoador: 'Centro Azul',
    cidadeDoador: 'Sao Paulo',
    estadoDoador: 'SP',
    valorDoacao: '10',
    metodoPagamento: 'pix',
    confirmacao: 'on'
};

describe('validacao compartilhada de doacao', () => {
    test('valida CPF com digitos verificadores', () => {
        expect(isValidCpf('529.982.247-25')).toBe(true);
        expect(isValidCpf('123.456.789-01')).toBe(false);
        expect(isValidCpf('111.111.111-11')).toBe(false);
    });

    test('aceita uma doacao valida no backend', () => {
        expect(validateDonation(validDonation)).toBeNull();
    });

    test('bloqueia doacao com CPF invalido mesmo se tiver 11 digitos', () => {
        expect(validateDonation({
            ...validDonation,
            documentoDoador: '12345678901'
        })).toBe('CPF invalido.');
    });

    test('bloqueia doacao sem confirmacao explicita', () => {
        expect(validateDonation({
            ...validDonation,
            confirmacao: undefined
        })).toBe('Confirme os dados para continuar.');
    });

    test('exige dados de cartao quando pagamento for cartao', () => {
        expect(validateDonation({
            ...validDonation,
            metodoPagamento: 'cartao'
        })).toBe('Numero do cartao invalido.');

        expect(validateDonation({
            ...validDonation,
            metodoPagamento: 'cartao',
            numeroCartao: '4111111111111111',
            validadeCartao: '12/99',
            cvvCartao: '123'
        })).toBeNull();
    });
});
