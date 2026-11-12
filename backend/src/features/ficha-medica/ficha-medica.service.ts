import { and, eq, lt, sql } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { citas, donantes, fichasMedicas } from '../../lib/db/schema.ts';
import { normalizarRut } from '../donantes/donantes.service.ts';

export const ESTADOS_CLINICOS_VALIDOS = [
  'Apto',
  'Diferido temporalmente',
  'Excluyente',
] as const;

export type EstadoClinico = (typeof ESTADOS_CLINICOS_VALIDOS)[number];

export const TIPOS_SANGRE_VALIDOS = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
] as const;

export type TipoSangre = (typeof TIPOS_SANGRE_VALIDOS)[number];

export const UNIDADES_TIEMPO_ESTIMADO = ['dias', 'meses', 'anios'] as const;
export type UnidadTiempoEstimado = (typeof UNIDADES_TIEMPO_ESTIMADO)[number];

export class ErrorFichaMedica extends Error {
  statusCode: number;

  constructor(mensaje: string, statusCode = 400) {
    super(mensaje);
    this.statusCode = statusCode;
  }
}

export interface EntradaFormularioFichaMedica {
  rut: string;
  presionArterial?: string | null;
  frecuenciaCardiaca?: number | string | null;
  peso?: number | string | null;
  estadoClinico?: string | null;
  tipoSangre?: string | null;
  tiempoEstimadoCantidad?: number | string | null;
  tiempoEstimadoUnidad?: string | null;
  fechaElegibilidad?: string | null;
  observaciones?: string | null;
}

export interface RegistroFichaMedicaDB {
  rut: string;
  presionArterial: string | null;
  frecuenciaCardiaca: number | null;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
  fechaActualizacion?: Date | null;
}

export interface FichaMedicaDTO {
  rut: string;
  presionArterial: string | null;
  frecuenciaCardiaca: number | null;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
  fechaActualizacion: Date | null;
}

function formatearFechaUTC(fecha: Date): string {
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

export function normalizarEstadoClinico(
  estado?: string | null,
): EstadoClinico | null {
  if (!estado || typeof estado !== 'string') return null;
  const limpio = estado.trim().toLowerCase();

  if (limpio === 'apto') return 'Apto';
  if (limpio === 'diferido temporalmente') return 'Diferido temporalmente';
  if (limpio === 'excluyente') return 'Excluyente';
  return null;
}

export function calcularFechaElegibilidadDesdeTiempo(
  cantidad: number,
  unidad: UnidadTiempoEstimado,
  fechaBase: Date = new Date(),
): string {
  const fecha = new Date(
    Date.UTC(
      fechaBase.getUTCFullYear(),
      fechaBase.getUTCMonth(),
      fechaBase.getUTCDate(),
    ),
  );

  if (unidad === 'dias') {
    fecha.setUTCDate(fecha.getUTCDate() + cantidad);
  } else if (unidad === 'meses') {
    fecha.setUTCMonth(fecha.getUTCMonth() + cantidad);
  } else if (unidad === 'anios') {
    fecha.setUTCFullYear(fecha.getUTCFullYear() + cantidad);
  }

  return formatearFechaUTC(fecha);
}

function validarPresionArterial(valor: string): string {
  const limpio = valor.trim();
  const coincidencia = /^(\d{2,3})\/(\d{2,3})$/.exec(limpio);
  if (!coincidencia) {
    throw new ErrorFichaMedica(
      'La presión arterial debe tener el formato sistólica/diastólica (ej: 120/80).',
    );
  }

  const sistolica = Number(coincidencia[1]);
  const diastolica = Number(coincidencia[2]);

  if (
    sistolica < 50 ||
    sistolica > 250 ||
    diastolica < 30 ||
    diastolica > 160 ||
    sistolica <= diastolica
  ) {
    throw new ErrorFichaMedica(
      'Los valores de presión arterial están fuera del rango clínico válido.',
    );
  }

  return `${sistolica}/${diastolica}`;
}

function validarFrecuenciaCardiaca(valor: number | string): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 30 || numero > 220) {
    throw new ErrorFichaMedica(
      'La frecuencia cardíaca debe ser un número entero entre 30 y 220 lpm.',
    );
  }
  return numero;
}

