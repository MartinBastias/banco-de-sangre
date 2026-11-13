export const ZONA_HORARIA_CLINICA = 'America/Santiago';

export function formatearFechaUTC(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

export function esFechaIsoValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const verificacion = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    verificacion.getUTCFullYear() === anio &&
    verificacion.getUTCMonth() === mes - 1 &&
    verificacion.getUTCDate() === dia
  );
}

export function horaAMinutos(hora: string): number {
  const [horasStr, minutosStr] = hora.split(':');
  return Number(horasStr) * 60 + Number(minutosStr);
}

export function sumarDiasIso(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return formatearFechaUTC(fechaUtc);
}

/**
 * Returns the clinic wall-clock date (YYYY-MM-DD) and minutes since midnight
 * in `America/Santiago`, preventing UTC container clock drift.
 */
export function obtenerFechaYMinutosActuales(ahora: Date = new Date()): {
  fechaActual: string;
  minutosActuales: number;
} {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_CLINICA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);

  const obtenerParte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '00';

  const fechaActual = `${obtenerParte('year')}-${obtenerParte('month')}-${obtenerParte('day')}`;
  const hora = Number(obtenerParte('hour')) % 24;
  const minuto = Number(obtenerParte('minute'));

  return {
    fechaActual,
    minutosActuales: hora * 60 + minuto,
  };
}
