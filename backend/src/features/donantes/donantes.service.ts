import { ErrorDominio } from '../../lib/errores.ts';
import {
  calcularDigitoVerificador,
  esRutValido,
  MENSAJE_RUT_INVALIDO,
  normalizarRut,
} from '../../lib/rut.ts';
import {
  buscarDonantePorRutDB,
  insertarDonanteDB,
  listarDonantesConEstadoDB,
} from './donantes.repository.ts';

export { calcularDigitoVerificador, esRutValido, normalizarRut };

export class ErrorDonante extends ErrorDominio {}

/**
 * Registra un nuevo donante usando su RUT.
 */
export async function registrarDonante(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);

  if (!esRutValido(rut)) {
    throw new ErrorDonante(MENSAJE_RUT_INVALIDO, 400);
  }

  const existente = await buscarDonantePorRutDB(rut);
  if (existente) {
    throw new ErrorDonante(
      'El donante con este RUT ya se encuentra registrado.',
      409,
    );
  }

  return insertarDonanteDB(rut);
}

/**
 * Busca un donante registrado por su RUT.
 */
export async function buscarDonantePorRut(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);
  if (!rut) {
    return null;
  }

  return buscarDonantePorRutDB(rut);
}

/**
 * Lista todos los donantes registrados junto con su estado clínico actual.
 */
export async function listarDonantesConEstado() {
  return listarDonantesConEstadoDB();
}
