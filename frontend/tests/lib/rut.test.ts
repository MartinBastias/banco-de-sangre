import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  esRutValido,
  formatearRut,
  normalizarRut,
} from '../../src/lib/rut.ts';

describe('Utilidades de formato y validación de RUT', () => {
  it('agrega puntos y guion automáticamente al escribir dígitos', () => {
    assert.equal(formatearRut('1'), '1');
    assert.equal(formatearRut('12'), '1-2');
    assert.equal(formatearRut('1234'), '123-4');
    assert.equal(formatearRut('12345'), '1.234-5');
    assert.equal(formatearRut('12345678'), '1.234.567-8');
    assert.equal(formatearRut('123456789'), '12.345.678-9');
  });

  it('permite la letra k/K únicamente después del guion (como dígito verificador)', () => {
    assert.equal(formatearRut('12345678k'), '12.345.678-K');
    assert.equal(formatearRut('12.345.678-k'), '12.345.678-K');
    assert.equal(formatearRut('1234567k'), '1.234.567-K');
  });

  it('bloquea letras distintas de K y no permite K fuera de la posición posterior al guion', () => {
    assert.equal(formatearRut('k'), '');
    assert.equal(formatearRut('K'), '');
    assert.equal(formatearRut('12k345678'), '1.234.567-8');
    assert.equal(formatearRut('12abc345def678k'), '12.345.678-K');
    assert.equal(formatearRut('12345678a'), '1.234.567-8');
  });

  it('limita el largo máximo a 8 dígitos de cuerpo más dígito verificador', () => {
    assert.equal(formatearRut('123456789012'), '12.345.678-9');
  });

  it('normaliza y valida correctamente el formato y dígito verificador (Módulo 11)', () => {
    assert.equal(normalizarRut(' 12.345.678-5 '), '12345678-5');
    assert.equal(esRutValido('12.345.678-5'), true);
    assert.equal(esRutValido('11.111.112-k'), true);
    assert.equal(esRutValido('1.234.567-4'), true);
    assert.equal(esRutValido('11111111-1'), true);

    assert.equal(esRutValido('12.345.678-9'), false);
    assert.equal(esRutValido('11.111.111-K'), false);
    assert.equal(esRutValido('12K45678-9'), false);
    assert.equal(esRutValido('12345678-A'), false);
    assert.equal(esRutValido('123456-7'), false);
    assert.equal(esRutValido('123456785'), false);
    assert.equal(esRutValido(''), false);
  });
});
