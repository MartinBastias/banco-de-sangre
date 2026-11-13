'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { API_URL } from '@/lib/constantes';
import {
  calcularFechaMinima,
  type CitaActiva,
  type DisponibilidadCitas,
  esHoraPasada,
  formatearFechaIsoLocal,
  HORARIOS_DISPONIBLES,
  type SlotDisponibilidad,
  type TipoAccionCita,
} from './calendarioCitas.utils';

export {
  calcularFechaMinima,
  esHoraPasada,
  formatearFechaIsoLocal,
  HORARIOS_DISPONIBLES,
};
export type {
  CitaActiva,
  DisponibilidadCitas,
  SlotDisponibilidad,
  TipoAccionCita,
};

/**
 * Hook para la lógica y estado del agendamiento, reagendamiento y cancelación de citas.
 */
export const useCalendarioCitas = (
  citaInicial: CitaActiva | null = null,
  rutDonante?: string,
  fechaMinima?: string | null,
) => {
  const [ahora, setAhora] = useState<Date>(() => new Date());
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadCitas | null>(null);
  const [versionDisponibilidad, setVersionDisponibilidad] = useState<number>(0);

  const fechaMinimaServidor =
    disponibilidad?.elegible && disponibilidad.fechaMinimaDisponible
      ? disponibilidad.fechaMinimaDisponible
      : null;

  const fechaMinimaCombinada = (() => {
    if (!fechaMinima) return fechaMinimaServidor;
    if (!fechaMinimaServidor) return fechaMinima;
    return fechaMinimaServidor > fechaMinima ? fechaMinimaServidor : fechaMinima;
  })();

  const fechaMinimaPermitida = calcularFechaMinima(fechaMinimaCombinada, ahora);
  const fechaMinimaEfectivaStr = formatearFechaIsoLocal(fechaMinimaPermitida);

  const [fechaSeleccionadaCruda, setFechaSeleccionada] = useState<Date>(() =>
    calcularFechaMinima(fechaMinima),
  );
  const diasSinCuposSet = new Set(disponibilidad?.diasSinCupos ?? []);

  const fechaSeleccionada = (() => {
    const sinHora = new Date(fechaSeleccionadaCruda);
    sinHora.setHours(0, 0, 0, 0);
    if (sinHora.getTime() < fechaMinimaPermitida.getTime()) {
      return fechaMinimaPermitida;
    }
    if (diasSinCuposSet.has(formatearFechaIsoLocal(sinHora))) {
      return fechaMinimaPermitida;
    }
    return fechaSeleccionadaCruda;
  })();

  const fechaSeleccionadaStr = formatearFechaIsoLocal(fechaSeleccionada);
  const [sede, setSede] = useState<string>('');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  const [accionActual, setAccionActual] = useState<TipoAccionCita>('crear');
  const [citaActiva, setCitaActiva] = useState<CitaActiva | null>(citaInicial);

  useEffect(() => {
    const intervalId = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (citaActiva && accionActual !== 'editar') {
      return;
    }

    let cancelado = false;
    const consultarDisponibilidad = async () => {
      try {
        const parametros = new URLSearchParams();
        if (rutDonante) {
          parametros.set('rut', rutDonante);
        }
        if (sede) {
          parametros.set('sede', sede);
        }
        parametros.set('fecha', fechaSeleccionadaStr);
        if (accionActual === 'editar' && citaActiva?.id) {
          parametros.set('excluirCitaId', String(citaActiva.id));
        }

        const respuesta = await fetch(
          `${API_URL}/api/citas/disponibilidad?${parametros.toString()}`,
        );
        if (!respuesta.ok) return;
        const datos = (await respuesta.json()) as DisponibilidadCitas;
        if (!cancelado) {
          setDisponibilidad(datos);
        }
      } catch {
        // Si falla la consulta de disponibilidad, se mantiene el cálculo local
      }
    };

    void consultarDisponibilidad();
    return () => {
      cancelado = true;
    };
  }, [
    rutDonante,
    sede,
    fechaSeleccionadaStr,
    accionActual,
    citaActiva,
    versionDisponibilidad,
  ]);

  useEffect(() => {
    if (!rutDonante || citaInicial) return;

    let cancelado = false;
    const cargarCitaActiva = async () => {
      try {
        const respuesta = await fetch(
          `${API_URL}/api/citas?rut=${encodeURIComponent(rutDonante)}`,
        );
        if (!respuesta.ok) return;
        const datos = (await respuesta.json()) as {
          cita?: {
            id: number;
            sede: string;
            fecha: string;
            hora: string;
          } | null;
        };
        if (!cancelado && datos.cita) {
          const fecha = new Date(`${datos.cita.fecha}T00:00:00`);
          setCitaActiva({
            id: datos.cita.id,
            sede: datos.cita.sede,
            fechaSeleccionada: fecha,
            horaSeleccionada: datos.cita.hora,
          });
        }
      } catch {
        // Ignorar error silenciosamente al consultar cita inicial
      }
    };

    void cargarCitaActiva();
    return () => {
      cancelado = true;
    };
  }, [rutDonante, citaInicial]);

  const obtenerSlotServidor = (hora: string): SlotDisponibilidad | undefined => {
    if (
      !disponibilidad?.elegible ||
      disponibilidad.fechaConsultada !== fechaSeleccionadaStr
    ) {
      return undefined;
    }
    return disponibilidad.slotsFechaConsultada?.find(
      (slot) => slot.hora === hora,
    );
  };

  const esHoraBloqueada = (hora: string): boolean => {
    if (esHoraPasada(fechaSeleccionada, hora, ahora)) {
      return true;
    }
    const slotServidor = obtenerSlotServidor(hora);
    return slotServidor ? !slotServidor.disponible : false;
  };

  const obtenerMotivoBloqueoHora = (hora: string): string | undefined => {
    if (esHoraPasada(fechaSeleccionada, hora, ahora)) {
      return 'Este horario ya pasó';
    }
    const slotServidor = obtenerSlotServidor(hora);
    if (slotServidor && !slotServidor.disponible) {
      return 'Sin cupos disponibles en este horario';
    }
    return undefined;
  };

  const esDiaDeshabilitado = (fecha: Date, vista: string): boolean => {
    if (vista !== 'month') {
      return false;
    }
    return diasSinCuposSet.has(formatearFechaIsoLocal(fecha));
  };

  const manejarCambioDeFecha = (valor: unknown) => {
    if (valor instanceof Date) {
      setFechaSeleccionada(valor);
      setHoraSeleccionada('');
    }
  };

  const manejarCambioDeSede = (nuevaSede: string) => {
    setSede(nuevaSede);
    setHoraSeleccionada('');
  };

  const confirmarCita = async () => {
    const rutActivo = rutDonante || '11111111-1';

    if (accionActual === 'cancelar') {
      if (!citaActiva) return;

      try {
        const respuesta = await fetch(
          `${API_URL}/api/citas/${citaActiva.id}`,
          { method: 'DELETE' },
        );

        if (!respuesta.ok) {
          const datosError = (await respuesta.json()) as { error?: string };
          throw new Error(datosError.error || 'Error al cancelar la cita');
        }

        toast.success('Cita cancelada con éxito');
        setCitaActiva(null);
        setAccionActual('crear');
        setVersionDisponibilidad((v) => v + 1);
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error al cancelar la cita';
        toast.error(mensaje);
      }
    } else {
      const esEdicion = accionActual === 'editar';

      if (esEdicion && !citaActiva?.id) {
        toast.error('No se encontró la cita a reagendar.');
        setMostrarModal(false);
        return;
      }

      if (esHoraBloqueada(horaSeleccionada)) {
        toast.error(
          'Ese horario ya no está disponible. Por favor, selecciona otro.',
        );
        setHoraSeleccionada('');
        setMostrarModal(false);
        return;
      }

      const fechaFormateada = formatearFechaIsoLocal(fechaSeleccionada);

      if (fechaMinima && fechaFormateada < fechaMinima) {
        toast.error(
          `Estás diferido temporalmente. Solo puedes agendar citas desde el ${fechaMinima}.`,
        );
        setMostrarModal(false);
        return;
      }

      if (fechaFormateada < fechaMinimaEfectivaStr) {
        toast.error(
          `No hay cupos disponibles para esa fecha. La fecha mínima es ${fechaMinimaEfectivaStr}.`,
        );
        setMostrarModal(false);
        return;
      }

      const payload = {
        rut: rutActivo,
        sede,
        fecha: fechaFormateada,
        hora: horaSeleccionada,
      };

      try {
        const url =
          esEdicion && citaActiva
            ? `${API_URL}/api/citas/${citaActiva.id}`
            : `${API_URL}/api/citas`;

        const respuesta = await fetch(url, {
          method: esEdicion ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const datos = (await respuesta.json()) as {
          error?: string;
          cita?: { id: number };
        };

        if (!respuesta.ok) {
          throw new Error(datos.error || 'Error al procesar la cita');
        }

        toast.success(
          esEdicion
            ? '¡Cita reagendada con éxito!'
            : '¡Cita agendada con éxito!',
        );

        const idCita =
          esEdicion && citaActiva ? citaActiva.id : (datos.cita?.id ?? 0);

        setCitaActiva({
          id: idCita,
          sede,
          fechaSeleccionada,
          horaSeleccionada,
        });
        setAccionActual('crear');
        setVersionDisponibilidad((v) => v + 1);
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error al procesar la cita';
        toast.error(mensaje);
        setVersionDisponibilidad((v) => v + 1);
      }
    }

    setMostrarModal(false);
    setSede('');
    setHoraSeleccionada('');
  };

  const manejarReagendamiento = () => {
    if (!citaActiva) return;

    setAccionActual('editar');
    setSede(citaActiva.sede);
    const fecha = citaActiva.fechaSeleccionada;
    const hora = citaActiva.horaSeleccionada;
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(esHoraPasada(fecha, hora) ? '' : hora);
  };

  const abrirModal = (accion: TipoAccionCita) => {
    setAccionActual(accion);
    setMostrarModal(true);
  };

  const hoyIso = formatearFechaIsoLocal(ahora);
  const fechaBaseLocal =
    fechaMinima && fechaMinima > hoyIso ? fechaMinima : hoyIso;
  const avanzadaPorDisponibilidad = Boolean(
    (disponibilidad?.elegible && disponibilidad.avanzadaPorDisponibilidad) ||
      fechaMinimaEfectivaStr > fechaBaseLocal,
  );

  return {
    fechaSeleccionada,
    setFechaSeleccionada,
    sede,
    setSede,
    manejarCambioDeSede,
    horaSeleccionada,
    setHoraSeleccionada,
    mostrarModal,
    setMostrarModal,
    accionActual,
    setAccionActual,
    citaActiva,
    setCitaActiva,
    fechaMinimaPermitida,
    avanzadaPorDisponibilidad,
    horariosDisponibles: HORARIOS_DISPONIBLES,
    esHoraBloqueada,
    obtenerMotivoBloqueoHora,
    esDiaDeshabilitado,
    manejarCambioDeFecha,
    manejarReagendamiento,
    confirmarCita,
    abrirModal,
  };
};
