import { esFechaIsoValida, formatearFechaUTC } from '../../lib/fechas.ts';
import {
  esRutValido,
  MENSAJE_RUT_INVALIDO,
  normalizarRut,
} from '../../lib/rut.ts';
import {
  type DatosFichaMedicaPreparados,
  type EntradaFormularioFichaMedica,
  ErrorFichaMedica,
  type EstadoClinico,
  ESTADOS_CLINICOS_VALIDOS,
  type FichaMedicaDTO,
  type RegistroFichaMedicaDB,
  type TipoSangre,
  TIPOS_SANGRE_VALIDOS,
  UNIDADES_TIEMPO_ESTIMADO,
  type UnidadTiempoEstimado,
} from './ficha-medica.types.ts';

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
): DatosFichaMedicaPreparados {
  const rut = normalizarRut(entrada.rut || '');
  if (!esRutValido(rut)) {
    throw new ErrorFichaMedica(MENSAJE_RUT_INVALIDO);
  }

  const pesoFinal: number | null = !estaVacio(entrada.peso)
    ? validarPeso(entrada.peso as number | string)
    : (fichaExistente?.peso ?? null);
  if (pesoFinal === null) {
    throw new ErrorFichaMedica('El peso del donante es obligatorio.');
  }

  let tipoSangreFinal: string | null = fichaExistente?.tipoSangre ?? null;
  if (!tipoSangreFinal) {
    if (!estaVacio(entrada.tipoSangre)) {
      tipoSangreFinal = validarTipoSangre(String(entrada.tipoSangre));
    } else {
      throw new ErrorFichaMedica(
        'El tipo de sangre es obligatorio para nuevos registros.',
      );
    }
  }

  let estadoFinal: EstadoClinico | null = normalizarEstadoClinico(
    fichaExistente?.estadoClinico,
  );
  const cambioEstado = !estaVacio(entrada.estadoClinico);
  if (cambioEstado) {
    const estadoNormalizado = normalizarEstadoClinico(
      String(entrada.estadoClinico),
    );
    if (!estadoNormalizado) {
      throw new ErrorFichaMedica(
        `El estado clínico debe ser: ${ESTADOS_CLINICOS_VALIDOS.join(', ')}.`,
      );
    }
    estadoFinal = estadoNormalizado;
  } else if (!estadoFinal) {
    throw new ErrorFichaMedica(
      'El estado clínico de elegibilidad es obligatorio.',
    );
  }

  let fechaElegibilidadFinal: string | null =
    fichaExistente?.fechaElegibilidad ?? null;

  const tieneCantidad = !estaVacio(entrada.tiempoEstimadoCantidad);
  const tieneUnidad = !estaVacio(entrada.tiempoEstimadoUnidad);
  const tieneFechaExplicita = !estaVacio(entrada.fechaElegibilidad);

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
    const fechaTexto = String(entrada.fechaElegibilidad).trim();
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

  let observacionesFinal: string | null = fichaExistente?.observaciones ?? null;
  if (entrada.observaciones !== undefined) {
    const texto =
      entrada.observaciones === null ? '' : String(entrada.observaciones).trim();
    if (texto.length > 1000) {
      throw new ErrorFichaMedica(
        'Las observaciones no pueden superar los 1000 caracteres.',
      );
    }
    observacionesFinal = texto || null;
  }

  return {
    rut,
    peso: pesoFinal,
    estadoClinico: estadoFinal,
    tipoSangre: tipoSangreFinal,
    fechaElegibilidad: fechaElegibilidadFinal,
    observaciones: observacionesFinal,
  };
}

export function mapearFilaADTO(fila: RegistroFichaMedicaDB): FichaMedicaDTO {
  return {
    rut: fila.rut,
    peso: fila.peso,
    estadoClinico: fila.estadoClinico,
    tipoSangre: fila.tipoSangre,
    fechaElegibilidad: fila.fechaElegibilidad,
    observaciones: fila.observaciones,
    fechaActualizacion: fila.fechaActualizacion ?? null,
  };
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
