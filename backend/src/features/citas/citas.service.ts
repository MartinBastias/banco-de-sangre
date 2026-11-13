import { obtenerFechaYMinutosActuales } from '../../lib/fechas.ts';
import { normalizarRut } from '../../lib/rut.ts';
import { obtenerFichaMedicaPorRut } from '../ficha-medica/ficha-medica.service.ts';
import {
  actualizarCitaAgendadaDB,
  buscarCitaActivaPorRutDB,
  buscarCitaAgendadaPorIdDB,
  cancelarCitaAgendadaDB,
  contarCitasAgendadasPorRutDB,
  insertarCitaDB,
  listarCitasAgendadasActualesDB,
  listarCitasAgendadasDesdeDB,
} from './citas.repository.ts';
import {
  CAPACIDAD_MAXIMA_BLOQUE,
  type CitaOcupada,
  type EntradaCita,
  type EntradaReagendarCita,
  ErrorCita,
  HORARIOS_DISPONIBLES,
  MARGEN_ANTICIPACION_MINUTOS,
  type ResultadoDisponibilidad,
  SEDES_VALIDAS,
  type SlotDisponibilidad,
} from './citas.types.ts';
import {
  calcularFechaBaseElegibilidad,
  esHoraEnVentana,
  evaluarDisponibilidadCitas,
  obtenerSlotsDia,
  validarCapacidadBloque,
  validarElegibilidadParaCita,
  validarReservaDisponible,
} from './citas.validation.ts';

export {
  calcularFechaBaseElegibilidad,
  CAPACIDAD_MAXIMA_BLOQUE,
  ErrorCita,
  esHoraEnVentana,
  evaluarDisponibilidadCitas,
  HORARIOS_DISPONIBLES,
  MARGEN_ANTICIPACION_MINUTOS,
  obtenerFechaYMinutosActuales,
  obtenerSlotsDia,
  SEDES_VALIDAS,
  validarCapacidadBloque,
  validarElegibilidadParaCita,
  validarReservaDisponible,
};
export type {
  CitaOcupada,
  EntradaCita,
  EntradaReagendarCita,
  ResultadoDisponibilidad,
  SlotDisponibilidad,
};

export async function obtenerDisponibilidadCitas(params: {
  rut?: string;
  sede?: string;
  fecha?: string;
  excluirCitaId?: number;
}): Promise<ResultadoDisponibilidad> {
  const { fechaActual } = obtenerFechaYMinutosActuales();
  const rutNormalizado = params.rut ? normalizarRut(params.rut) : undefined;
  const fichaMedica = rutNormalizado
    ? await obtenerFichaMedicaPorRut(rutNormalizado)
    : null;

  const citasAgendadas = await listarCitasAgendadasDesdeDB(
    fechaActual,
    params.excluirCitaId,
  );

  return evaluarDisponibilidadCitas({
    ficha: fichaMedica,
    sede: params.sede,
    fechaConsulta: params.fecha,
    citasAgendadas,
  });
}

export async function obtenerCitaActiva(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);
  return buscarCitaActivaPorRutDB(rut);
}

export async function listarCitasActuales() {
  return listarCitasAgendadasActualesDB();
}

export async function crearCita(entrada: EntradaCita) {
  const rut = normalizarRut(entrada.rut);
  const fichaMedica = await obtenerFichaMedicaPorRut(rut);

  const totalActivas = await contarCitasAgendadasPorRutDB(rut);
  if (totalActivas > 0) {
    throw new ErrorCita(
      'El donante ya tiene una cita agendada. Debe reagendarla o cancelarla antes de crear una nueva.',
    );
  }

  const { fechaActual } = obtenerFechaYMinutosActuales();
  const citasAgendadas = await listarCitasAgendadasDesdeDB(fechaActual);
  validarReservaDisponible({
    ficha: fichaMedica,
    sede: entrada.sede,
    fecha: entrada.fecha,
    hora: entrada.hora,
    citasAgendadas,
  });

  return insertarCitaDB({
    rut,
    sede: entrada.sede,
    fecha: entrada.fecha,
    hora: entrada.hora,
  });
}

export async function reagendarCita(
  id: number,
  entrada: EntradaReagendarCita,
) {
  const citaActual = await buscarCitaAgendadaPorIdDB(id);
  if (!citaActual) {
    throw new ErrorCita('No se encontró una cita agendada para reagendar.');
  }

  const fichaMedica = await obtenerFichaMedicaPorRut(citaActual.rut);
  const { fechaActual } = obtenerFechaYMinutosActuales();
  const citasAgendadas = await listarCitasAgendadasDesdeDB(fechaActual, id);

  validarReservaDisponible({
    ficha: fichaMedica,
    sede: entrada.sede,
    fecha: entrada.fecha,
    hora: entrada.hora,
    citasAgendadas,
  });

  const actualizada = await actualizarCitaAgendadaDB(id, entrada);
  if (!actualizada) {
    throw new ErrorCita('No se encontró una cita agendada para reagendar.');
  }

  return actualizada;
}

export async function cancelarCita(id: number) {
  const cancelada = await cancelarCitaAgendadaDB(id);
  if (!cancelada) {
    throw new ErrorCita('No se encontró una cita agendada para cancelar.');
  }

  return cancelada;
}
