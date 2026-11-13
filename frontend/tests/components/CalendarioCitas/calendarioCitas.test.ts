import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calcularFechaMinima,
  esHoraPasada,
  formatearFechaIsoLocal,
} from '../../../src/components/CalendarioCitas/calendarioCitas.utils.ts';

describe('Utilidades de CalendarioCitas', () => {
  it('formatea correctamente una fecha local en formato ISO YYYY-MM-DD', () => {
    const fecha = new Date(2026, 10, 13);
    assert.equal(formatearFechaIsoLocal(fecha), '2026-11-13');
  });

  it('detecta correctamente si una hora ya pasó respecto a la hora de referencia', () => {
    const fecha = new Date(2026, 10, 13, 0, 0, 0, 0);
    const ref1410 = new Date(2026, 10, 13, 14, 10, 0, 0);

    assert.equal(esHoraPasada(fecha, '14:00', ref1410), true);
    assert.equal(esHoraPasada(fecha, '14:10', ref1410), true);
    assert.equal(esHoraPasada(fecha, '15:30', ref1410), false);
  });

  it('avanza automáticamente la fecha mínima al día siguiente cuando todos los bloques de hoy ya pasaron', () => {
    const ref1600 = new Date(2026, 10, 13, 16, 0, 0, 0);
    const minima = calcularFechaMinima(null, ref1600);
    assert.equal(formatearFechaIsoLocal(minima), '2026-11-14');
  });

  it('respeta la fecha mínima explícita si es posterior al cálculo local', () => {
    const ref1000 = new Date(2026, 10, 13, 10, 0, 0, 0);
    const minima = calcularFechaMinima('2026-11-25', ref1000);
    assert.equal(formatearFechaIsoLocal(minima), '2026-11-25');
  });
});
