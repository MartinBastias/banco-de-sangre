import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ML_MAXIMO_DONACION,
  ML_MINIMO_DONACION,
  formatearOpcionDonante,
  validarFormularioDonacion,
} from '../../../src/components/SeleccionPerfil/registroDonacion.utils.ts';

describe('Utilidades de registro de extracción/donación de sangre', () => {
  it('acepta un formulario válido en el rango permitido de mililitros', () => {
    assert.equal(
      validarFormularioDonacion({
        rut: '12.345.678-5',
        tipoSangreFicha: 'O+',
        mlExtraidos: '450',
      }),
      null,
    );

    assert.equal(
      validarFormularioDonacion({
        rut: '11111111-1',
        tipoSangreFicha: 'AB-',
        mlExtraidos: ML_MINIMO_DONACION,
      }),
      null,
    );

    assert.equal(
      validarFormularioDonacion({
        rut: '1.234.567-4',
        tipoSangreFicha: 'A-',
        mlExtraidos: ML_MAXIMO_DONACION,
      }),
      null,
    );
  });

  it('rechaza formularios sin donante seleccionado o con RUT inválido', () => {
    assert.ok(
      validarFormularioDonacion({
        rut: '',
        tipoSangreFicha: 'O+',
        mlExtraidos: 450,
      }),
    );

    assert.ok(
      validarFormularioDonacion({
        rut: '12.345.678-9',
        tipoSangreFicha: 'O+',
        mlExtraidos: 450,
      }),
    );
  });

  it('rechaza donantes sin tipo de sangre en ficha médica o con tipo no reconocido', () => {
    assert.ok(
      validarFormularioDonacion({
        rut: '12.345.678-5',
        tipoSangreFicha: null,
        mlExtraidos: 450,
      }),
    );

    assert.ok(
      validarFormularioDonacion({
        rut: '12.345.678-5',
        tipoSangreFicha: '',
        mlExtraidos: 450,
      }),
    );

    assert.ok(
      validarFormularioDonacion({
        rut: '12.345.678-5',
        tipoSangreFicha: 'X+',
        mlExtraidos: 450,
      }),
    );
  });

  it('rechaza cantidades en ml vacías, no enteras o fuera del rango permitido', () => {
    for (const valorInvalido of [
      '',
      'abc',
      450.5,
      '450.5',
      ML_MINIMO_DONACION - 1,
      ML_MAXIMO_DONACION + 1,
      0,
      -200,
    ]) {
      assert.ok(
        validarFormularioDonacion({
          rut: '12.345.678-5',
          tipoSangreFicha: 'O+',
          mlExtraidos: valorInvalido,
        }),
        `Debió rechazar mlExtraidos=${String(valorInvalido)}`,
      );
    }
  });

  it('formatea las opciones del selector de donantes con y sin ficha previa', () => {
    assert.equal(
      formatearOpcionDonante({
        rut: '12.345.678-5',
        tipoSangre: 'O+',
        estadoClinico: 'Apto',
      }),
      '12.345.678-5 — O+ (Apto)',
    );

    assert.equal(
      formatearOpcionDonante({
        rut: '12345678-5',
        tipoSangre: 'A-',
        estadoClinico: 'Apto',
      }),
      '12.345.678-5 — A- (Apto)',
    );

    assert.equal(
      formatearOpcionDonante({
        rut: '12.345.678-5',
        tipoSangre: null,
        estadoClinico: null,
      }),
      '12.345.678-5 — Sin tipo registrado (Sin ficha)',
    );
  });
});
