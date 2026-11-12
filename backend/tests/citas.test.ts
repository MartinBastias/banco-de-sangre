import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ErrorCita,
  validarElegibilidadParaCita,
} from '../src/features/citas/citas.service.ts';

describe('Validación de elegibilidad para agendar citas', () => {
  it('permite agendar cuando no existe ficha médica o el estado es Apto', () => {
    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(null, '2026-11-20');
    });

    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        { estadoClinico: 'Apto', fechaElegibilidad: '2026-11-12' },
        '2026-11-12',
      );
    });
  });

  it('bloquea citas para donantes con estado Excluyente', () => {
    assert.throws(
      () =>
        validarElegibilidadParaCita(
          { estadoClinico: 'Excluyente', fechaElegibilidad: null },
          '2026-11-20',
        ),
      ErrorCita,
    );
  });

  it('bloquea citas anteriores a fechaElegibilidad cuando está Diferido temporalmente', () => {
    assert.throws(
      () =>
        validarElegibilidadParaCita(
          {
            estadoClinico: 'Diferido temporalmente',
            fechaElegibilidad: '2027-02-12',
          },
          '2027-02-11',
        ),
      /2027-02-12/,
    );
  });

  it('permite citas desde fechaElegibilidad en adelante cuando está Diferido temporalmente', () => {
    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        {
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2027-02-12',
        },
        '2027-02-12',
      );
    });

    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        {
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2027-02-12',
        },
        '2027-03-01',
      );
    });
  });
});
