export interface InformacionElegibilidad {
  estado?: string | null;
  motivo?: string | null;
  proximaFechaHabil?: string | Date | null;
}

export type EligibilityInfo = InformacionElegibilidad;

export const normalizarEstadoElegibilidad = (estado?: string | null): string =>
  String(estado ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const normalizeEligibilityStatus = normalizarEstadoElegibilidad;

export const esDonanteElegible = (
  elegibilidad?: InformacionElegibilidad | null,
): boolean => {
  const normalizado = normalizarEstadoElegibilidad(elegibilidad?.estado);
  return normalizado === 'apto' || normalizado === 'habilitado';
};

export const isDonorEligible = esDonanteElegible;
