import { randomBytes } from 'node:crypto';
import { obtenerFechaYMinutosActuales } from '../../lib/fechas.ts';
import {
  esRutValido,
  MENSAJE_RUT_INVALIDO,
  normalizarRut,
} from '../../lib/rut.ts';
import {
  type DatosDonacionPreparados,
  type DatosEntradaDonacionValidados,
  type DonacionDTO,
  type EntradaRegistroDonacion,
  ErrorDonacion,
  ML_MAXIMO_DONACION,
  ML_MINIMO_DONACION,
  type RegistroDonacionDB,
  TIPOS_SANGRE_VALIDOS,
  type TipoSangre,
} from './donaciones.types.ts';

const PATRON_ID_BOLSA = /^[A-Z0-9][A-Z0-9_-]{2,49}$/;

/**
 * Genera un identificador único de bolsa con formato `BOL-YYYYMMDD-XXXXXX`.
 */
export function generarIdBolsa(
  ahora: Date = new Date(),
  sufijoAleatorio?: string,
): string {
  const { fechaActual } = obtenerFechaYMinutosActuales(ahora);
  const fechaCompacta = fechaActual.replace(/-/g, '');
  const sufijo = (sufijoAleatorio ?? randomBytes(3).toString('hex'))
    .trim()
    .toUpperCase();

  return `BOL-${fechaCompacta}-${sufijo}`;
}

/**
 * Normaliza el identificador de bolsa eliminando espacios laterales y convirtiendo a mayúsculas.
 */
export function normalizarIdBolsa(idBolsa: string): string {
  return idBolsa.trim().toUpperCase();
}

/**
 * Valida que el identificador de bolsa tenga entre 3 y 50 caracteres alfanuméricos, guiones o guiones bajos.
 */
export function validarIdBolsa(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new ErrorDonacion(
      'El ID de bolsa es obligatorio y debe ser texto válido.',
      400,
    );
  }

  const normalizado = normalizarIdBolsa(valor);
  if (!PATRON_ID_BOLSA.test(normalizado)) {
    throw new ErrorDonacion(
      'El ID de bolsa debe tener entre 3 y 50 caracteres alfanuméricos, guiones o guiones bajos.',
      400,
    );
  }

  return normalizado;
}

/**
 * Valida que el tipo de sangre pertenezca al catálogo permitido.
 */
export function validarTipoSangreDonacion(valor: unknown): TipoSangre {
  if (typeof valor !== 'string') {
    throw new ErrorDonacion(
      `El tipo de sangre debe ser uno de: ${TIPOS_SANGRE_VALIDOS.join(', ')}.`,
      400,
    );
  }

  const limpio = valor.trim().toUpperCase() as TipoSangre;
  if (!TIPOS_SANGRE_VALIDOS.includes(limpio)) {
    throw new ErrorDonacion(
      `El tipo de sangre debe ser uno de: ${TIPOS_SANGRE_VALIDOS.join(', ')}.`,
      400,
    );
  }

  return limpio;
}

/**
 * Valida que los mililitros extraídos sean un entero finito dentro del rango [50, 1000].
 */
export function validarMlExtraidos(valor: unknown): number {
  const esTipoValido =
    typeof valor === 'number' ||
    (typeof valor === 'string' && valor.trim() !== '');
  const numero = esTipoValido ? Number(valor) : NaN;

  if (
    !Number.isFinite(numero) ||
    !Number.isInteger(numero) ||
    numero < ML_MINIMO_DONACION ||
    numero > ML_MAXIMO_DONACION
  ) {
    throw new ErrorDonacion(
      `Los mililitros extraídos deben ser un número entero entre ${ML_MINIMO_DONACION} y ${ML_MAXIMO_DONACION}.`,
      400,
    );
  }

  return numero;
}

/**
 * Valida y normaliza los campos enviados en la solicitud de registro de extracción.
 */
export function validarEntradaDonacion(
  entrada: EntradaRegistroDonacion,
): DatosEntradaDonacionValidados {
  const rutCrudo = typeof entrada.rut === 'string' ? entrada.rut : '';
  const rut = normalizarRut(rutCrudo);
  if (!esRutValido(rut)) {
    throw new ErrorDonacion(MENSAJE_RUT_INVALIDO, 400);
  }

  const mlExtraidos = validarMlExtraidos(entrada.mlExtraidos);

  return {
    rut,
    mlExtraidos,
  };
}

/**
 * Valida y prepara los datos completos de una donación obteniendo el tipo de sangre desde la ficha médica y asignando un ID de bolsa generado.
 */
export function validarYPrepararDonacion(
  entrada: EntradaRegistroDonacion,
  tipoSangreFicha: string | null | undefined,
  idBolsaGenerado: string = generarIdBolsa(),
): DatosDonacionPreparados {
  const datosEntrada = validarEntradaDonacion(entrada);

  if (!tipoSangreFicha || !tipoSangreFicha.trim()) {
    throw new ErrorDonacion(
      'El donante no tiene un tipo de sangre registrado en su ficha médica. Completa su ficha médica antes de registrar una extracción.',
      400,
    );
  }

  const idBolsa = validarIdBolsa(idBolsaGenerado);
  const tipoSangre = validarTipoSangreDonacion(tipoSangreFicha);

  return {
    ...datosEntrada,
    idBolsa,
    tipoSangre,
  };
}

/**
 * Convierte una fila persistida de donación en su representación DTO serializable.
 */
export function mapearDonacionADTO(fila: RegistroDonacionDB): DonacionDTO {
  return {
    id: fila.id,
    rut: fila.rut,
    idBolsa: fila.idBolsa,
    tipoSangre: fila.tipoSangre,
    mlExtraidos: fila.mlExtraidos,
    fechaDonacion:
      fila.fechaDonacion instanceof Date
        ? fila.fechaDonacion.toISOString()
        : String(fila.fechaDonacion),
  };
}
