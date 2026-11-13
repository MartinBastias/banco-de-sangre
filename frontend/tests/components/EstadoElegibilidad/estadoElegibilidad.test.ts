import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  esDonanteElegible,
  normalizarEstadoElegibilidad,
} from '../../../src/components/EstadoElegibilidad/estadoElegibilidad.utils.ts';

describe('Utilidades de EstadoElegibilidad', () => {
  it('normaliza estados clínicos removiendo tildes y estandarizando separadores', () => {
    assert.equal(normalizarEstadoElegibilidad('Apto'), 'apto');
    assert.equal(
      normalizarEstadoElegibilidad('Diferido temporalmente'),
      'diferido_temporalmente',
    );
    assert.equal(normalizarEstadoElegibilidad('Excluyente'), 'excluyente');
    assert.equal(normalizarEstadoElegibilidad(null), '');
  });

  it('determina elegibilidad únicamente para estado Apto', () => {
    assert.equal(esDonanteElegible({ estadoClinico: 'Apto' }), true);
    assert.equal(
      esDonanteElegible({ estadoClinico: 'Diferido temporalmente' }),
      false,
    );
    assert.equal(esDonanteElegible({ estadoClinico: 'Excluyente' }), false);
    assert.equal(esDonanteElegible(null), false);
  });
});
