import type { EstadoClinico } from '../ficha-medica/ficha-medica.service.ts';

export interface EntradaElegibilidadDonante {
  sexo: string;
  estadoClinico: EstadoClinico;
  ultimaDonacion?: string | null;
  fechaElegibilidad?: string | null;
}

export interface ResultadoElegibilidad {
  apto: boolean;
  estadoClinico: EstadoClinico;
  motivo: string;
  fechaElegibilidad: string | null;
}

/**
 * Calcula la próxima fecha de elegibilidad según el tiempo de recuperación biológico (RF-03).
 * Utiliza aritmética UTC para evitar desfases de zona horaria.
 */
export function calcularFechaElegibilidadBiologica(
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

/**
 * Evalúa la elegibilidad del donante y diferimientos activos (RF-05).
 */
export function verificarElegibilidad(
  donante: EntradaElegibilidadDonante,
  fechaReferencia: string | null = null,
): ResultadoElegibilidad {
  const hoy = fechaReferencia || new Date().toISOString().split('T')[0];

  if (donante.estadoClinico === 'Excluyente') {
    return {
      apto: false,
      estadoClinico: 'Excluyente',
      motivo:
        'Debido a test de elegibilidad, el donante ha quedado en estado Excluyente.',
      fechaElegibilidad: null,
    };
  }

  const fechaBiologica = calcularFechaElegibilidadBiologica(
    donante.ultimaDonacion,
    donante.sexo,
  );

  if (donante.estadoClinico === 'Diferido temporalmente') {
    if (!donante.fechaElegibilidad || donante.fechaElegibilidad > hoy) {
      let proximaFecha = donante.fechaElegibilidad || null;
      if (
        proximaFecha &&
        fechaBiologica &&
        fechaBiologica > proximaFecha
      ) {
        proximaFecha = fechaBiologica;
      }

      return {
        apto: false,
        estadoClinico: 'Diferido temporalmente',
        motivo: 'El donante se encuentra diferido temporalmente',
        fechaElegibilidad: proximaFecha,
      };
    }
  }

  if (fechaBiologica && fechaBiologica > hoy) {
    return {
      apto: false,
      estadoClinico: 'Diferido temporalmente',
      motivo: `El donante se encuentra en periodo de espera biológica (${donante.sexo === 'M' ? '3 meses' : '4 meses'})`,
      fechaElegibilidad: fechaBiologica,
    };
  }

  return {
    apto: true,
    estadoClinico: 'Apto',
    motivo: 'El donante cumple con los requisitos de elegibilidad',
    fechaElegibilidad: fechaBiologica || hoy,
  };
}
