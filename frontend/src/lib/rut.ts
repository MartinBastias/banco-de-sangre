/**
 * Formatea un RUT chileno automáticamente con puntos y guion mientras se escribe.
 * Solo permite números en el cuerpo y únicamente un dígito o la letra "K" después del guion.
 */
export function formatearRut(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);

  if (!limpio) {
    return '';
  }

  if (limpio.length === 1) {
    return limpio === 'K' ? '' : limpio;
  }

  const cuerpo = limpio.slice(0, -1).replace(/[^0-9]/g, '').slice(0, 8);
  const dv = limpio.slice(-1);

  if (!cuerpo) {
    return dv === 'K' ? '' : dv;
  }

  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoConPuntos}-${dv}`;
}

/**
 * Elimina puntos y espacios del RUT dejando el formato canónico "12345678-K".
 */
export function normalizarRut(valor: string): string {
  return valor.trim().replace(/\./g, '').toUpperCase();
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
export function esRutValido(valor: string): boolean {
  const normalizado = normalizarRut(valor);
  const coincidencia = /^(\d{7,8})-([0-9K])$/.exec(normalizado);
  if (!coincidencia) return false;

  const [, cuerpo, dv] = coincidencia;
  return calcularDigitoVerificador(cuerpo) === dv;
}
