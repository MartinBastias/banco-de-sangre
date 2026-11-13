import { and, asc, count, eq, gte, lt, ne } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { citas } from '../../lib/db/schema.ts';
import type {
  CitaOcupada,
  EntradaCita,
  EntradaReagendarCita,
} from './citas.types.ts';

export async function buscarCitaActivaPorRutDB(rut: string) {
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

export async function listarCitasAgendadasActualesDB() {
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

export async function listarCitasAgendadasDesdeDB(
  fechaDesde: string,
  excluirCitaId?: number,
): Promise<CitaOcupada[]> {
  const condiciones = [
    eq(citas.estado, 'agendada'),
    gte(citas.fecha, fechaDesde),
  ];

  if (excluirCitaId !== undefined) {
    condiciones.push(ne(citas.id, excluirCitaId));
  }

  return db
    .select({
      id: citas.id,
      sede: citas.sede,
      fecha: citas.fecha,
      hora: citas.hora,
    })
    .from(citas)
    .where(and(...condiciones));
}

export async function contarCitasAgendadasPorRutDB(rut: string): Promise<number> {
  const [existente] = await db
    .select({ total: count() })
    .from(citas)
    .where(and(eq(citas.rut, rut), eq(citas.estado, 'agendada')));

  return existente.total;
}

export async function insertarCitaDB(entrada: EntradaCita) {
  const [creada] = await db
    .insert(citas)
    .values({
      rut: entrada.rut,
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

export async function buscarCitaAgendadaPorIdDB(id: number) {
  const [citaActual] = await db
    .select({ rut: citas.rut })
    .from(citas)
    .where(and(eq(citas.id, id), eq(citas.estado, 'agendada')))
    .limit(1);

  return citaActual ?? null;
}

export async function actualizarCitaAgendadaDB(
  id: number,
  entrada: EntradaReagendarCita,
) {
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

  return actualizada ?? null;
}

export async function cancelarCitaAgendadaDB(id: number) {
  const [cancelada] = await db
    .update(citas)
    .set({ estado: 'cancelada' })
    .where(and(eq(citas.id, id), eq(citas.estado, 'agendada')))
    .returning({
      id: citas.id,
      estado: citas.estado,
    });

  return cancelada ?? null;
}

export async function eliminarCitasAgendadasPorRutDB(
  rut: string,
  fechaMaximaExclusiva?: string,
): Promise<number> {
  const condiciones = [eq(citas.rut, rut), eq(citas.estado, 'agendada')];
  if (fechaMaximaExclusiva) {
    condiciones.push(lt(citas.fecha, fechaMaximaExclusiva));
  }

  const eliminadas = await db
    .delete(citas)
    .where(and(...condiciones))
    .returning({ id: citas.id });

  return eliminadas.length;
}
