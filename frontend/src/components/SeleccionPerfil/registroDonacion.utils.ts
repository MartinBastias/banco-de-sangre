import { TIPOS_SANGRE } from '../../lib/constantes.ts';
import { esRutValido, formatearRut } from '../../lib/rut.ts';

export const ML_MINIMO_DONACION = 50;
export const ML_MAXIMO_DONACION = 1000;

export interface DonanteParaDonacion {
  rut: string;
  tipoSangre: string | null;
  estadoClinico: string | null;
}

export interface DatosFormularioDonacion {
  rut: string;
  tipoSangreFicha: string | null;
  mlExtraidos: string | number;
}

export interface DonacionRegistrada {
  id: number;
  rut: string;
  idBolsa: string;
  tipoSangre: string;
  mlExtraidos: number;
  fechaDonacion: string;
}

/**
 * Valida los datos del formulario de registro de extracción/donación de sangre.
 * Retorna un mensaje descriptivo en caso de error, o `null` si todos los campos son válidos.
 */
export function validarFormularioDonacion(
  datos: DatosFormularioDonacion,
): string | null {
  if (!datos.rut.trim()) {
    return 'Debes seleccionar un donante registrado.';
  }

  if (!esRutValido(datos.rut)) {
    return 'El RUT del donante seleccionado no es válido.';
  }

  if (
    !datos.tipoSangreFicha ||
    !(TIPOS_SANGRE as readonly string[]).includes(datos.tipoSangreFicha)
  ) {
    return 'El donante seleccionado no tiene un tipo de sangre registrado en su ficha médica. Completa su ficha médica antes de registrar una extracción.';
  }

  const textoMl =
    typeof datos.mlExtraidos === 'string'
      ? datos.mlExtraidos.trim()
      : String(datos.mlExtraidos);

  if (!textoMl) {
    return 'Debes ingresar la cantidad de sangre extraída en ml.';
  }

  const ml = Number(textoMl);
  if (
    !Number.isInteger(ml) ||
    ml < ML_MINIMO_DONACION ||
    ml > ML_MAXIMO_DONACION
  ) {
    return `La cantidad extraída debe ser un número entero entre ${ML_MINIMO_DONACION} y ${ML_MAXIMO_DONACION} ml.`;
  }

  return null;
}

/**
 * Formatea la etiqueta legible de un donante para el selector de extracción.
 */
export function formatearOpcionDonante(donante: DonanteParaDonacion): string {
  const rutLegible = formatearRut(donante.rut) || donante.rut;
  const tipo = donante.tipoSangre?.trim() || 'Sin tipo registrado';
  const estado = donante.estadoClinico?.trim() || 'Sin ficha';
  return `${rutLegible} — ${tipo} (${estado})`;
}
