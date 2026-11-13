import { ErrorDominio } from '../../lib/errores.ts';

export const ESTADOS_CLINICOS_VALIDOS = [
  'Apto',
  'Diferido temporalmente',
  'Excluyente',
] as const;

export type EstadoClinico = (typeof ESTADOS_CLINICOS_VALIDOS)[number];

export const TIPOS_SANGRE_VALIDOS = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
] as const;

export type TipoSangre = (typeof TIPOS_SANGRE_VALIDOS)[number];

export const UNIDADES_TIEMPO_ESTIMADO = ['dias', 'meses', 'anios'] as const;
export type UnidadTiempoEstimado = (typeof UNIDADES_TIEMPO_ESTIMADO)[number];

export class ErrorFichaMedica extends ErrorDominio {}

export interface EntradaFormularioFichaMedica {
  rut: string;
  peso?: number | string | null;
  estadoClinico?: string | null;
  tipoSangre?: string | null;
  tiempoEstimadoCantidad?: number | string | null;
  tiempoEstimadoUnidad?: string | null;
  fechaElegibilidad?: string | null;
  observaciones?: string | null;
}

export interface RegistroFichaMedicaDB {
  rut: string;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
  fechaActualizacion?: Date | null;
}

export interface FichaMedicaDTO {
  rut: string;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
  fechaActualizacion: Date | null;
}

export interface DatosFichaMedicaPreparados {
  rut: string;
  peso: number;
  estadoClinico: EstadoClinico;
  tipoSangre: string;
  fechaElegibilidad: string | null;
  observaciones: string | null;
}
