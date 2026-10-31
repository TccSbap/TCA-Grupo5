const path = require('path');
const ejs = require('ejs');

const template = path.resolve(__dirname, '../../../app/views/noticias.ejs');
const locals = {
    currentPath: '/noticias',
    isLoggedIn: false,
    seoStructuredData: [],
    csrfToken: 'test-token',
    cspNonce: 'test-nonce',
    noticias: [{ title: 'Notícia de saneamento', description: 'Resumo', date: '31/10/2026', image: '/images/saneamento.webp', url: 'https://example.org/report' }]
};

test('renderiza com os dados do controller antigo sem exigir os novos metadados', async () => {
    const html = await ejs.renderFile(template, locals);
    expect(html).toContain('Notícia de saneamento');
    expect(html).toContain('1 de 1 notícias');
    expect(html).toContain('/css/noticias.css');
    expect(html).not.toContain('Invalid Date');
});

test('renderiza lista vazia e data de revisão inválida sem falhar', async () => {
    const html = await ejs.renderFile(template, { ...locals, noticias: null, newsReviewedAt: 'invalid' });
    expect(html).toContain('Nenhuma notícia encontrada');
    expect(html).not.toContain('Invalid Date');
});
