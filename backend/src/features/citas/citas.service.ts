import { and, asc, count, eq, ne } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { citas } from '../../lib/db/schema.ts';
import { normalizarRut } from '../donantes/donantes.service.ts';
import {
  normalizarEstadoClinico,
  obtenerFichaMedicaPorRut,
} from '../ficha-medica/ficha-medica.service.ts';

export const CAPACIDAD_MAXIMA_BLOQUE = 5;

export interface EntradaCita {
  rut: string;
  sede: string;
  fecha: string;
  hora: string;
}

export interface EntradaReagendarCita {
  sede: string;
  fecha: string;
  hora: string;
}

export class ErrorCita extends Error {}

export function validarElegibilidadParaCita(
  ficha: {
    estadoClinico?: string | null;
    fechaElegibilidad?: string | null;
  } | null,
  fechaCita: string,
): void {
  if (!ficha) {
    return;
  }

  const estado = normalizarEstadoClinico(ficha.estadoClinico ?? undefined);
  if (estado === 'Excluyente') {
    throw new ErrorCita(
      'El donante tiene estado Excluyente y no puede agendar citas.',
    );
  }

  if (estado === 'Diferido temporalmente') {
    if (!ficha.fechaElegibilidad) {
      throw new ErrorCita(
        'El donante se encuentra diferido temporalmente sin fecha de elegibilidad definida.',
      );
    }
    if (fechaCita < ficha.fechaElegibilidad) {
      throw new ErrorCita(
        `El donante está diferido temporalmente. Solo puede agendar citas desde el ${ficha.fechaElegibilidad}.`,
      );
    }
  }
}

export async function obtenerCitaActiva(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);
  const [cita] = await db
    .select({
      id: citas.id,
      rut: citas.rut,
      sede: citas.sede,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
    })
    .from(citas)
    .where(and(eq(citas.rut, rut), eq(citas.estado, 'agendada')))
    .limit(1);

  return cita ?? null;
}

export async function listarCitasActuales() {
  return db
    .select({
      id: citas.id,
      rut: citas.rut,
      sede: citas.sede,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
    })
    .from(citas)
    .where(eq(citas.estado, 'agendada'))
    .orderBy(asc(citas.fecha), asc(citas.hora));
}

export async function crearCita(entrada: EntradaCita) {
  const rut = normalizarRut(entrada.rut);
  const fichaMedica = await obtenerFichaMedicaPorRut(rut);
  validarElegibilidadParaCita(fichaMedica, entrada.fecha);

  const [existente] = await db
    .select({ total: count() })
    .from(citas)
    .where(
      and(
        eq(citas.rut, rut),
        eq(citas.estado, 'agendada'),
      ),
    );

  if (existente.total > 0) {
    throw new ErrorCita(
      'El donante ya tiene una cita agendada. Debe reagendarla o cancelarla antes de crear una nueva.',
    );
  }

  const [ocupacion] = await db
    .select({ total: count() })
    .from(citas)
    .where(
      and(
        eq(citas.sede, entrada.sede),
        eq(citas.fecha, entrada.fecha),
        eq(citas.hora, entrada.hora),
        eq(citas.estado, 'agendada'),
      ),
    );

  if (ocupacion.total >= CAPACIDAD_MAXIMA_BLOQUE) {
    throw new ErrorCita(
      'El bloque horario ha superado su capacidad máxima.',
    );
  }

  const [creada] = await db
    .insert(citas)
    .values({
      rut,
      sede: entrada.sede,
      fecha: entrada.fecha,
      hora: entrada.hora,
    })
    .returning({
      id: citas.id,
      rut: citas.rut,
      sede: citas.sede,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
    });

  return creada;
}

export async function reagendarCita(
  id: number,
  entrada: EntradaReagendarCita,
) {
  const [citaActual] = await db
    .select({ rut: citas.rut })
    .from(citas)
    .where(and(eq(citas.id, id), eq(citas.estado, 'agendada')))
    .limit(1);

  if (citaActual) {
    const fichaMedica = await obtenerFichaMedicaPorRut(citaActual.rut);
    validarElegibilidadParaCita(fichaMedica, entrada.fecha);
  }

  const [ocupacion] = await db
    .select({ total: count() })
    .from(citas)
    .where(
      and(
        eq(citas.sede, entrada.sede),
        eq(citas.fecha, entrada.fecha),
        eq(citas.hora, entrada.hora),
        eq(citas.estado, 'agendada'),
        ne(citas.id, id),
      ),
    );

  if (ocupacion.total >= CAPACIDAD_MAXIMA_BLOQUE) {
    throw new ErrorCita(
      'El nuevo bloque horario ha superado su capacidad máxima.',
    );
  }

  const [actualizada] = await db
    .update(citas)
    .set({
      sede: entrada.sede,
      fecha: entrada.fecha,
      hora: entrada.hora,
    })
    .where(and(eq(citas.id, id), eq(citas.estado, 'agendada')))
    .returning({
      id: citas.id,
      sede: citas.sede,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
    });

  if (!actualizada) {
    throw new ErrorCita(
      'No se encontró una cita agendada para reagendar.',
    );
  }

  return actualizada;
}

export async function cancelarCita(id: number) {
  const [cancelada] = await db
    .update(citas)
    .set({ estado: 'cancelada' })
    .where(and(eq(citas.id, id), eq(citas.estado, 'agendada')))
    .returning({
      id: citas.id,
      estado: citas.estado,
    });

  if (!cancelada) {
    throw new ErrorCita(
      'No se encontró una cita agendada para cancelar.',
    );
  }

  return cancelada;
}
