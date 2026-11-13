import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import {
  manejadorGuardarFichaMedica,
  manejadorObtenerFichaMedica,
} from '../../../src/features/ficha-medica/ficha-medica.controller.ts';
import {
  ErrorFichaMedica,
  type RegistroFichaMedicaDB,
} from '../../../src/features/ficha-medica/ficha-medica.types.ts';
import {
  debeEliminarCitaPorCambioEstado,
  validarYPrepararFichaMedica,
} from '../../../src/features/ficha-medica/ficha-medica.validation.ts';
import { crearRespuestaSimulada } from '../../helpers/http-mock.ts';

describe('Servicio y Controlador de Ficha Médica', () => {
  const fechaBase = new Date('2026-11-12T12:00:00Z');

  it('valida y prepara una nueva ficha médica en estado Apto', () => {
    const resultado = validarYPrepararFichaMedica(
      {
        rut: '12.345.678-5',
        peso: 70.5,
        tipoSangre: 'O+',
        estadoClinico: 'Apto',
        observaciones: 'Sin antecedentes de riesgo.',
      },
      null,
      fechaBase,
    );

    assert.equal(resultado.rut, '12345678-5');
    assert.equal(resultado.peso, 70.5);
    assert.equal(resultado.tipoSangre, 'O+');
    assert.equal(resultado.estadoClinico, 'Apto');
    assert.equal(resultado.fechaElegibilidad, '2026-11-12');
    assert.equal(resultado.observaciones, 'Sin antecedentes de riesgo.');
  });

  it('calcula fechaElegibilidad desde tiempo estimado cuando está Diferido temporalmente', () => {
    const resultado = validarYPrepararFichaMedica(
      {
        rut: '11111111-1',
        peso: 64,
        tipoSangre: 'A-',
        estadoClinico: 'Diferido temporalmente',
        tiempoEstimadoCantidad: 3,
        tiempoEstimadoUnidad: 'meses',
        observaciones: 'Tatuaje reciente.',
      },
      null,
      fechaBase,
    );

    assert.equal(resultado.estadoClinico, 'Diferido temporalmente');
    assert.equal(resultado.fechaElegibilidad, '2027-02-12');
  });

  it('exige tiempo estimado o fecha cuando se marca Diferido temporalmente', () => {
    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '11111111-1',
            peso: 65,
            tipoSangre: 'B+',
            estadoClinico: 'Diferido temporalmente',
          },
          null,
          fechaBase,
        ),
      ErrorFichaMedica,
    );
  });

  it('marca Excluyente como permanente con fechaElegibilidad nula y rechaza otros estados', () => {
    const excluyente = validarYPrepararFichaMedica(
      {
        rut: '22222222-2',
        peso: 75,
        tipoSangre: 'AB+',
        estadoClinico: 'Excluyente',
        tiempoEstimadoCantidad: 1,
        tiempoEstimadoUnidad: 'anios',
      },
      null,
      fechaBase,
    );
    assert.equal(excluyente.estadoClinico, 'Excluyente');
    assert.equal(excluyente.fechaElegibilidad, null);

    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '22222222-2',
            peso: 75,
            tipoSangre: 'AB+',
            estadoClinico: 'No apto',
          },
          null,
          fechaBase,
        ),
      ErrorFichaMedica,
    );
  });

  it('rechaza peso, tipo de sangre o RUT inválidos', () => {
    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '11111111-1',
            peso: 10,
            tipoSangre: 'O+',
            estadoClinico: 'Apto',
          },
          null,
          fechaBase,
        ),
      /peso/i,
    );

    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '11111111-1',
            peso: 65,
            tipoSangre: 'Z+',
            estadoClinico: 'Apto',
          },
          null,
          fechaBase,
        ),
      /tipo de sangre/i,
    );

    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '12.345.678-9',
            peso: 65,
            tipoSangre: 'O+',
            estadoClinico: 'Apto',
          },
          null,
          fechaBase,
        ),
      /RUT/i,
    );

    assert.throws(
      () =>
        validarYPrepararFichaMedica(
          {
            rut: '12345678-A',
            peso: 65,
            tipoSangre: 'O+',
            estadoClinico: 'Apto',
          },
          null,
          fechaBase,
        ),
      /RUT/i,
    );
  });

  it('actualiza solo campos modificados en donante existente y preserva tipo de sangre', () => {
    const existente: RegistroFichaMedicaDB = {
      rut: '33333333-3',
      peso: 70,
      estadoClinico: 'Diferido temporalmente',
      tipoSangre: 'O+',
      fechaElegibilidad: '2026-12-01',
      observaciones: 'Pendiente revisión.',
    };

    const actualizado = validarYPrepararFichaMedica(
      {
        rut: '33333333-3',
        estadoClinico: 'Apto',
        tipoSangre: 'AB-',
        observaciones: 'Aprobado en nueva evaluación.',
      },
      existente,
      fechaBase,
    );

    assert.equal(actualizado.peso, 70);
    assert.equal(actualizado.tipoSangre, 'O+');
    assert.equal(actualizado.estadoClinico, 'Apto');
    assert.equal(actualizado.fechaElegibilidad, '2026-11-12');
    assert.equal(actualizado.observaciones, 'Aprobado en nueva evaluación.');
  });

  it('controlador retorna 400 cuando falta RUT en guardado o consulta', async () => {
    const reqPost = { body: {}, params: {} } as unknown as Request;
    const resPost = crearRespuestaSimulada();
    await manejadorGuardarFichaMedica(reqPost, resPost.res);
    assert.equal(resPost.obtenerResultado().statusCode, 400);

    const reqGet = { params: { rut: '  ' } } as unknown as Request;
    const resGet = crearRespuestaSimulada();
    await manejadorObtenerFichaMedica(reqGet, resGet.res);
    assert.equal(resGet.obtenerResultado().statusCode, 400);
  });

  it('determina eliminación de citas al cambiar a Excluyente o Diferido temporalmente', () => {
    assert.equal(
      debeEliminarCitaPorCambioEstado('Excluyente', null, '2026-12-20'),
      true,
    );
    assert.equal(
      debeEliminarCitaPorCambioEstado(
        'Diferido temporalmente',
        '2026-12-10',
        '2026-12-05',
      ),
      true,
    );
    assert.equal(
      debeEliminarCitaPorCambioEstado(
        'Diferido temporalmente',
        '2026-12-10',
        '2026-12-10',
      ),
      false,
    );
    assert.equal(
      debeEliminarCitaPorCambioEstado(
        'Diferido temporalmente',
        '2026-12-10',
        '2026-12-15',
      ),
      false,
    );
    assert.equal(
      debeEliminarCitaPorCambioEstado('Apto', '2026-11-12', '2026-11-20'),
      false,
    );
  });
});
