import { normalizarRut } from '../../lib/rut.ts';
import { eliminarCitasAgendadasPorRutDB } from '../citas/citas.repository.ts';
import { asegurarDonanteRegistradoDB } from '../donantes/donantes.repository.ts';
import {
  guardarFichaMedicaDB,
  obtenerFichaMedicaDB,
} from './ficha-medica.repository.ts';
import {
  type EntradaFormularioFichaMedica,
  ErrorFichaMedica,
  ESTADOS_CLINICOS_VALIDOS,
  type EstadoClinico,
  type FichaMedicaDTO,
  type RegistroFichaMedicaDB,
  type TipoSangre,
  TIPOS_SANGRE_VALIDOS,
  UNIDADES_TIEMPO_ESTIMADO,
  type UnidadTiempoEstimado,
} from './ficha-medica.types.ts';
import {
  calcularFechaElegibilidadDesdeTiempo,
  debeEliminarCitaPorCambioEstado,
  mapearFilaADTO,
  normalizarEstadoClinico,
  validarYPrepararFichaMedica,
} from './ficha-medica.validation.ts';

export {
  calcularFechaElegibilidadDesdeTiempo,
  debeEliminarCitaPorCambioEstado,
  ErrorFichaMedica,
  ESTADOS_CLINICOS_VALIDOS,
  normalizarEstadoClinico,
  TIPOS_SANGRE_VALIDOS,
  UNIDADES_TIEMPO_ESTIMADO,
  validarYPrepararFichaMedica,
};
export type {
  EntradaFormularioFichaMedica,
  EstadoClinico,
  FichaMedicaDTO,
  RegistroFichaMedicaDB,
  TipoSangre,
  UnidadTiempoEstimado,
};

export async function obtenerFichaMedicaPorRut(
  rutCrudo: string,
): Promise<FichaMedicaDTO | null> {
  const rut = normalizarRut(rutCrudo);
  if (!rut) return null;

  const fila = await obtenerFichaMedicaDB(rut);
  return fila ? mapearFilaADTO(fila) : null;
}

/**
 * Registra al donante si no existe, guarda o actualiza su ficha médica
 * y elimina citas activas incompatibles con el nuevo estado clínico.
 */
export async function guardarFichaMedica(
  registro: EntradaFormularioFichaMedica,
) {
  const rutNormalizado = normalizarRut(registro.rut || '');
  if (!rutNormalizado || rutNormalizado.length < 3) {
    throw new ErrorFichaMedica('Debes ingresar un RUT válido.');
  }

  const fichaExistente = await obtenerFichaMedicaDB(rutNormalizado);
  const datosValidados = validarYPrepararFichaMedica(
    registro,
    fichaExistente,
  );

  await asegurarDonanteRegistradoDB(datosValidados.rut);
  const guardada = await guardarFichaMedicaDB(datosValidados);

  let citasEliminadas = 0;
  if (datosValidados.estadoClinico === 'Excluyente') {
    citasEliminadas = await eliminarCitasAgendadasPorRutDB(datosValidados.rut);
  } else if (
    datosValidados.estadoClinico === 'Diferido temporalmente' &&
    datosValidados.fechaElegibilidad
  ) {
    citasEliminadas = await eliminarCitasAgendadasPorRutDB(
      datosValidados.rut,
      datosValidados.fechaElegibilidad,
    );
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
