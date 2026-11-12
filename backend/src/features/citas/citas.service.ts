import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { appointments, citas } from '../../lib/db/schema.ts';

const tablaCitas = citas || appointments;
export const CAPACIDAD_MAXIMA_BLOQUE = 5;
export const MAX_SLOT_CAPACITY = CAPACIDAD_MAXIMA_BLOQUE;

export interface EntradaCita {
  rut: string;
  sede: string;
  fecha: string;
  hora: string;
}

export type AppointmentInput = EntradaCita;

export interface EntradaReagendarCita {
  sede: string;
  fecha: string;
  hora: string;
}

export type RescheduleAppointmentInput = EntradaReagendarCita;

export class ErrorCita extends Error {}
export class AppointmentError extends ErrorCita {}

export async function obtenerCitaActiva(rut: string) {
  const [cita] = await db
    .select({
      id: tablaCitas.id,
      rut: tablaCitas.rut,
      sede: tablaCitas.sede,
      fecha: tablaCitas.fecha,
      hora: tablaCitas.hora,
      estado: tablaCitas.estado,
    })
    .from(tablaCitas)
    .where(and(eq(tablaCitas.rut, rut), eq(tablaCitas.estado, 'agendada')))
    .limit(1);

  return cita ?? null;
}

export const getActiveAppointment = obtenerCitaActiva;

export async function crearCita(entrada: EntradaCita) {
  const [existente] = await db
    .select({ total: count() })
    .from(tablaCitas)
    .where(
      and(
        eq(tablaCitas.rut, entrada.rut),
        eq(tablaCitas.estado, 'agendada'),
      ),
    );

  if (existente.total > 0) {
    throw new ErrorCita(
      'El donante ya tiene una cita agendada. Debe reagendarla o cancelarla antes de crear una nueva.',
    );
  }

  const [ocupacion] = await db
    .select({ total: count() })
    .from(tablaCitas)
    .where(
      and(
        eq(tablaCitas.sede, entrada.sede),
        eq(tablaCitas.fecha, entrada.fecha),
        eq(tablaCitas.hora, entrada.hora),
        eq(tablaCitas.estado, 'agendada'),
      ),
    );

  if (ocupacion.total >= CAPACIDAD_MAXIMA_BLOQUE) {
    throw new ErrorCita(
      'El bloque horario ha superado su capacidad máxima.',
    );
  }

  const [creada] = await db
    .insert(tablaCitas)
    .values({
      rut: entrada.rut,
      sede: entrada.sede,
      fecha: entrada.fecha,
      hora: entrada.hora,
    })
    .returning({
      id: tablaCitas.id,
      rut: tablaCitas.rut,
      sede: tablaCitas.sede,
      fecha: tablaCitas.fecha,
      hora: tablaCitas.hora,
      estado: tablaCitas.estado,
    });

  return creada;
}

export const createAppointment = crearCita;

export async function reagendarCita(
  id: number,
  entrada: EntradaReagendarCita,
) {
  const [ocupacion] = await db
    .select({ total: count() })
    .from(tablaCitas)
    .where(
      and(
        eq(tablaCitas.sede, entrada.sede),
        eq(tablaCitas.fecha, entrada.fecha),
        eq(tablaCitas.hora, entrada.hora),
        eq(tablaCitas.estado, 'agendada'),
        ne(tablaCitas.id, id),
      ),
    );

  if (ocupacion.total >= CAPACIDAD_MAXIMA_BLOQUE) {
    throw new ErrorCita(
      'El nuevo bloque horario ha superado su capacidad máxima.',
    );
  }

  const [actualizada] = await db
    .update(tablaCitas)
    .set({
      sede: entrada.sede,
      fecha: entrada.fecha,
      hora: entrada.hora,
    })
    .where(and(eq(tablaCitas.id, id), eq(tablaCitas.estado, 'agendada')))
    .returning({
      id: tablaCitas.id,
      sede: tablaCitas.sede,
      fecha: tablaCitas.fecha,
      hora: tablaCitas.hora,
      estado: tablaCitas.estado,
    });

  if (!actualizada) {
    throw new ErrorCita(
      'No se encontró una cita agendada para reagendar.',
    );
  }

  return actualizada;
}

export const rescheduleAppointment = reagendarCita;

export async function cancelarCita(id: number) {
  const [cancelada] = await db
    .update(tablaCitas)
    .set({ estado: 'cancelada' })
    .where(and(eq(tablaCitas.id, id), eq(tablaCitas.estado, 'agendada')))
    .returning({
      id: tablaCitas.id,
      estado: tablaCitas.estado,
    });

  if (!cancelada) {
    throw new ErrorCita(
      'No se encontró una cita agendada para cancelar.',
    );
  }

  return cancelada;
}

export const cancelAppointment = cancelarCita;
