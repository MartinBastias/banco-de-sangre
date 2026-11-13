export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const SEDES = [
  { codigo: 'cpp', nombre: 'Sede Concepción' },
  { codigo: 'spp', nombre: 'Sede San Pedro de la Paz' },
] as const;

export const obtenerNombreSede = (
  codigo: string,
  valorPorDefecto = '',
): string => {
  const encontrada = SEDES.find((sede) => sede.codigo === codigo);
  return encontrada ? encontrada.nombre : valorPorDefecto;
};

export const TIPOS_SANGRE = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
] as const;

export const ESTADOS_CLINICOS = [
  'Apto',
  'Diferido temporalmente',
  'Excluyente',
] as const;
