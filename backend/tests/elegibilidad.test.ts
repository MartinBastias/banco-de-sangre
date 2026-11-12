import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { manejadorVerificarElegibilidad } from '../src/features/elegibilidad/elegibilidad.routes.ts';
import {
  calcularProximaFechaHabil,
  verificarElegibilidad,
} from '../src/features/elegibilidad/elegibilidad.service.ts';

function invocarManejador(body: Record<string, unknown>) {
  let statusCode = 200;
  let responseBody: Record<string, unknown> = {};

  const req = { body } as Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      responseBody = payload;
      return this;
    },
  } as unknown as Response;

  manejadorVerificarElegibilidad(req, res);
  return { statusCode, body: responseBody };
}

describe('Servicio de Elegibilidad Biológica (RF-03 & RF-05)', () => {
  describe('Cálculo de próxima fecha hábil (RF-03)', () => {
    it('agrega 3 meses a la última donación cuando el donante es Hombre (M)', () => {
      const result = calcularProximaFechaHabil('2026-06-10', 'M');
      assert.equal(result, '2026-09-10');
    });

    it('agrega 4 meses a la última donación cuando el donante es Mujer (F)', () => {
      const result = calcularProximaFechaHabil('2026-06-10', 'F');
      assert.equal(result, '2026-10-10');
    });

    it('retorna null cuando el donante no tiene donaciones previas', () => {
      const result = calcularProximaFechaHabil(null, 'M');
      assert.equal(result, null);
    });
  });

  describe('Verificación de estado de donante y diferimiento (RF-05)', () => {
    const hoySimulado = '2026-11-10';

    it('retorna Inhabilitado cuando el estado es "No apto permanentemente"', () => {
      const result = verificarElegibilidad(
        {
          sexo: 'M',
          estadoMedico: 'No apto permanentemente',
          ultimaDonacion: '2026-01-01',
        },
        hoySimulado,
      );

      assert.equal(result.habilitado, false);
      assert.equal(result.estado, 'Inhabilitado');
      assert.equal(
        result.motivo,
        'Debido a test de elegibilidad, el donante ha quedado no apto permanentemente.',
      );
      assert.equal(result.proximaFechaHabil, null);
    });

    it('retorna Inhabilitado cuando el donante se encuentra diferido temporalmente', () => {
      const result = verificarElegibilidad(
        {
          sexo: 'F',
          estadoMedico: 'Diferido temporalmente',
          fechaFinDiferimiento: '2026-11-20',
          ultimaDonacion: '2026-01-01',
        },
        hoySimulado,
      );

      assert.equal(result.habilitado, false);
      assert.equal(result.estado, 'Inhabilitado');
      assert.equal(
        result.motivo,
        'El donante se encuentra diferido temporalmente',
      );
      assert.equal(result.proximaFechaHabil, '2026-11-20');
    });

    it('retorna Inhabilitado cuando el donante es hombre y no han transcurrido 3 meses', () => {
      const result = verificarElegibilidad(
        {
          sexo: 'M',
          estadoMedico: 'Apto',
          ultimaDonacion: '2026-10-01',
        },
        hoySimulado,
      );

      assert.equal(result.habilitado, false);
      assert.equal(result.estado, 'Inhabilitado');
      assert.match(result.motivo, /periodo de espera biológica \(3 meses\)/);
      assert.equal(result.proximaFechaHabil, '2027-01-01');
    });

    it('retorna Habilitado cuando es mujer y han transcurrido más de 4 meses sin restricciones', () => {
      const result = verificarElegibilidad(
        {
          sexo: 'F',
          estadoMedico: 'Apto',
          ultimaDonacion: '2026-06-01',
        },
        hoySimulado,
      );

      assert.equal(result.habilitado, true);
      assert.equal(result.estado, 'Habilitado');
      assert.equal(
        result.motivo,
        'El donante cumple con los requisitos de elegibilidad',
      );
      assert.equal(result.proximaFechaHabil, '2026-10-01');
    });
  });

  describe('Endpoint POST /api/donantes/verificar-elegibilidad', () => {
    it('retorna "Inhabilitado" cuando el donante es "No apto permanentemente"', () => {
      const response = invocarManejador({
        sexo: 'M',
        estadoMedico: 'No apto permanentemente',
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.estado, 'Inhabilitado');
      assert.equal(response.body.habilitado, false);
      assert.equal(
        response.body.motivo,
        'Debido a test de elegibilidad, el donante ha quedado no apto permanentemente.',
      );
    });

    it('retorna "Inhabilitado" cuando el donante está diferido temporalmente', () => {
      const response = invocarManejador({
        sexo: 'F',
        estadoMedico: 'Diferido temporalmente',
        fechaFinDiferimiento: '2026-12-01',
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.estado, 'Inhabilitado');
      assert.equal(response.body.habilitado, false);
      assert.equal(
        response.body.motivo,
        'El donante se encuentra diferido temporalmente',
      );
      assert.equal(response.body.proximaFechaHabil, '2026-12-01');
    });

    it('retorna 400 cuando faltan datos obligatorios (sexo o estadoMedico)', () => {
      const response = invocarManejador({ sexo: 'M' });
      assert.equal(response.statusCode, 400);
      assert.match(
        String(response.body.error),
        /Los campos "sexo" y "estadoMedico" son obligatorios/,
      );
    });
  });
});
