import { ErrorDominio } from '../../lib/errores.ts';
import {
  TIPOS_SANGRE_VALIDOS,
  type TipoSangre,
} from '../ficha-medica/ficha-medica.types.ts';

export { TIPOS_SANGRE_VALIDOS, type TipoSangre };

export const ML_MINIMO_DONACION = 50;
export const ML_MAXIMO_DONACION = 1000;

/**
 * Error de dominio específico para validaciones y reglas de donaciones.
 */
export class ErrorDonacion extends ErrorDominio {}

export interface EntradaRegistroDonacion {
  rut: string;
  mlExtraidos: number | string;
}

export interface DatosEntradaDonacionValidados {
  rut: string;
  mlExtraidos: number;
}

export interface DatosDonacionPreparados extends DatosEntradaDonacionValidados {
  idBolsa: string;
  tipoSangre: TipoSangre;
}

export interface RegistroDonacionDB {
  id: number;
  rut: string;
  idBolsa: string;
  tipoSangre: string;
  mlExtraidos: number;
  fechaDonacion: Date | string;
}

export interface DonacionDTO {
  id: number;
  rut: string;
  idBolsa: string;
  tipoSangre: string;
  mlExtraidos: number;
  fechaDonacion: string;
}
