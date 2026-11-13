import { eq, sql } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { fichasMedicas } from '../../lib/db/schema.ts';
import type { DatosFichaMedicaPreparados } from './ficha-medica.types.ts';

export async function obtenerFichaMedicaDB(rut: string) {
  const [fila] = await db
    .select()
    .from(fichasMedicas)
    .where(eq(fichasMedicas.rut, rut))
    .limit(1);

  return fila ?? null;
}

export async function guardarFichaMedicaDB(datos: DatosFichaMedicaPreparados) {
  const [guardada] = await db
    .insert(fichasMedicas)
    .values({
      rut: datos.rut,
      peso: datos.peso,
      estadoClinico: datos.estadoClinico,
      tipoSangre: datos.tipoSangre,
      fechaElegibilidad: datos.fechaElegibilidad,
      observaciones: datos.observaciones,
      fechaActualizacion: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: fichasMedicas.rut,
      set: {
        peso: datos.peso,
        estadoClinico: datos.estadoClinico,
        tipoSangre: datos.tipoSangre,
        fechaElegibilidad: datos.fechaElegibilidad,
        observaciones: datos.observaciones,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();

  return guardada;
}
