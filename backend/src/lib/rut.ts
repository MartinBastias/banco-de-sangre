export const MENSAJE_RUT_INVALIDO =
  'El RUT debe contener solo números y, después del guion, un dígito o la letra K (ej: 12.345.678-K).';

/**
 * Normaliza el RUT eliminando puntos y espacios, y convirtiendo a mayúsculas.
 */
export function normalizarRut(rut: string): string {
  return rut.trim().replace(/\./g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador de un RUT chileno usando algoritmo Módulo 11.
 */
export function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/**
 * Valida que el RUT tenga 7 u 8 dígitos numéricos, guion y dígito verificador válido (Módulo 11).
 */
export function esRutValido(rutCrudo: string): boolean {
  const normalizado = normalizarRut(rutCrudo);
  const coincidencia = /^(\d{7,8})-([0-9K])$/.exec(normalizado);
  if (!coincidencia) return false;

  const [, cuerpo, dv] = coincidencia;
  return calcularDigitoVerificador(cuerpo) === dv;
}
