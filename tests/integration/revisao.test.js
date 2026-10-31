const request = require('supertest');
const app = require('../../app');
const data = require('../../data/mockDatabase');
const { sumDonationAmounts } = require('../../app/utils/analytics');

const signIn = async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ email: 'joao@email.com', password: '123456' });
    return agent;
};

test.each([{ email: 'joao@email.com', password: {} }, { email: ['joao@email.com'], password: '123456' }])('login de usuario recusa tipos inesperados sem falhar: %j', async (body) => {
    const response = await request(app).post('/auth/login').send(body);
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('/auth/login?error=');
});

test('noticias exibem fontes reais, datas ISO, filtros e metadados corretos', async () => {
    const all = await request(app).get('/noticias');
    expect(all.status).toBe(200);
    expect(all.text).toContain('datetime="2026-10-22"');
    expect(all.text).toContain('Fonte: <strong>ANA</strong>');
    expect(all.text).toContain('Governo da Bahia');
    expect(all.text).not.toContain('/noticias?destaque=');
    const filtered = await request(app).get('/noticias').query({ q: 'tarifa social', tema: 'saneamento' });
    expect(filtered.text.match(/class="noticia-card"/g)).toHaveLength(1);
    const empty = await request(app).get('/noticias').query({ q: '<script>inexistente</script>' });
    expect(empty.text).toContain('Nenhuma notícia encontrada');
    expect(empty.text).not.toContain('<script>inexistente</script>');
});

test.each([{}, { email: 'admin@ods6.org' }, { email: ['admin@ods6.org'], password: {} }])('login administrativo rejeita corpo incompleto: %j', async (body) => {
    const response = await request(app).post('/admin/login').send(body);
    expect(response.status).toBe(400);
    expect(response.text).toContain('Informe e-mail e senha.');
});

test.each(['//example.org', '/\\example.org', 'https://example.org'])('consentimento nao redireciona para fora do site: %s', async (returnTo) => {
    const response = await request(app).post('/cookies/consent').send({ consent: 'accepted', returnTo });
    expect(response.headers.location).toBe('/');
});

test('erros de infraestrutura nao expoem stack ou detalhes da conexao', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        const isolated = app.createApp({ getOngs: async () => { throw new Error('secret-db-host'); } });
        const response = await request(isolated).get('/ongs');
        expect(response.status).toBe(500);
        expect(response.text).toContain('Não foi possível concluir a solicitação');
        expect(response.text).not.toContain('secret-db-host');
        expect(response.headers['cache-control']).toBe('no-store');
    } finally { log.mockRestore(); }
});

test('denuncias normalizam categorias legadas e rejeitam dados invalidos antes de gravar', async () => {
    const agent = await signIn();
    const before = data.getDenuncias().length;
    const payload = { title: '  Nova denúncia de drenagem  ', description: '  Alagamento recorrente após chuvas fortes no bairro.  ', location: '  Rua das Flores, 123  ', category: 'drenagem' };
    const invalid = await agent.post('/denuncias/nova').send({ ...payload, title: { bad: true } });
    expect(invalid.headers.location).toContain('error=');
    expect(data.getDenuncias()).toHaveLength(before);
    const response = await agent.post('/denuncias/nova').send(payload);
    expect(response.headers.location).toContain('success=');
    expect(data.getDenuncias()).toHaveLength(before + 1);
    expect(data.getDenuncias().at(-1)).toMatchObject({ title: 'Nova denúncia de drenagem', category: 'geral', status: 'pendente' });
});

const donation = {
    ongId: 1, nomeCompleto: 'Maria da Silva', emailDoador: 'maria@example.org', telefoneDoador: '11999998888',
    documentoDoador: '52998224725', cepDoador: '01001000', ruaDoador: 'Rua das Flores', numeroDoador: '123',
    bairroDoador: 'Centro', cidadeDoador: 'São Paulo', estadoDoador: 'SP', valorDoacao: '50', metodoPagamento: 'pix', confirmacao: 'on'
};

test('registro de apoio fica pendente e nao aumenta o total de pagamentos recebidos', async () => {
    const total = sumDonationAmounts(data.getDoacoes());
    const response = await request(app).post('/doar').send(donation);
    expect(response.status).toBe(302);
    expect(decodeURIComponent(response.headers.location)).toContain('Nenhum pagamento foi processado');
    expect(data.getDoacoes().at(-1)).toMatchObject({ status: 'pendente', amount: 50 });
    expect(sumDonationAmounts(data.getDoacoes())).toBe(total);
    const form = await request(app).get('/doacoes/1/doar');
    expect(form.text).not.toContain('name="numeroCartao"');
    expect(form.text).not.toContain('name="cvvCartao"');
});

test('dados de cartao e valores fora da precisao do banco sao recusados', async () => {
    const before = data.getDoacoes().length;
    for (const extra of [{ numeroCartao: '4111111111111111' }, { valorDoacao: '1e100' }, { valorDoacao: '5.001' }]) {
        const response = await request(app).post('/doar').send({ ...donation, ...extra });
        expect(response.text).toContain('alert-error');
    }
    expect(data.getDoacoes()).toHaveLength(before);
});
