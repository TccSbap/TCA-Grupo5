const database = require('../../../data/mockDatabase');

beforeEach(() => {
    database.resetData();
});

describe('bootstrap da camada de dados em teste', () => {
    test('carrega a massa de dados inicial para os principais contextos', () => {
        expect(database.getUsers()).toHaveLength(12);
        expect(database.getOngs()).toHaveLength(10);
        expect(database.getNoticias()).toHaveLength(6);
        expect(database.getDoacoes()).toHaveLength(3);
        expect(database.getMensagensContato()).toHaveLength(3);
        expect(database.getDenuncias()).toHaveLength(16);
    });

    test('autentica usuários e resolve relações básicas entre os contextos', () => {
        expect(database.authenticateUser('joao@email.com', '123456')).toEqual(
            expect.objectContaining({
                id: 11,
                email: 'joao@email.com',
                type: 'user'
            })
        );

        expect(database.getUserById(11)).toEqual(expect.objectContaining({ id: 11 }));
        expect(database.getOngById(1)).toEqual(expect.objectContaining({ id: 1 }));
        expect(database.getOngByUserId(1)).toEqual(expect.objectContaining({ id: 1 }));
        expect(database.getNoticiaById(1)).toEqual(expect.objectContaining({ id: 1 }));
        expect(database.getDenunciaById(1)).toEqual(expect.objectContaining({ id: 1 }));
    });

    test('resetData restaura os dados originais após alterações locais', () => {
        database.createUser({
            name: 'Usuario Temporario',
            email: 'temp@exemplo.com',
            password: 'hash',
            type: 'user'
        });

        expect(database.getUsers()).toHaveLength(13);

        database.resetData();

        expect(database.getUsers()).toHaveLength(12);
        expect(database.getOngs()).toHaveLength(10);
        expect(database.getDenuncias()).toHaveLength(16);
    });

    test('denuncias demonstrativas nao contem respostas de ONGs', () => {
        expect(database.getDenuncias()).toHaveLength(16);
        expect(database.getDenuncias().every((denuncia) => denuncia.responses.length === 0)).toBe(true);
    });
});
