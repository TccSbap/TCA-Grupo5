const createPlanosModel = require('../../../models/planos.model');
const createNoticiasModel = require('../../../models/noticias.model');
const createDoacoesModel = require('../../../models/doacoes.model');
const createAssinaturasPlanoModel = require('../../../models/assinaturasPlano.model');
const createMensagensContatoModel = require('../../../models/mensagensContato.model');

const buildModel = (factory, canUseDatabaseValue = true) => {
    const pool = {
        execute: jest.fn()
    };
    const canUseDatabase = jest.fn().mockResolvedValue(canUseDatabaseValue);
    const model = factory({ pool, canUseDatabase });

    return { model, pool, canUseDatabase };
};

describe('models/content models', () => {
    test('planos model lists and looks up plans', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel(createPlanosModel);
        const row = {
            id: 1,
            title: 'Plan One',
            price: '9.90',
            subtitle: 'Subtitle',
            features_json: '["feature"]',
            created_at: iso
        };

        pool.execute.mockImplementation((query) => {
            if (query.includes('WHERE id')) {
                return Promise.resolve([[row], []]);
            }

            return Promise.resolve([[row], []]);
        });

        await expect(model.getPlanos()).resolves.toEqual([expect.objectContaining({ id: 1, features: ['feature'] })]);
        await expect(model.getPlanoById(1)).resolves.toMatchObject({ id: 1, title: 'Plan One' });
    });

    test('noticias model lists and looks up news', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel(createNoticiasModel);
        const row = {
            id: 1,
            title: 'News One',
            date_label: '2024-01-01',
            description: 'Description',
            image: 'image.png',
            url: 'https://example.com',
            icon_class: '',
            sort_order: 1,
            created_at: iso
        };

        pool.execute.mockImplementation((query) => {
            if (query.includes('WHERE id')) {
                return Promise.resolve([[row], []]);
            }

            return Promise.resolve([[row], []]);
        });

        await expect(model.getNoticias()).resolves.toEqual([expect.objectContaining({ id: 1, iconClass: 'fas fa-newspaper' })]);
        await expect(model.getNoticiaById(1)).resolves.toMatchObject({ id: 1, title: 'News One' });
    });

    test('doacoes model lists and creates donations', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel(createDoacoesModel);
        const row = {
            id: 1,
            ong_id: 2,
            user_id: 3,
            donor_name: 'Donor',
            donor_email: 'donor@example.com',
            donor_phone: '11999999999',
            donor_document: '12345678901',
            donor_cep: '12345678',
            donor_street: 'Street',
            donor_number: '1',
            donor_neighborhood: 'Neighborhood',
            donor_city: 'City',
            donor_state: 'SP',
            amount: '15.00',
            message: 'Hello',
            payment_method: 'pix',
            status: 'pendente',
            created_at: iso
        };

        pool.execute
            .mockResolvedValueOnce([[row], []])
            .mockResolvedValueOnce([{ insertId: 2 }, []]);

        await expect(model.getDoacoes()).resolves.toEqual([expect.objectContaining({ id: 1, amount: 15 })]);
        await expect(model.createDoacao({
            ongId: 2,
            userId: 3,
            donorName: 'Donor',
            donorEmail: 'donor@example.com',
            donorPhone: '11999999999',
            donorDocument: '12345678901',
            donorCep: '12345678',
            donorStreet: 'Street',
            donorNumber: '1',
            donorNeighborhood: 'Neighborhood',
            donorCity: 'City',
            donorState: 'SP',
            amount: 15,
            message: 'Hello',
            paymentMethod: 'pix'
        })).resolves.toMatchObject({
            id: 2,
            status: 'pendente'
        });
    });

    test('assinaturas plano model lists and creates subscriptions', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel(createAssinaturasPlanoModel);
        const row = {
            id: 1,
            plan_id: 2,
            user_id: 3,
            plan_name: 'Plan',
            plan_price: '19.90',
            subscriber_name: 'Subscriber',
            subscriber_email: 'subscriber@example.com',
            subscriber_phone: '11999999999',
            subscriber_document: '12345678901',
            subscriber_cep: '12345678',
            subscriber_street: 'Street',
            subscriber_number: '2',
            subscriber_neighborhood: 'Neighborhood',
            subscriber_city: 'City',
            subscriber_state: 'SP',
            payment_method: 'cartao',
            status: 'pendente',
            created_at: iso
        };

        pool.execute
            .mockResolvedValueOnce([[row], []])
            .mockResolvedValueOnce([{ insertId: 2 }, []]);

        await expect(model.getAssinaturasPlano()).resolves.toEqual([expect.objectContaining({ id: 1, planId: 2 })]);
        await expect(model.createAssinaturaPlano({
            planId: 2,
            userId: 3,
            planName: 'Plan',
            planPrice: '19.90',
            subscriberName: 'Subscriber',
            subscriberEmail: 'subscriber@example.com',
            subscriberPhone: '11999999999',
            subscriberDocument: '12345678901',
            subscriberCep: '12345678',
            subscriberStreet: 'Street',
            subscriberNumber: '2',
            subscriberNeighborhood: 'Neighborhood',
            subscriberCity: 'City',
            subscriberState: 'SP',
            paymentMethod: 'cartao'
        })).resolves.toMatchObject({
            id: 2,
            status: 'pendente'
        });
    });

    test('mensagens contato model lists and creates messages', async () => {
        const iso = '2024-01-02T03:04:05.000Z';
        const { model, pool } = buildModel(createMensagensContatoModel);
        const row = {
            id: 1,
            user_id: 3,
            name: 'Message User',
            email: 'message@example.com',
            subject: 'Subject',
            message: 'Body',
            newsletter: 1,
            status: 'nova',
            created_at: iso
        };

        pool.execute
            .mockResolvedValueOnce([[row], []])
            .mockResolvedValueOnce([{ insertId: 2 }, []]);

        await expect(model.getMensagensContato()).resolves.toEqual([expect.objectContaining({ id: 1, newsletter: true })]);
        await expect(model.createMensagemContato({
            userId: 3,
            name: 'Message User',
            email: 'message@example.com',
            subject: 'Subject',
            message: 'Body',
            newsletter: true
        })).resolves.toMatchObject({
            id: 2,
            newsletter: true,
            status: 'nova'
        });
    });

    test('model factories reject when the database is unavailable', async () => {
        const { model } = buildModel(createPlanosModel, false);

        await expect(model.getPlanos()).rejects.toThrow(/Banco de dados indispon/i);
    });
});
