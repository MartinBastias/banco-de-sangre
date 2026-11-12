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
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'citas_estado_check',
      sql`${table.estado} IN ('agendada', 'cancelada', 'realizada')`,
    ),
  ],
);

export const fichasMedicas = pgTable(
  'ficha_medica',
  {
    rut: text('rut').primaryKey(),
    presionArterial: text('presion_arterial'),
    frecuenciaCardiaca: integer('frecuencia_cardiaca'),
    peso: real('peso'),
    estadoClinico: text('estado_clinico'),
    tipoSangre: text('tipo_sangre'),
    fechaElegibilidad: text('fecha_elegibilidad'),
    observaciones: text('observaciones'),
    fechaActualizacion: timestamp('fecha_actualizacion', {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    check(
      'ficha_medica_estado_clinico_check',
      sql`${table.estadoClinico} IS NULL OR ${table.estadoClinico} IN ('Apto', 'Diferido temporalmente', 'Excluyente')`,
    ),
  ],
);
