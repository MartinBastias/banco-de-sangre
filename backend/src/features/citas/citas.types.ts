import { ErrorDominio } from '../../lib/errores.ts';

export const CAPACIDAD_MAXIMA_BLOQUE = 5;
export const SEDES_VALIDAS = ['cpp', 'spp'] as const;
export const HORARIOS_DISPONIBLES = [
  '09:00',
  '10:00',
  '11:30',
  '14:00',
  '15:30',
] as const;
export const MARGEN_ANTICIPACION_MINUTOS = 0;
export const MAX_DIAS_BUSQUEDA_DISPONIBILIDAD = 90;
export const DIAS_VENTANA_CALENDARIO = 45;

export interface EntradaCita {
  rut: string;
  sede: string;
  fecha: string;
  hora: string;
}

export interface EntradaReagendarCita {
  sede: string;
  fecha: string;
  hora: string;
}

export interface FichaElegibilidad {
  estadoClinico?: string | null;
  fechaElegibilidad?: string | null;
}

export interface CitaOcupada {
  id?: number;
  sede: string;
  fecha: string;
  hora: string;
}

export interface SlotDisponibilidad {
  hora: string;
  cuposDisponibles: number;
  disponible: boolean;
}

export interface ParametrosDisponibilidad {
  ficha: FichaElegibilidad | null;
  sede?: string;
  fechaConsulta?: string;
  citasAgendadas: CitaOcupada[];
  ahora?: Date;
  margenAnticipacionMinutos?: number;
  diasCerrados?: ReadonlySet<string>;
  maxDiasBusqueda?: number;
}

export type ResultadoDisponibilidad =
  | {
      elegible: false;
      estadoClinico: string;
      motivo: string;
    }
  | {
      elegible: true;
      estadoClinico: string;
      fechaBase: string;
      fechaMinimaDisponible: string;
      avanzadaPorDisponibilidad: boolean;
      fechaConsultada: string;
      slotsFechaConsultada: SlotDisponibilidad[];
      diasSinCupos: string[];
    };

export class ErrorCita extends ErrorDominio {}
