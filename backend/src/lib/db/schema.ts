import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const donantes = pgTable('donantes', {
  rut: text('rut').primaryKey(),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

export const citas = pgTable(
  'citas',
  {
    id: integer('id').generatedByDefaultAsIdentity().primaryKey(),
    rut: text('rut').notNull(),
    sede: text('sede').notNull(),
    fecha: text('fecha').notNull(),
    hora: text('hora').notNull(),
    estado: text('estado').default('agendada'),
    createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'citas_estado_check',
      sql`${table.estado} IN ('agendada', 'cancelada', 'realizada')`,
    ),
  ],
);

export const appointments = citas;

export const fichasMedicas = pgTable(
  'ficha_medica',
  {
    rut: text('rut').primaryKey(),
    bloodPressure: text('presion_arterial'),
    heartRate: integer('frecuencia_cardiaca'),
    weight: real('peso'),
    clinicalStatus: text('estado_clinico'),
    bloodType: text('tipo_sangre'),
    eligibilityDate: text('fecha_elegibilidad'),
    notes: text('observaciones'),
    updatedAt: timestamp('fecha_actualizacion', {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    check(
      'ficha_medica_estado_clinico_check',
      sql`${table.clinicalStatus} IS NULL OR ${table.clinicalStatus} IN ('listo para donar', 'Diferido')`,
    ),
  ],
);

export const medicalRecords = fichasMedicas;
