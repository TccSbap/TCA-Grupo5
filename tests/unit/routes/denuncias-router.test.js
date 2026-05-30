const express = require('express');
const request = require('supertest');
const { createDenunciasRouter } = require('../../../app/routes/denuncias');

describe('rota de CEP das denúncias', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const buildApp = (lookupCep = jest.fn()) => {
        const app = express();

        app.use('/denuncias', createDenunciasRouter({}, { lookupCep }));

        return { app, lookupCep };
    };

    test('GET /denuncias/cep/:cep retorna o endereço consultado', async () => {
        const { app, lookupCep } = buildApp(jest.fn().mockResolvedValue({
            cep: '01001-000',
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            localidade: 'São Paulo',
            uf: 'SP'
        }));

        const response = await request(app).get('/denuncias/cep/01001000');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            cep: '01001-000',
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            localidade: 'São Paulo',
            uf: 'SP'
        });
        expect(lookupCep).toHaveBeenCalledWith('01001000');
    });

    test('GET /denuncias/cep/:cep rejeita CEP com formato invalido', async () => {
        const { app, lookupCep } = buildApp(jest.fn());

        const response = await request(app).get('/denuncias/cep/123');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'CEP invalido. Use 8 digitos numericos.'
        });
        expect(lookupCep).not.toHaveBeenCalled();
    });

    test('GET /denuncias/cep/:cep retorna 404 quando o CEP nao existe', async () => {
        const { app } = buildApp(jest.fn().mockResolvedValue({ erro: true }));

        const response = await request(app).get('/denuncias/cep/99999999');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'CEP nao encontrado.'
        });
    });

    test('GET /denuncias/cep/:cep retorna 502 quando a consulta falha', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const { app } = buildApp(jest.fn().mockRejectedValue(new Error('network failure')));

        const response = await request(app).get('/denuncias/cep/01001000');

        expect(response.status).toBe(502);
        expect(response.body).toEqual({
            error: 'Nao foi possivel buscar o CEP no momento.'
        });
    });
});
