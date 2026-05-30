const {
    nextId,
    normalizeFilterId,
    toSqlDateTime,
    toIsoString,
    parseJsonArray,
    normalizeUserRow,
    normalizeOngRow,
    normalizeDenunciaRow,
    normalizePlanoRow,
    normalizeNoticiaRow,
    normalizeDoacaoRow,
    normalizeAssinaturaPlanoRow,
    normalizeMensagemContatoRow
} = require('../../../app/models/helpers');

describe('models/helpers', () => {
    test('nextId and normalizeFilterId handle basic inputs', () => {
        expect(nextId([])).toBe(1);
        expect(nextId([{ id: 2 }, { id: 5 }])).toBe(6);
        expect(normalizeFilterId(null)).toBeNull();
        expect(normalizeFilterId('')).toBeNull();
        expect(normalizeFilterId('abc')).toBeNull();
        expect(normalizeFilterId('7')).toBe(7);
    });

    test('date helpers and JSON parsing keep stable output', () => {
        const iso = '2024-01-02T03:04:05.000Z';

        expect(toSqlDateTime(iso)).toBe('2024-01-02 03:04:05.000');
        expect(toIsoString(iso)).toBe(iso);
        expect(parseJsonArray([1, 2])).toEqual([1, 2]);
        expect(parseJsonArray('[1,2]')).toEqual([1, 2]);
        expect(parseJsonArray('invalid', ['fallback'])).toEqual(['fallback']);
    });

    test('normalizers map database rows to domain objects', () => {
        const iso = '2024-01-02T03:04:05.000Z';

        expect(normalizeUserRow({
            id: 1,
            name: 'User One',
            email: 'user@example.com',
            password_hash: 'hash',
            type: 'user',
            ong_name: 'Org One',
            created_at: iso
        })).toEqual({
            id: 1,
            name: 'User One',
            email: 'user@example.com',
            password: 'hash',
            type: 'user',
            ongName: 'Org One',
            createdAt: iso
        });

        expect(normalizeOngRow({
            id: 2,
            name: 'Org One',
            description: 'Description',
            contact_email: 'contact@example.com',
            cnpj: '123',
            rg: '456',
            phone: '11999999999',
            address: 'Main Street',
            user_id: 10,
            focus: '',
            created_at: iso
        })).toEqual({
            id: 2,
            name: 'Org One',
            description: 'Description',
            contact: 'contact@example.com',
            cnpj: '123',
            rg: '456',
            phone: '11999999999',
            address: 'Main Street',
            userId: 10,
            focus: 'Description',
            createdAt: iso
        });

        expect(normalizeDenunciaRow({
            id: 3,
            title: 'Leak',
            description: 'Long description',
            location: 'Center',
            category: 'water',
            status: 'pendente',
            user_id: 11,
            user_name: 'Reporter',
            created_at: iso
        })).toEqual({
            id: 3,
            title: 'Leak',
            description: 'Long description',
            location: 'Center',
            category: 'water',
            status: 'pendente',
            userId: 11,
            userName: 'Reporter',
            responses: [],
            createdAt: iso
        });

        expect(normalizePlanoRow({
            id: 4,
            title: 'Basic',
            price: '9.90',
            subtitle: 'Subtitle',
            features_json: '["a","b"]',
            created_at: iso
        })).toEqual({
            id: 4,
            title: 'Basic',
            price: '9.90',
            subtitle: 'Subtitle',
            features: ['a', 'b'],
            createdAt: iso
        });

        expect(normalizeNoticiaRow({
            id: 5,
            title: 'News',
            date_label: '2024-01-02',
            description: 'Description',
            image: 'image.png',
            url: 'https://example.com',
            icon_class: '',
            sort_order: 3,
            created_at: iso
        })).toEqual({
            id: 5,
            title: 'News',
            date: '2024-01-02',
            description: 'Description',
            image: 'image.png',
            url: 'https://example.com',
            iconClass: 'fas fa-newspaper',
            sortOrder: 3,
            createdAt: iso
        });

        expect(normalizeDoacaoRow({
            id: 6,
            ong_id: 7,
            user_id: 8,
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
            amount: '12.50',
            message: 'Hello',
            payment_method: 'pix',
            status: 'confirmada',
            created_at: iso
        })).toEqual({
            id: 6,
            ongId: 7,
            userId: 8,
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
            amount: 12.5,
            message: 'Hello',
            paymentMethod: 'pix',
            status: 'confirmada',
            createdAt: iso
        });

        expect(normalizeAssinaturaPlanoRow({
            id: 7,
            plan_id: 1,
            user_id: 2,
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
        })).toEqual({
            id: 7,
            planId: 1,
            userId: 2,
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
            paymentMethod: 'cartao',
            status: 'pendente',
            createdAt: iso
        });

        expect(normalizeMensagemContatoRow({
            id: 8,
            user_id: 4,
            name: 'Message User',
            email: 'message@example.com',
            subject: 'Subject',
            message: 'Body',
            newsletter: 1,
            status: 'nova',
            created_at: iso
        })).toEqual({
            id: 8,
            userId: 4,
            name: 'Message User',
            email: 'message@example.com',
            subject: 'Subject',
            message: 'Body',
            newsletter: true,
            status: 'nova',
            createdAt: iso
        });
    });
});
