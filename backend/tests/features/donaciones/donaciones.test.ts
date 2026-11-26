import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import {
  manejadorListarDonaciones,
  manejadorRegistrarDonacion,
} from '../../../src/features/donaciones/donaciones.controller.ts';
import { ErrorDonacion } from '../../../src/features/donaciones/donaciones.types.ts';
import {
  generarIdBolsa,
  validarYPrepararDonacion,
} from '../../../src/features/donaciones/donaciones.validation.ts';
import { crearRespuestaSimulada } from '../../helpers/http-mock.ts';

describe('Validación y Controlador de Donaciones', () => {
  it('genera un identificador de bolsa automático con formato BOL-YYYYMMDD-XXXXXX', () => {
    const fecha = new Date('2026-11-26T15:00:00Z');
    assert.equal(generarIdBolsa(fecha, 'a1b2c3'), 'BOL-20261126-A1B2C3');
    assert.match(generarIdBolsa(), /^BOL-\d{8}-[A-F0-9]{6}$/);
  });

  it('valida y normaliza RUT, tipo de sangre desde ficha médica, mililitros extraídos y genera ID de bolsa automático', () => {
    const resultado = validarYPrepararDonacion(
      {
        rut: ' 12.345.678-5 ',
        mlExtraidos: 450,
      },
      ' o+ ',
    );

    assert.equal(resultado.rut, '12345678-5');
    assert.equal(resultado.tipoSangre, 'O+');
    assert.equal(resultado.mlExtraidos, 450);
    assert.match(resultado.idBolsa, /^BOL-\d{8}-[A-F0-9]{6}$/);
  });

  it('rechaza un RUT inválido con ErrorDonacion 400', () => {
    assert.throws(
      () =>
        validarYPrepararDonacion(
          {
            rut: '12.345.678-9',
            mlExtraidos: 450,
          },
          'O+',
        ),
      (error: unknown) =>
        error instanceof ErrorDonacion && error.statusCode === 400,
    );
  });

  it('rechaza cuando el donante no tiene tipo de sangre en su ficha médica o es inválido', () => {
    for (const tipoFichaInvalido of [null, undefined, '', '   ', 'X+']) {
      assert.throws(
        () =>
          validarYPrepararDonacion(
            {
              rut: '12.345.678-5',
              mlExtraidos: 450,
            },
            tipoFichaInvalido,
          ),
        (error: unknown) =>
          error instanceof ErrorDonacion && error.statusCode === 400,
      );
    }
  });

  it('rechaza mlExtraidos fuera de rango, decimal o negativo', () => {
    for (const mlInvalido of [49, 1001, 450.5, -450, 0, 'abc']) {
      assert.throws(
        () =>
          validarYPrepararDonacion(
            {
              rut: '12.345.678-5',
              mlExtraidos: mlInvalido,
            },
            'O+',
          ),
        (error: unknown) =>
          error instanceof ErrorDonacion && error.statusCode === 400,
      );
    }
  });

  it('retorna 400 en manejadorRegistrarDonacion cuando faltan campos obligatorios', async () => {
    const req = {
      body: {
        rut: '12.345.678-5',
      },
    } as Request;
    const { res, obtenerResultado } = crearRespuestaSimulada();

    await manejadorRegistrarDonacion(req, res);
    const resultado = obtenerResultado();

    assert.equal(resultado.statusCode, 400);
    assert.equal(typeof resultado.body.error, 'string');
  });

  it('retorna 400 en manejadorRegistrarDonacion cuando el RUT es inválido', async () => {
    const req = {
      body: {
        rut: '12.345.678-9',
        mlExtraidos: 450,
      },
    } as Request;
    const { res, obtenerResultado } = crearRespuestaSimulada();

    await manejadorRegistrarDonacion(req, res);
    const resultado = obtenerResultado();

    assert.equal(resultado.statusCode, 400);
    assert.equal(typeof resultado.body.error, 'string');
  });

  it('retorna 400 en manejadorListarDonaciones cuando req.params.rut es inválido', async () => {
    const req = {
      params: {
        rut: '12.345.678-9',
      },
    } as unknown as Request;
    const { res, obtenerResultado } = crearRespuestaSimulada();

    await manejadorListarDonaciones(req, res);
    const resultado = obtenerResultado();

    assert.equal(resultado.statusCode, 400);
    assert.equal(typeof resultado.body.error, 'string');
  });
});