function validarPeso(valor: number | string): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 20 || numero > 300) {
    throw new ErrorFichaMedica(
      'El peso debe ser un número válido entre 20 y 300 kg.',
    );
  }
  return Math.round(numero * 10) / 10;
}

function validarTipoSangre(valor: string): TipoSangre {
  const limpio = valor.trim().toUpperCase() as TipoSangre;
  if (!TIPOS_SANGRE_VALIDOS.includes(limpio)) {
    throw new ErrorFichaMedica(
      `El tipo de sangre debe ser uno de: ${TIPOS_SANGRE_VALIDOS.join(', ')}.`,
    );
  }
  return limpio;
}

function estaVacio(valor: unknown): boolean {
  return valor === undefined || valor === null || valor === '';
}

export function validarYPrepararFichaMedica(
  entrada: EntradaFormularioFichaMedica,
  fichaExistente: RegistroFichaMedicaDB | null = null,
  fechaReferencia: Date = new Date(),
) {
  const rut = normalizarRut(entrada.rut || '');
  if (!rut || rut.length < 3) {
    throw new ErrorFichaMedica('Debes ingresar un RUT válido.');
  }

  const presionCruda = entrada.presionArterial;
  const frecuenciaCruda = entrada.frecuenciaCardiaca;
  const pesoCrudo = entrada.peso;
  const estadoCrudo = entrada.estadoClinico;
  const sangreCruda = entrada.tipoSangre;
  const fechaCruda = entrada.fechaElegibilidad;
  const obsCrudas = entrada.observaciones;

  // Presión arterial
  let presionFinal: string | null = fichaExistente?.presionArterial ?? null;
  if (!estaVacio(presionCruda)) {
    presionFinal = validarPresionArterial(String(presionCruda));
  } else if (!presionFinal) {
    throw new ErrorFichaMedica('La presión arterial es obligatoria.');
  }

  // Frecuencia cardíaca
  let frecuenciaFinal: number | null =
    frecuenciaCruda !== undefined &&
    frecuenciaCruda !== null &&
    !estaVacio(frecuenciaCruda)
      ? validarFrecuenciaCardiaca(frecuenciaCruda)
      : (fichaExistente?.frecuenciaCardiaca ?? null);
  if (frecuenciaFinal === null) {
    throw new ErrorFichaMedica('La frecuencia cardíaca es obligatoria.');
  }

  // Peso
  let pesoFinal: number | null =
    pesoCrudo !== undefined && pesoCrudo !== null && !estaVacio(pesoCrudo)
      ? validarPeso(pesoCrudo)
      : (fichaExistente?.peso ?? null);
  if (pesoFinal === null) {
    throw new ErrorFichaMedica('El peso del donante es obligatorio.');
  }

  // Tipo de sangre: si ya existe en BD, no se modifica
  let tipoSangreFinal: string | null = fichaExistente?.tipoSangre ?? null;
  if (!tipoSangreFinal) {
    if (!estaVacio(sangreCruda)) {
      tipoSangreFinal = validarTipoSangre(String(sangreCruda));
    } else {
      throw new ErrorFichaMedica('El tipo de sangre es obligatorio para nuevos registros.');
    }
  }

  // Estado clínico
  let estadoFinal: EstadoClinico | null = normalizarEstadoClinico(
    fichaExistente?.estadoClinico,
  );
  const cambioEstado = !estaVacio(estadoCrudo);
  if (cambioEstado) {
    const estadoNormalizado = normalizarEstadoClinico(String(estadoCrudo));
    if (!estadoNormalizado) {
      throw new ErrorFichaMedica(
        `El estado clínico debe ser: ${ESTADOS_CLINICOS_VALIDOS.join(', ')}.`,
      );
    }
    estadoFinal = estadoNormalizado;
  } else if (!estadoFinal) {
    throw new ErrorFichaMedica('El estado clínico de elegibilidad es obligatorio.');
  }

  // Tiempo estimado / fecha de elegibilidad
  let fechaElegibilidadFinal: string | null =
    fichaExistente?.fechaElegibilidad ?? null;

  const tieneCantidad = !estaVacio(entrada.tiempoEstimadoCantidad);
  const tieneUnidad = !estaVacio(entrada.tiempoEstimadoUnidad);
  const tieneFechaExplicita = !estaVacio(fechaCruda);

  if (estadoFinal === 'Excluyente') {
    fechaElegibilidadFinal = null;
  } else if (tieneCantidad || tieneUnidad) {
    const cantidad = Number(entrada.tiempoEstimadoCantidad);
    const unidad = String(
      entrada.tiempoEstimadoUnidad || '',
    ).trim() as UnidadTiempoEstimado;

    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 3650) {
      throw new ErrorFichaMedica(
        'El tiempo estimado debe ser un número entero mayor a 0.',
      );
    }
    if (!UNIDADES_TIEMPO_ESTIMADO.includes(unidad)) {
      throw new ErrorFichaMedica(
        'La unidad de tiempo estimado debe ser dias, meses o anios.',
      );
    }

    fechaElegibilidadFinal = calcularFechaElegibilidadDesdeTiempo(
      cantidad,
      unidad,
      fechaReferencia,
    );
  } else if (tieneFechaExplicita) {
    const fechaTexto = String(fechaCruda).trim();
    if (!esFechaIsoValida(fechaTexto)) {
      throw new ErrorFichaMedica(
        'La fecha estimada de elegibilidad debe tener formato YYYY-MM-DD válido.',
      );
    }
    fechaElegibilidadFinal = fechaTexto;
  } else if (estadoFinal === 'Apto') {
    fechaElegibilidadFinal = formatearFechaUTC(fechaReferencia);
  } else if (estadoFinal === 'Diferido temporalmente') {
    if (!fechaElegibilidadFinal || cambioEstado) {
      throw new ErrorFichaMedica(
        'Para un diferimiento temporal debes ingresar el tiempo estimado o la fecha de elegibilidad.',
      );
    }
  }

  // Observaciones de entrevista médica
  let observacionesFinal: string | null = fichaExistente?.observaciones ?? null;
  if (obsCrudas !== undefined) {
    const texto = obsCrudas === null ? '' : String(obsCrudas).trim();
    if (texto.length > 1000) {
      throw new ErrorFichaMedica(
        'Las observaciones no pueden superar los 1000 caracteres.',
      );
    }
    observacionesFinal = texto || null;
  }

  return {
    rut,
    presionArterial: presionFinal,
    frecuenciaCardiaca: frecuenciaFinal,
    peso: pesoFinal,
    estadoClinico: estadoFinal,
    tipoSangre: tipoSangreFinal,
    fechaElegibilidad: fechaElegibilidadFinal,
    observaciones: observacionesFinal,
  };
}

