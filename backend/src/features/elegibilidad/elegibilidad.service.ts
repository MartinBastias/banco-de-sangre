export interface EntradaElegibilidadDonante {
  sexo: string;
  estadoMedico: string;
  ultimaDonacion?: string | null;
  fechaFinDiferimiento?: string | null;
}

export type DonorEligibilityInput = EntradaElegibilidadDonante;

export interface ResultadoElegibilidad {
  habilitado: boolean;
  estado: 'Habilitado' | 'Inhabilitado';
  motivo: string;
  proximaFechaHabil: string | null;
}

export type EligibilityResult = ResultadoElegibilidad;

/**
 * Calcula la próxima fecha hábil de donación según el tiempo de recuperación biológico (RF-03).
 * Utiliza aritmética UTC para evitar desfases de zona horaria.
 */
export function calcularProximaFechaHabil(
  ultimaDonacion: string | null | undefined,
  sexo: string,
): string | null {
  if (!ultimaDonacion) return null;

  const [anio, mes, dia] = ultimaDonacion.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  const mesesEspera = sexo === 'M' || sexo === 'Hombre' ? 3 : 4;
  fecha.setUTCMonth(fecha.getUTCMonth() + mesesEspera);

  return fecha.toISOString().split('T')[0];
}

export const calculateNextEligibleDate = calcularProximaFechaHabil;

/**
 * Evalúa la elegibilidad del donante y diferimientos activos (RF-05).
 */
export function verificarElegibilidad(
  donante: EntradaElegibilidadDonante,
  fechaReferencia: string | null = null,
): ResultadoElegibilidad {
  const hoy = fechaReferencia || new Date().toISOString().split('T')[0];

  if (donante.estadoMedico === 'No apto permanentemente') {
    return {
      habilitado: false,
      estado: 'Inhabilitado',
      motivo:
        'Debido a test de elegibilidad, el donante ha quedado no apto permanentemente.',
      proximaFechaHabil: null,
    };
  }

  const fechaBiologica = calcularProximaFechaHabil(
    donante.ultimaDonacion,
    donante.sexo,
  );

  if (donante.estadoMedico === 'Diferido temporalmente') {
    if (!donante.fechaFinDiferimiento || donante.fechaFinDiferimiento > hoy) {
      let proximaFecha = donante.fechaFinDiferimiento || null;
      if (
        proximaFecha &&
        fechaBiologica &&
        fechaBiologica > proximaFecha
      ) {
        proximaFecha = fechaBiologica;
      }

      return {
        habilitado: false,
        estado: 'Inhabilitado',
        motivo: 'El donante se encuentra diferido temporalmente',
        proximaFechaHabil: proximaFecha,
      };
    }
  }

  if (fechaBiologica && fechaBiologica > hoy) {
    return {
      habilitado: false,
      estado: 'Inhabilitado',
      motivo: `El donante se encuentra en periodo de espera biológica (${donante.sexo === 'M' ? '3 meses' : '4 meses'})`,
      proximaFechaHabil: fechaBiologica,
    };
  }

  return {
    habilitado: true,
    estado: 'Habilitado',
    motivo: 'El donante cumple con los requisitos de elegibilidad',
    proximaFechaHabil: fechaBiologica || hoy,
  };
}

export const verifyEligibility = verificarElegibilidad;
