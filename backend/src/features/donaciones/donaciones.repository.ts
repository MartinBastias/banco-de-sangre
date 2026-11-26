import { desc, eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { donaciones } from '../../lib/db/schema.ts';
import type {
  DatosDonacionPreparados,
  RegistroDonacionDB,
} from './donaciones.types.ts';

const COLUMNAS_DONACION = {
  id: donaciones.id,
  rut: donaciones.rut,
  idBolsa: donaciones.idBolsa,
  tipoSangre: donaciones.tipoSangre,
  mlExtraidos: donaciones.mlExtraidos,
  fechaDonacion: donaciones.fechaDonacion,
};

/**
 * Busca una donación registrada por su identificador único de bolsa.
 */
export async function buscarDonacionPorIdBolsaDB(
  idBolsa: string,
): Promise<RegistroDonacionDB | null> {
  const [donacion] = await db
    .select(COLUMNAS_DONACION)
    .from(donaciones)
    .where(eq(donaciones.idBolsa, idBolsa))
    .limit(1);

  return donacion ?? null;
}

/**
 * Inserta un nuevo registro de donación en la base de datos.
 */
export async function insertarDonacionDB(
  datos: DatosDonacionPreparados,
): Promise<RegistroDonacionDB> {
  const [creada] = await db
    .insert(donaciones)
    .values({
      rut: datos.rut,
      idBolsa: datos.idBolsa,
      tipoSangre: datos.tipoSangre,
      mlExtraidos: datos.mlExtraidos,
    })
    .returning(COLUMNAS_DONACION);

  return creada;
}

/**
 * Lista las donaciones ordenadas de más reciente a más antigua, opcionalmente filtradas por RUT.
 */
export async function listarDonacionesDB(
  rut?: string,
): Promise<RegistroDonacionDB[]> {
  const consulta = db.select(COLUMNAS_DONACION).from(donaciones);

  if (rut) {
    return consulta
      .where(eq(donaciones.rut, rut))
      .orderBy(desc(donaciones.fechaDonacion), desc(donaciones.id));
  }

  return consulta.orderBy(desc(donaciones.fechaDonacion), desc(donaciones.id));
}
