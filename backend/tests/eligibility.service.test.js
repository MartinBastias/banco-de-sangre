const { calcularProximaFechaHabil, verificarElegibilidad } = require('../src/services/eligibility.service');

describe('Servicio de Elegibilidad Biológica (RF-03 y RF-05)', () => {

  // Pruebas para RF-03: Plazos según sexo
  describe('Cálculo de próxima fecha hábil (RF-03)', () => {
    test('Debe sumar 3 meses a la última donación si el donante es Hombre (M)', () => {
      const ultimaDonacion = '2026-06-10';
      const resultado = calcularProximaFechaHabil(ultimaDonacion, 'M');
      expect(resultado).toBe('2026-09-10');
    });

    test('Debe sumar 4 meses a la última donación si el donante es Mujer (F)', () => {
      const ultimaDonacion = '2026-06-10';
      const resultado = calcularProximaFechaHabil(ultimaDonacion, 'F');
      expect(resultado).toBe('2026-10-10');
    });

    test('Si no tiene donaciones previas (null), no hay fecha de espera', () => {
      const resultado = calcularProximaFechaHabil(null, 'M');
      expect(resultado).toBeNull();
    });
  });

  // Pruebas para RF-05 y validación integral
  describe('Verificación de estado y bloqueos del donante (RF-05)', () => {
    const fechaActualSimulada = '2026-11-10';

    test('Debe retornar inhabilitado si el estado es "No apto permanentemente"', () => {
      const donante = {
        sexo: 'M',
        estadoMedico: 'No apto permanentemente',
        ultimaDonacion: '2025-01-01'
      };

      const respuesta = verificarElegibilidad(donante, fechaActualSimulada);
      expect(respuesta.habilitado).toBe(false);
      expect(respuesta.estado).toBe('Inhabilitado');
      expect(respuesta.motivo).toMatch(/No apto permanentemente/i);
    });

    test('Debe retornar inhabilitado si está "Diferido temporalmente"', () => {
      const donante = {
        sexo: 'F',
        estadoMedico: 'Diferido temporalmente',
        fechaFinDiferimiento: '2026-12-15',
        ultimaDonacion: '2026-01-10'
      };

      const respuesta = verificarElegibilidad(donante, fechaActualSimulada);
      expect(respuesta.habilitado).toBe(false);
      expect(respuesta.estado).toBe('Inhabilitado');
      expect(respuesta.proximaFechaHabil).toBe('2026-12-15');
    });

    test('Debe retornar inhabilitado si es Hombre y han pasado menos de 3 meses', () => {
      const donante = {
        sexo: 'M',
        estadoMedico: 'Apto',
        ultimaDonacion: '2026-09-15' // 3 meses se cumplen el 2026-12-15
      };

      const respuesta = verificarElegibilidad(donante, fechaActualSimulada);
      expect(respuesta.habilitado).toBe(false);
      expect(respuesta.estado).toBe('Inhabilitado');
      expect(respuesta.proximaFechaHabil).toBe('2026-12-15');
    });

    test('Debe retornar habilitado si es Mujer y ya pasaron más de 4 meses sin restricciones', () => {
      const donante = {
        sexo: 'F',
        estadoMedico: 'Apto',
        ultimaDonacion: '2026-06-01' // 4 meses se cumplieron el 2026-10-01
      };

      const respuesta = verificarElegibilidad(donante, fechaActualSimulada);
      expect(respuesta.habilitado).toBe(true);
      expect(respuesta.estado).toBe('Habilitado');
      expect(respuesta.proximaFechaHabil).toBe('2026-10-01');
    });
  });
});