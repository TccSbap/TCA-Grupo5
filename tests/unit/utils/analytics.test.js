const { sumDonationAmounts } = require('../../../app/utils/analytics');

test('valores pendentes e cancelados nao sao apresentados como doacoes recebidas', () => {
    expect(sumDonationAmounts([
        { amount: 10, status: 'confirmada' },
        { amount: '20.50', status: 'confirmada' },
        { amount: 100, status: 'pendente' },
        { amount: 500, status: 'cancelada' }
    ])).toBe(30.5);
});
