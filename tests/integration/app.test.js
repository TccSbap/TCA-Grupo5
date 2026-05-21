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
