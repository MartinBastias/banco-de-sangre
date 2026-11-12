import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import {
  manejadorBuscarDonante,
  manejadorRegistrarDonante,
} from '../src/features/donantes/donantes.controller.ts';
import { normalizarRut } from '../src/features/donantes/donantes.service.ts';

function crearRespuestaSimulada() {
  let statusCode = 200;
  let body: Record<string, unknown> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  return {
    res,
    obtenerResultado: () => ({ statusCode, body }),
  };
}

describe('Servicio y Controlador de Donantes', () => {
  it('normaliza el RUT eliminando puntos, espacios y convirtiendo a mayúsculas', () => {
    assert.equal(normalizarRut(' 12.345.678-k '), '12345678-K');
    assert.equal(normalizarRut('11111111-1'), '11111111-1');
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

