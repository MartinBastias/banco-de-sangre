import {
  horaAMinutos,
  obtenerFechaYMinutosActuales,
  sumarDiasIso,
} from '../../lib/fechas.ts';
import { normalizarEstadoClinico } from '../ficha-medica/ficha-medica.validation.ts';
import {
  CAPACIDAD_MAXIMA_BLOQUE,
  type CitaOcupada,
  DIAS_VENTANA_CALENDARIO,
  ErrorCita,
  type FichaElegibilidad,
  HORARIOS_DISPONIBLES,
  MARGEN_ANTICIPACION_MINUTOS,
  MAX_DIAS_BUSQUEDA_DISPONIBILIDAD,
  type ParametrosDisponibilidad,
  type ResultadoDisponibilidad,
  SEDES_VALIDAS,
  type SlotDisponibilidad,
} from './citas.types.ts';

export function validarCapacidadBloque(ocupacionActual: number): void {
  if (ocupacionActual >= CAPACIDAD_MAXIMA_BLOQUE) {
    throw new ErrorCita(
      'El bloque horario ha superado su capacidad máxima.',
    );
  }
}

export function validarElegibilidadParaCita(
  ficha: FichaElegibilidad | null,
  fechaCita: string,
): void {
  if (!ficha) {
    return;
  }

  const estado = normalizarEstadoClinico(ficha.estadoClinico ?? undefined);
  if (estado === 'Excluyente') {
    throw new ErrorCita(
      'El donante tiene estado Excluyente y no puede agendar citas.',
    );
  }

  if (estado === 'Diferido temporalmente') {
    if (!ficha.fechaElegibilidad) {
      throw new ErrorCita(
        'El donante se encuentra diferido temporalmente sin fecha de elegibilidad definida.',
      );
    }
    if (fechaCita < ficha.fechaElegibilidad) {
      throw new ErrorCita(
        `El donante está diferido temporalmente. Solo puede agendar citas desde el ${ficha.fechaElegibilidad}.`,
      );
    }
  }
}

export function calcularFechaBaseElegibilidad(
  ficha: FichaElegibilidad | null,
  fechaActual: string,
):
  | { elegible: true; estadoClinico: string; fechaBase: string }
  | { elegible: false; estadoClinico: string; motivo: string } {
  if (!ficha) {
    return { elegible: true, estadoClinico: 'Apto', fechaBase: fechaActual };
  }

  const estadoClinico =
    normalizarEstadoClinico(ficha.estadoClinico ?? undefined) ?? 'Apto';
  if (estadoClinico === 'Excluyente') {
    return {
      elegible: false,
      estadoClinico,
      motivo: 'El donante tiene estado Excluyente y no puede agendar citas.',
    };
  }

  if (estadoClinico === 'Diferido temporalmente') {
    if (!ficha.fechaElegibilidad) {
      return {
        elegible: false,
        estadoClinico,
        motivo:
          'El donante se encuentra diferido temporalmente sin fecha de elegibilidad definida.',
      };
    }
    const fechaBase =
      ficha.fechaElegibilidad > fechaActual
        ? ficha.fechaElegibilidad
        : fechaActual;
    return { elegible: true, estadoClinico, fechaBase };
  }

  return { elegible: true, estadoClinico, fechaBase: fechaActual };
}

export function esHoraEnVentana(
  fecha: string,
  hora: string,
  fechaActual: string,
  minutosActuales: number,
  margenAnticipacionMinutos: number = MARGEN_ANTICIPACION_MINUTOS,
): boolean {
  if (fecha < fechaActual) {
    return false;
  }
  if (fecha > fechaActual) {
    return true;
  }
  return horaAMinutos(hora) > minutosActuales + margenAnticipacionMinutos;
}

export function obtenerSlotsDia(params: {
  fecha: string;
  sede?: string;
  conteosPorClave: ReadonlyMap<string, number>;
  fechaActual: string;
  minutosActuales: number;
  margenAnticipacionMinutos?: number;
  diasCerrados?: ReadonlySet<string>;
}): SlotDisponibilidad[] {
  const {
    fecha,
    sede,
    conteosPorClave,
    fechaActual,
    minutosActuales,
    margenAnticipacionMinutos = MARGEN_ANTICIPACION_MINUTOS,
    diasCerrados,
  } = params;

  if (diasCerrados?.has(fecha)) {
    return HORARIOS_DISPONIBLES.map((hora) => ({
      hora,
      cuposDisponibles: 0,
      disponible: false,
    }));
  }

  const sedeValida =
    sede && SEDES_VALIDAS.includes(sede as (typeof SEDES_VALIDAS)[number])
      ? sede
      : undefined;

  return HORARIOS_DISPONIBLES.map((hora) => {
    if (
      !esHoraEnVentana(
        fecha,
        hora,
        fechaActual,
        minutosActuales,
        margenAnticipacionMinutos,
      )
    ) {
      return { hora, cuposDisponibles: 0, disponible: false };
    }

    if (sedeValida) {
      const ocupados =
        conteosPorClave.get(`${sedeValida}|${fecha}|${hora}`) ?? 0;
      const cuposDisponibles = Math.max(0, CAPACIDAD_MAXIMA_BLOQUE - ocupados);
      return {
        hora,
        cuposDisponibles,
        disponible: cuposDisponibles > 0,
      };
    }

    const cuposDisponibles = Math.max(
      ...SEDES_VALIDAS.map((sedeItem) => {
        const ocupados =
          conteosPorClave.get(`${sedeItem}|${fecha}|${hora}`) ?? 0;
        return Math.max(0, CAPACIDAD_MAXIMA_BLOQUE - ocupados);
      }),
    );
    return {
      hora,
      cuposDisponibles,
      disponible: cuposDisponibles > 0,
    };
  });
}

