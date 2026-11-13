export type TipoAccionCita = 'crear' | 'editar' | 'cancelar';

export interface CitaActiva {
  id: number;
  sede: string;
  fechaSeleccionada: Date;
  horaSeleccionada: string;
}

export interface SlotDisponibilidad {
  hora: string;
  cuposDisponibles: number;
  disponible: boolean;
}

export interface DisponibilidadCitas {
  elegible: boolean;
  estadoClinico?: string;
  fechaBase?: string;
  fechaMinimaDisponible?: string;
  avanzadaPorDisponibilidad?: boolean;
  fechaConsultada?: string;
  slotsFechaConsultada?: SlotDisponibilidad[];
  diasSinCupos?: string[];
  motivo?: string;
}

export const HORARIOS_DISPONIBLES = [
  '09:00',
  '10:00',
  '11:30',
  '14:00',
  '15:30',
] as const;

export const formatearFechaIsoLocal = (fecha: Date): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Determina si un bloque horario ya transcurrió para la fecha dada.
 */
export const esHoraPasada = (
  fecha: Date,
  hora: string,
  fechaReferencia: Date = new Date(),
): boolean => {
  const [horas, minutos] = hora.split(':').map(Number);
  const fechaHoraBloque = new Date(fecha);
  fechaHoraBloque.setHours(horas, minutos, 0, 0);
  return fechaHoraBloque.getTime() <= fechaReferencia.getTime();
};

export const calcularFechaMinima = (
  fechaMinima?: string | null,
  fechaReferencia: Date = new Date(),
): Date => {
  const hoy = new Date(fechaReferencia);
  hoy.setHours(0, 0, 0, 0);

  let minima = hoy;
  const todosBloquesHoyPasaron = HORARIOS_DISPONIBLES.every((hora) =>
    esHoraPasada(hoy, hora, fechaReferencia),
  );
  if (todosBloquesHoyPasaron) {
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    minima = manana;
  }

  if (!fechaMinima) return minima;
  const fechaParseada = new Date(`${fechaMinima}T00:00:00`);
  if (
    Number.isNaN(fechaParseada.getTime()) ||
    fechaParseada.getTime() <= minima.getTime()
  ) {
    return minima;
  }
  return fechaParseada;
};
