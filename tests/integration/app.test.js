const request = require('supertest');
const app = require('../../app');

describe('smoke tests da aplicação', () => {
  test('GET / responde com sucesso', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(response.text).toContain('meta name="theme-color" content="#2563eb"');
  });

  test('GET /manifest.webmanifest expõe o manifest PWA', async () => {
    const response = await request(app).get('/manifest.webmanifest');

    expect(response.status).toBe(200);

    const manifest = JSON.parse(response.text);

    expect(manifest.name).toBe('ODS 6 - Água Consciente');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.prefer_related_applications).toBe(false);
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192' }),
      expect.objectContaining({ sizes: '512x512' })
    ]));
    expect(manifest.screenshots).toHaveLength(2);
  });

  test('GET /sw.js entrega o service worker', async () => {
    const response = await request(app).get('/sw.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain('CACHE_NAME');
  });

  test('GET /robots.txt entrega regras de indexação e sitemap', async () => {
    const response = await request(app).get('/robots.txt');

    expect(response.status).toBe(200);
    expect(response.text).toContain('User-agent: *');
    expect(response.text).toContain('Disallow: /auth/');
    expect(response.text).toContain('Sitemap: https://ods6.org/sitemap.xml');
  });

  test('GET /sitemap.xml lista as paginas publicas principais', async () => {
    const response = await request(app).get('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(response.text).toContain('<loc>https://ods6.org/</loc>');
    expect(response.text).toContain('<loc>https://ods6.org/sobre</loc>');
    expect(response.text).toContain('<loc>https://ods6.org/ongs</loc>');
  });

  test('paginas internas recebem noindex', async () => {
    const response = await request(app).get('/auth/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
  });

  test('GET /unknown-page retorna 404', async () => {
    const response = await request(app).get('/unknown-page');

    expect(response.status).toBe(404);
  });

  test('POST /__test/session/clear limpa a sessão de teste', async () => {
    const agent = request.agent(app);

    await agent.post('/__test/session').send({
      user: {
        id: 11,
        name: 'João Silva',
        type: 'user'
      }
    });

    const response = await agent.post('/__test/session/clear');

    expect(response.status).toBe(204);
  });
});