function construirConteosPorClave(
  citasAgendadas: CitaOcupada[],
): Map<string, number> {
  const conteos = new Map<string, number>();
  for (const cita of citasAgendadas) {
    const clave = `${cita.sede}|${cita.fecha}|${cita.hora}`;
    conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
  }
  return conteos;
}

export function evaluarDisponibilidadCitas(
  params: ParametrosDisponibilidad,
): ResultadoDisponibilidad {
  const {
    ficha,
    sede,
    fechaConsulta,
    citasAgendadas,
    ahora = new Date(),
    margenAnticipacionMinutos = MARGEN_ANTICIPACION_MINUTOS,
    diasCerrados,
    maxDiasBusqueda = MAX_DIAS_BUSQUEDA_DISPONIBILIDAD,
  } = params;

  const { fechaActual, minutosActuales } = obtenerFechaYMinutosActuales(ahora);
  const elegibilidad = calcularFechaBaseElegibilidad(ficha, fechaActual);

  if (!elegibilidad.elegible) {
    return elegibilidad;
  }

  const { estadoClinico, fechaBase } = elegibilidad;
  const conteosPorClave = construirConteosPorClave(citasAgendadas);

  let fechaMinimaDisponible: string | null = null;
  let slotsMinima: SlotDisponibilidad[] = [];
  const diasSinCuposSet = new Set<string>();

  for (let offset = 0; offset <= maxDiasBusqueda; offset += 1) {
    const fechaCandidata = sumarDiasIso(fechaBase, offset);
    const slotsDia = obtenerSlotsDia({
      fecha: fechaCandidata,
      sede,
      conteosPorClave,
      fechaActual,
      minutosActuales,
      margenAnticipacionMinutos,
      diasCerrados,
    });
    const tieneCupos = slotsDia.some((slot) => slot.disponible);

    if (tieneCupos) {
      if (!fechaMinimaDisponible) {
        fechaMinimaDisponible = fechaCandidata;
        slotsMinima = slotsDia;
      }
    } else if (!fechaMinimaDisponible || offset <= DIAS_VENTANA_CALENDARIO) {
      diasSinCuposSet.add(fechaCandidata);
    }

    if (fechaMinimaDisponible && offset >= DIAS_VENTANA_CALENDARIO) {
      break;
    }
  }

  if (!fechaMinimaDisponible) {
    return {
      elegible: false,
      estadoClinico,
      motivo: 'No hay cupos disponibles en los próximos días.',
    };
  }

  const fechaConsultada =
    fechaConsulta && fechaConsulta >= fechaMinimaDisponible
      ? fechaConsulta
      : fechaMinimaDisponible;

  const slotsFechaConsultada =
    fechaConsultada === fechaMinimaDisponible
      ? slotsMinima
      : obtenerSlotsDia({
          fecha: fechaConsultada,
          sede,
          conteosPorClave,
          fechaActual,
          minutosActuales,
          margenAnticipacionMinutos,
          diasCerrados,
        });

  return {
    elegible: true,
    estadoClinico,
    fechaBase,
    fechaMinimaDisponible,
    avanzadaPorDisponibilidad: fechaMinimaDisponible > fechaBase,
    fechaConsultada,
    slotsFechaConsultada,
    diasSinCupos: Array.from(diasSinCuposSet).sort(),
  };
}

export function validarReservaDisponible(params: {
  ficha: FichaElegibilidad | null;
  sede: string;
  fecha: string;
  hora: string;
  citasAgendadas: CitaOcupada[];
  ahora?: Date;
  margenAnticipacionMinutos?: number;
  diasCerrados?: ReadonlySet<string>;
}): void {
  const {
    ficha,
    sede,
    fecha,
    hora,
    citasAgendadas,
    ahora = new Date(),
    margenAnticipacionMinutos = MARGEN_ANTICIPACION_MINUTOS,
    diasCerrados,
  } = params;

  if (!SEDES_VALIDAS.includes(sede as (typeof SEDES_VALIDAS)[number])) {
    throw new ErrorCita('La sede seleccionada no es válida.');
  }

  if (
    !HORARIOS_DISPONIBLES.includes(hora as (typeof HORARIOS_DISPONIBLES)[number])
  ) {
    throw new ErrorCita('El horario seleccionado no es válido.');
  }

  const disponibilidad = evaluarDisponibilidadCitas({
    ficha,
    sede,
    fechaConsulta: fecha,
    citasAgendadas,
    ahora,
    margenAnticipacionMinutos,
    diasCerrados,
  });

  if (!disponibilidad.elegible) {
    throw new ErrorCita(disponibilidad.motivo);
  }

  validarElegibilidadParaCita(ficha, fecha);

  if (fecha < disponibilidad.fechaMinimaDisponible) {
    throw new ErrorCita(
      `No hay cupos disponibles para el ${fecha}. La fecha mínima seleccionable es ${disponibilidad.fechaMinimaDisponible}.`,
    );
  }

  const slot = disponibilidad.slotsFechaConsultada.find(
    (item) => item.hora === hora,
  );
  if (slot?.disponible) {
    return;
  }

  if (diasCerrados?.has(fecha)) {
    throw new ErrorCita('No hay atención disponible en la fecha seleccionada.');
  }

  const { fechaActual, minutosActuales } = obtenerFechaYMinutosActuales(ahora);
  if (
    !esHoraEnVentana(
      fecha,
      hora,
      fechaActual,
      minutosActuales,
      margenAnticipacionMinutos,
    )
  ) {
    throw new ErrorCita(
      'El horario seleccionado ya pasó o no cumple con la anticipación mínima.',
    );
  }

  validarCapacidadBloque(CAPACIDAD_MAXIMA_BLOQUE);
}
