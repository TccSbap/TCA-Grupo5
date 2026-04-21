const request = require('supertest');
const app = require('../../app');

describe('app integration smoke tests', () => {
  test('GET / responds with success', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
  });

  test('GET /unknown-page returns 404', async () => {
    const response = await request(app).get('/unknown-page');

    expect(response.status).toBe(404);
  });
});
