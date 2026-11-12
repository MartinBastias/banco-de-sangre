export interface InformacionElegibilidad {
  estadoClinico?: string | null;
  observaciones?: string | null;
  fechaElegibilidad?: string | Date | null;
}

export const normalizarEstadoElegibilidad = (estado?: string | null): string =>
  String(estado ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const esDonanteElegible = (
  elegibilidad?: InformacionElegibilidad | null,
): boolean =>
  normalizarEstadoElegibilidad(elegibilidad?.estadoClinico) === 'apto';
