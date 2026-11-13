import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { manejadorVerificarElegibilidad } from '../../../src/features/elegibilidad/elegibilidad.controller.ts';
import {
  calcularFechaElegibilidadBiologica,
  verificarElegibilidad,
} from '../../../src/features/elegibilidad/elegibilidad.service.ts';
import { invocarControladorSincrono } from '../../helpers/http-mock.ts';

describe('Servicio de Elegibilidad Biológica (RF-03 & RF-05)', () => {
  describe('Cálculo de fecha de elegibilidad biológica (RF-03)', () => {
    it('agrega 3 meses a la última donación cuando el donante es Hombre (M)', () => {
      const resultado = calcularFechaElegibilidadBiologica('2026-06-10', 'M');
      assert.equal(resultado, '2026-09-10');
    });

    it('agrega 4 meses a la última donación cuando el donante es Mujer (F)', () => {
      const resultado = calcularFechaElegibilidadBiologica('2026-06-10', 'F');
      assert.equal(resultado, '2026-10-10');
    });

    it('retorna null cuando el donante no tiene donaciones previas', () => {
      const resultado = calcularFechaElegibilidadBiologica(null, 'M');
      assert.equal(resultado, null);
    });
  });

  describe('Verificación de estado de donante y diferimiento (RF-05)', () => {
    const hoySimulado = '2026-11-10';

    it('retorna Excluyente cuando el estado clínico es "Excluyente"', () => {
      const resultado = verificarElegibilidad(
        {
          sexo: 'M',
          estadoClinico: 'Excluyente',
          ultimaDonacion: '2026-01-01',
        },
        hoySimulado,
      );

      assert.equal(resultado.apto, false);
      assert.equal(resultado.estadoClinico, 'Excluyente');
      assert.equal(
        resultado.motivo,
        'Debido a test de elegibilidad, el donante ha quedado en estado Excluyente.',
      );
      assert.equal(resultado.fechaElegibilidad, null);
    });

    it('retorna Diferido temporalmente cuando el donante se encuentra diferido temporalmente', () => {
      const resultado = verificarElegibilidad(
        {
          sexo: 'F',
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2026-11-20',
          ultimaDonacion: '2026-01-01',
        },
        hoySimulado,
      );

      assert.equal(resultado.apto, false);
      assert.equal(resultado.estadoClinico, 'Diferido temporalmente');
      assert.equal(
        resultado.motivo,
        'El donante se encuentra diferido temporalmente',
      );
      assert.equal(resultado.fechaElegibilidad, '2026-11-20');
    });

    it('retorna Diferido temporalmente cuando el donante es hombre y no han transcurrido 3 meses', () => {
      const resultado = verificarElegibilidad(
        {
          sexo: 'M',
          estadoClinico: 'Apto',
          ultimaDonacion: '2026-10-01',
        },
        hoySimulado,
      );

      assert.equal(resultado.apto, false);
      assert.equal(resultado.estadoClinico, 'Diferido temporalmente');
      assert.match(resultado.motivo, /periodo de espera biológica \(3 meses\)/);
      assert.equal(resultado.fechaElegibilidad, '2027-01-01');
    });

    it('retorna Apto cuando es mujer y han transcurrido más de 4 meses sin restricciones', () => {
      const resultado = verificarElegibilidad(
        {
          sexo: 'F',
          estadoClinico: 'Apto',
          ultimaDonacion: '2026-06-01',
        },
        hoySimulado,
      );

      assert.equal(resultado.apto, true);
      assert.equal(resultado.estadoClinico, 'Apto');
      assert.equal(
        resultado.motivo,
        'El donante cumple con los requisitos de elegibilidad',
      );
      assert.equal(resultado.fechaElegibilidad, '2026-10-01');
    });
  });

  describe('Endpoint POST /api/donantes/verificar-elegibilidad', () => {
    it('retorna "Excluyente" cuando el donante es "Excluyente"', () => {
      const response = invocarControladorSincrono(
        manejadorVerificarElegibilidad,
        {
          sexo: 'M',
          estadoClinico: 'Excluyente',
        },
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.estadoClinico, 'Excluyente');
      assert.equal(response.body.apto, false);
      assert.equal(
        response.body.motivo,
        'Debido a test de elegibilidad, el donante ha quedado en estado Excluyente.',
      );
    });

    it('retorna "Diferido temporalmente" cuando el donante está diferido temporalmente', () => {
      const response = invocarControladorSincrono(
        manejadorVerificarElegibilidad,
        {
          sexo: 'F',
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2026-12-01',
        },
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.estadoClinico, 'Diferido temporalmente');
      assert.equal(response.body.apto, false);
      assert.equal(
        response.body.motivo,
        'El donante se encuentra diferido temporalmente',
      );
      assert.equal(response.body.fechaElegibilidad, '2026-12-01');
    });

    it('retorna 400 cuando faltan datos obligatorios (sexo o estadoClinico)', () => {
      const response = invocarControladorSincrono(
        manejadorVerificarElegibilidad,
        { sexo: 'M' },
      );
      assert.equal(response.statusCode, 400);
      assert.match(
        String(response.body.error),
        /Los campos "sexo" y "estadoClinico"/,
      );
    });
  });
});
