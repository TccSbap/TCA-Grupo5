const request = require('supertest');
const app = require('../../app');
const { getOngs, resetData, saveOngs } = require('../../data/mockDatabase');

beforeEach(() => resetData());
const signInOng = async (agent) => agent.post('/auth/login').type('form').send({ email: 'admin@agualimpa.org', password: '123456' });

describe('rotas de ONGs', () => {
  test('GET /ongs renderiza a lista de ONGs', async () => {
    const response = await request(app).get('/ongs');
    expect(response.status).toBe(200);
    expect(response.text).toContain('ONGs Parceiras');
  });

  test('perfil publico mostra somente dados da organizacao', async () => {
    const response = await request(app).get('/ongs/1');
    expect(response.status).toBe(200);
    expect(response.text).toContain('ONG');
    expect(response.text).not.toMatch(/denuncias respondidas|responder denuncia|form.*response/i);
  });

  test('dados públicos de todas as ONGs ocultam CNPJ e RG', async () => {
    const privateValues = getOngs().map((ong, index) => ({
      ...ong,
      cnpj: `CNPJ-PRIVADO-${index + 1}`,
      rg: `RG-PRIVADO-${index + 1}`,
      description: `Descricao interna ${index + 1}`
    }));
    saveOngs(privateValues);

    const listResponse = await request(app).get('/ongs');
    expect(listResponse.status).toBe(200);
    expect(listResponse.text).not.toMatch(/CNPJ-PRIVADO|RG-PRIVADO|CNPJ:|RG do respons/i);

    for (const ong of privateValues) {
      const profileResponse = await request(app).get(`/ongs/${ong.id}`);
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.text).not.toContain(ong.cnpj);
      expect(profileResponse.text).not.toContain(ong.rg);
      expect(profileResponse.text).not.toContain(ong.description);
      expect(profileResponse.text).toContain(ong.contact);
      expect(profileResponse.text).toContain(ong.phone);
      expect(profileResponse.text).toContain(ong.address);
    }
  });

  test('GET /ongs/:id retorna 404 para ONG desconhecida', async () => {
    const response = await request(app).get('/ongs/999');
    expect(response.status).toBe(404);
  });

  test('painel da ONG exibe perfil e nao oferece acoes sobre denuncias', async () => {
    const agent = request.agent(app);
    await signInOng(agent);
    const response = await agent.get('/ongs/admin/dashboard');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Perfil da ONG');
    expect(response.text).not.toMatch(/respostas|denuncias pendentes|responder/i);
    expect((await agent.get('/ongs/admin/stats')).status).toBe(404);
    expect((await agent.get('/ongs/admin/relatorio.csv')).status).toBe(404);
  });
});
