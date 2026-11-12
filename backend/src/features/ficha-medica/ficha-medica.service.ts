import { sql } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { fichasMedicas, medicalRecords } from '../../lib/db/schema.ts';

const tablaFichas = fichasMedicas || medicalRecords;

export interface EntradaFichaMedica {
  rut: string;
  bloodPressure?: string | null;
  heartRate?: number | null;
  weight?: number | null;
  clinicalStatus?: 'listo para donar' | 'Diferido' | null;
  bloodType?: string | null;
  eligibilityDate?: string | null;
  notes?: string | null;
}

export type MedicalRecordInput = EntradaFichaMedica;

/**
 * Inserta o actualiza la ficha médica y signos vitales del donante.
 */
export async function guardarFichaMedica(registro: EntradaFichaMedica) {
  await db
    .insert(tablaFichas)
    .values({
      rut: registro.rut,
      bloodPressure: registro.bloodPressure ?? null,
      heartRate: registro.heartRate ?? null,
      weight: registro.weight ?? null,
      clinicalStatus: registro.clinicalStatus ?? null,
      bloodType: registro.bloodType ?? null,
      eligibilityDate: registro.eligibilityDate ?? null,
      notes: registro.notes ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: tablaFichas.rut,
      set: {
        bloodPressure: registro.bloodPressure ?? null,
        heartRate: registro.heartRate ?? null,
        weight: registro.weight ?? null,
        clinicalStatus: registro.clinicalStatus ?? null,
        bloodType: registro.bloodType ?? null,
        eligibilityDate: registro.eligibilityDate ?? null,
        notes: registro.notes ?? null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });

  return {
    success: true,
    mensaje: 'Ficha médica registrada/actualizada correctamente',
  };
}

export const saveMedicalRecord = guardarFichaMedica;