function mapearFilaADTO(fila: RegistroFichaMedicaDB): FichaMedicaDTO {
  return {
    rut: fila.rut,
    presionArterial: fila.presionArterial,
    frecuenciaCardiaca: fila.frecuenciaCardiaca,
    peso: fila.peso,
    estadoClinico: fila.estadoClinico,
    tipoSangre: fila.tipoSangre,
    fechaElegibilidad: fila.fechaElegibilidad,
    observaciones: fila.observaciones,
    fechaActualizacion: fila.fechaActualizacion ?? null,
  };
}

export async function obtenerFichaMedicaPorRut(
  rutCrudo: string,
): Promise<FichaMedicaDTO | null> {
  const rut = normalizarRut(rutCrudo);
  if (!rut) return null;

  const [fila] = await db
    .select()
    .from(fichasMedicas)
    .where(eq(fichasMedicas.rut, rut))
    .limit(1);

  return fila ? mapearFilaADTO(fila) : null;
}

export function debeEliminarCitaPorCambioEstado(
  estadoClinico: EstadoClinico,
  fechaElegibilidad: string | null,
  fechaCita: string,
): boolean {
  if (estadoClinico === 'Excluyente') {
    return true;
  }
  if (estadoClinico === 'Diferido temporalmente') {
    if (!fechaElegibilidad) return true;
    return fechaCita < fechaElegibilidad;
  }
  return false;
}

