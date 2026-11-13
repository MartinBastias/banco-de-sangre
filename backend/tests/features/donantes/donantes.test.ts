import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import {
  manejadorBuscarDonante,
  manejadorRegistrarDonante,
} from '../../../src/features/donantes/donantes.controller.ts';
import { esRutValido, normalizarRut } from '../../../src/lib/rut.ts';
import { crearRespuestaSimulada } from '../../helpers/http-mock.ts';

describe('Servicio y Controlador de Donantes', () => {
  it('normaliza el RUT eliminando puntos, espacios y convirtiendo a mayúsculas', () => {
    assert.equal(normalizarRut(' 12.345.678-k '), '12345678-K');
    assert.equal(normalizarRut('11111111-1'), '11111111-1');
  });

  it('valida que el RUT tenga solo números y K únicamente después del guion usando Módulo 11', () => {
    assert.equal(esRutValido('12.345.678-5'), true);
    assert.equal(esRutValido('11.111.112-k'), true);
    assert.equal(esRutValido('1.234.567-4'), true);
    assert.equal(esRutValido('11111111-1'), true);

    assert.equal(esRutValido('12.345.678-9'), false);
    assert.equal(esRutValido('11.111.111-K'), false);
    assert.equal(esRutValido('12K45678-9'), false);
    assert.equal(esRutValido('12A45678-9'), false);
    assert.equal(esRutValido('12345678-A'), false);
    assert.equal(esRutValido('123456785'), false);
    assert.equal(esRutValido('-K'), false);
  });

  it('retorna 400 al intentar registrar donante sin RUT', async () => {
    const req = { body: {} } as Request;
    const { res, obtenerResultado } = crearRespuestaSimulada();

    await manejadorRegistrarDonante(req, res);
    const resultado = obtenerResultado();

    assert.equal(resultado.statusCode, 400);
    assert.equal(resultado.body.error, 'El RUT es obligatorio.');
  });

  it('retorna 400 al buscar donante con RUT vacío', async () => {
    const req = { params: { rut: '   ' } } as unknown as Request;
    const { res, obtenerResultado } = crearRespuestaSimulada();

    await manejadorBuscarDonante(req, res);
    const resultado = obtenerResultado();

    assert.equal(resultado.statusCode, 400);
    assert.equal(resultado.body.error, 'El RUT es obligatorio.');
  });
});
