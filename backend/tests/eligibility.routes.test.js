const request = require('supertest');
const app = require('../src/index');

describe('Endpoint POST /api/donantes/verificar-elegibilidad', () => {

    test('Retorna estado "Inhabilitado" cuando el donante es "No apto permanentemente"', async () => {
        const res = await request(app)
        .post ('/api/donantes/verificar-elegibilidad')
        .send({
            sexo: 'M',
            estadoMedico: 'No apto permanentemente',
            ultimaDonacion: '2025-05-10',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.habilitado).toBe(false);
        expect(res.body.estado).toBe('Inhabilitado');
    });

    test('Retorna estado "Inhabilitado" cuando el donante es "Diferido temporalmente"', async () => {
        const res = await request(app)
        .post('/api/donantes/verificar-elegibilidad')
        .send({
            sexo: 'F',
            estadoMedico: 'Diferido temporalmente',
            fechaFinDiferimiento: '2027-01-15',
            ultimaDonacion: '2026-01-10',
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.habilitado).toBe(false);
        expect(res.body.estado).toBe('Inhabilitado');
        expect(res.body.proximaFechaHabil).toBe('2027-01-15');
    })

    test('Retorna 400 si no se envian los campos obligatorios (sexo o estadoMedico)', async () => {
        const res = await request(app)
        .post('/api/donantes/verificar-elegibilidad')
        .send({
            ultimaDonacion: '2026-05-10',
        });

        expect(res.statusCode).toBe(400);
    });
});