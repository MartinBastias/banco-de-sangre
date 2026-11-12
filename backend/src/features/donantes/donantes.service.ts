import { asc, eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { donantes, fichasMedicas } from '../../lib/db/schema.ts';

export class ErrorDonante extends Error {
  statusCode: number;

  constructor(mensaje: string, statusCode = 400) {
    super(mensaje);
    this.statusCode = statusCode;
  }
}

/**
 * Normaliza el RUT eliminando puntos y espacios, y convirtiendo a mayúsculas.
 */
export function normalizarRut(rut: string): string {
  return rut.trim().replace(/\./g, '').toUpperCase();
}

/**
 * Registra un nuevo donante usando su RUT.
 */
export async function registrarDonante(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);

  if (!rut || rut.length < 3) {
    throw new ErrorDonante('Debes ingresar un RUT válido.', 400);
  }

  const [existente] = await db
    .select({
      rut: donantes.rut,
      fechaCreacion: donantes.fechaCreacion,
    })
    .from(donantes)
    .where(eq(donantes.rut, rut))
    .limit(1);

  if (existente) {
    throw new ErrorDonante(
      'El donante con este RUT ya se encuentra registrado.',
      409,
    );
  }

  const [creado] = await db
    .insert(donantes)
    .values({ rut })
    .returning({
      rut: donantes.rut,
      fechaCreacion: donantes.fechaCreacion,
    });

  return creado;
}

/**
 * Busca un donante registrado por su RUT.
 */
export async function buscarDonantePorRut(rutCrudo: string) {
  const rut = normalizarRut(rutCrudo);

  if (!rut) {
    return null;
  }

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

/**
 * Lista todos los donantes registrados junto con su estado clínico actual.
 */
export async function listarDonantesConEstado() {
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