/**
 * Registra al donante si no existe y guarda o actualiza su ficha médica y signos vitales.
 */
export async function guardarFichaMedica(registro: EntradaFormularioFichaMedica) {
  const rutNormalizado = normalizarRut(registro.rut || '');
  if (!rutNormalizado || rutNormalizado.length < 3) {
    throw new ErrorFichaMedica('Debes ingresar un RUT válido.');
  }

  const [fichaExistente] = await db
    .select()
    .from(fichasMedicas)
    .where(eq(fichasMedicas.rut, rutNormalizado))
    .limit(1);

  const datosValidados = validarYPrepararFichaMedica(
    registro,
    fichaExistente ?? null,
  );

  // Asegurar que el donante quede registrado en la tabla donantes
  await db
    .insert(donantes)
    .values({ rut: datosValidados.rut })
    .onConflictDoNothing();

  const [guardada] = await db
    .insert(fichasMedicas)
    .values({
      rut: datosValidados.rut,
      presionArterial: datosValidados.presionArterial,
      frecuenciaCardiaca: datosValidados.frecuenciaCardiaca,
      peso: datosValidados.peso,
      estadoClinico: datosValidados.estadoClinico,
      tipoSangre: datosValidados.tipoSangre,
      fechaElegibilidad: datosValidados.fechaElegibilidad,
      observaciones: datosValidados.observaciones,
      fechaActualizacion: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: fichasMedicas.rut,
      set: {
        presionArterial: datosValidados.presionArterial,
        frecuenciaCardiaca: datosValidados.frecuenciaCardiaca,
        peso: datosValidados.peso,
        estadoClinico: datosValidados.estadoClinico,
        tipoSangre: datosValidados.tipoSangre,
        fechaElegibilidad: datosValidados.fechaElegibilidad,
        observaciones: datosValidados.observaciones,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();

  let citasEliminadas = 0;
  if (datosValidados.estadoClinico === 'Excluyente') {
    const eliminadas = await db
      .delete(citas)
      .where(and(eq(citas.rut, datosValidados.rut), eq(citas.estado, 'agendada')))
      .returning({ id: citas.id });
    citasEliminadas = eliminadas.length;
  } else if (
    datosValidados.estadoClinico === 'Diferido temporalmente' &&
    datosValidados.fechaElegibilidad
  ) {
    const eliminadas = await db
      .delete(citas)
      .where(
        and(
          eq(citas.rut, datosValidados.rut),
          eq(citas.estado, 'agendada'),
          lt(citas.fecha, datosValidados.fechaElegibilidad),
        ),
      )
      .returning({ id: citas.id });
    citasEliminadas = eliminadas.length;
  }

  const esActualizacion = Boolean(fichaExistente);
  const mensajeBase = esActualizacion
    ? 'Ficha médica actualizada correctamente.'
    : 'Donante y ficha médica registrados correctamente.';
  const mensaje =
    citasEliminadas > 0
      ? `${mensajeBase} Se eliminó la cita agendada por ser incompatible con el nuevo estado clínico.`
      : mensajeBase;

  return {
    actualizado: esActualizacion,
    citasEliminadas,
    mensaje,
    ficha: mapearFilaADTO(guardada),
  };
}
