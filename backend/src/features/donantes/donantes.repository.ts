import { asc, eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { donantes, fichasMedicas } from '../../lib/db/schema.ts';

export async function buscarDonantePorRutDB(rut: string) {
  const [donante] = await db
    .select({
      rut: donantes.rut,
      fechaCreacion: donantes.fechaCreacion,
    })
    .from(donantes)
    .where(eq(donantes.rut, rut))
    .limit(1);

  return donante ?? null;
}

export async function insertarDonanteDB(rut: string) {
  const [creado] = await db
    .insert(donantes)
    .values({ rut })
    .returning({
      rut: donantes.rut,
      fechaCreacion: donantes.fechaCreacion,
    });

  return creado;
}

export async function asegurarDonanteRegistradoDB(rut: string) {
  await db.insert(donantes).values({ rut }).onConflictDoNothing();
}

export async function listarDonantesConEstadoDB() {
  return db
    .select({
      rut: donantes.rut,
      estadoClinico: fichasMedicas.estadoClinico,
      fechaElegibilidad: fichasMedicas.fechaElegibilidad,
      tipoSangre: fichasMedicas.tipoSangre,
      fechaCreacion: donantes.fechaCreacion,
    })
    .from(donantes)
    .leftJoin(fichasMedicas, eq(donantes.rut, fichasMedicas.rut))
    .orderBy(asc(donantes.rut));
}
