const { loadNoticias, normalizeNews, searchNoticias } = require('../../../app/utils/noticias');
const { buildNewsArticleStructuredData } = require('../../../app/utils/seo');

describe('curadoria de noticias', () => {
    test('oferece seis fontes verificadas, sem duplicar o catalogo do modo mock', async () => {
        const catalog = require('../../../data/tables/noticias')();
        const result = await loadNoticias({ getNoticias: () => catalog });
        expect(result).toHaveLength(6);
        expect(new Set(result.map((item) => item.url)).size).toBe(6);
        expect(result[0].publishedAt).toBe('2026-10-22');
        for (const item of result) {
            expect(item.url).toMatch(/^https:\/\/(www.gov.br|www.ba.gov.br)\//);
            expect(item.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(item.sourceName).toBeTruthy();
            expect(buildNewsArticleStructuredData(item).publisher.name).toBe(item.sourceName);
        }
    });

    test.each(['/noticias?destaque=1', 'javascript:alert(1)', 'http://example.org/news', 'https://user:secret@example.org/news'])('exclui links de exemplo ou inseguros: %s', (url) => {
        expect(normalizeNews({ title: 'Teste', url })).toBeNull();
    });

    test('preserva publicacoes externas do banco sem expor exemplos antigos', async () => {
        const stored = [
            { title: 'Nova notícia local', url: 'https://example.org/report', publishedAt: '2026-10-30' },
            { title: 'Demonstração', url: '/noticias?destaque=1' }
        ];
        const result = await loadNoticias({ getNoticias: () => stored });
        expect(result).toHaveLength(7);
        expect(result[0].title).toBe('Nova notícia local');
        expect(stored).toHaveLength(2);
    });

    test('busca ignora acentos e combina o filtro de tema', async () => {
        const result = await loadNoticias({});
        expect(searchNoticias(result, 'eficiencia', 'agua')).toHaveLength(1);
        expect(searchNoticias(result, 'Tarifa Social', 'saneamento')).toHaveLength(1);
        expect(searchNoticias(result, 'Tarifa Social', 'agua')).toHaveLength(0);
    });
});
