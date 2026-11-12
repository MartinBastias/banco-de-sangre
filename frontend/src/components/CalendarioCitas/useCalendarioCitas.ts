'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type TipoAccionCita = 'crear' | 'editar' | 'cancelar';

export interface CitaActiva {
  id: number;
  sede: string;
  fechaSeleccionada: Date;
  horaSeleccionada: string;
}

export const HORARIOS_DISPONIBLES = [
  '09:00',
  '10:00',
  '11:30',
  '14:00',
  '15:30',
] as const;

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

const calcularFechaMinima = (fechaMinima?: string | null): Date => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (!fechaMinima) return hoy;
  const fechaParseada = new Date(`${fechaMinima}T00:00:00`);
  if (
    Number.isNaN(fechaParseada.getTime()) ||
    fechaParseada.getTime() <= hoy.getTime()
  ) {
    return hoy;
  }
  return fechaParseada;
};

/**
 * Hook para la lógica y estado del agendamiento, reagendamiento y cancelación de citas.
 */
export const useCalendarioCitas = (
  citaInicial: CitaActiva | null = null,
  rutDonante?: string,
  fechaMinima?: string | null,
) => {
  const fechaMinimaPermitida = calcularFechaMinima(fechaMinima);
  const [fechaSeleccionadaCruda, setFechaSeleccionada] = useState<Date>(() =>
    calcularFechaMinima(fechaMinima),
  );
  const fechaSeleccionada = (() => {
    const sinHora = new Date(fechaSeleccionadaCruda);
    sinHora.setHours(0, 0, 0, 0);
    return sinHora.getTime() < fechaMinimaPermitida.getTime()
      ? fechaMinimaPermitida
      : fechaSeleccionadaCruda;
  })();
  const [sede, setSede] = useState<string>('');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  const [accionActual, setAccionActual] = useState<TipoAccionCita>('crear');
  const [citaActiva, setCitaActiva] = useState<CitaActiva | null>(citaInicial);

  // Reloj interno actualizado periódicamente para desactivar bloques pasados del día de hoy.
  const [ahora, setAhora] = useState<Date>(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

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

  const esHoraBloqueada = (hora: string): boolean =>
    esHoraPasada(fechaSeleccionada, hora, ahora);

  const manejarCambioDeFecha = (valor: unknown) => {
    if (valor instanceof Date) {
      setFechaSeleccionada(valor);
      setHoraSeleccionada('');
    }
  };

  const confirmarCita = async () => {
    const rutActivo = rutDonante || '11111111-1';

    if (accionActual === 'cancelar') {
      if (!citaActiva) return;

      try {
        const respuesta = await fetch(
          `${API_URL}/api/citas/${citaActiva.id}`,
          {
            method: 'DELETE',
          },
        );

        if (!respuesta.ok) {
          const datosError = (await respuesta.json()) as { error?: string };
          throw new Error(datosError.error || 'Error al cancelar la cita');
        }

        toast.success('Cita cancelada con éxito');
        setCitaActiva(null);
        setAccionActual('crear');
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

      if (esHoraPasada(fechaSeleccionada, horaSeleccionada)) {
        toast.error(
          'Esa hora ya pasó. Por favor, selecciona un horario aún disponible.',
        );
        setHoraSeleccionada('');
        setMostrarModal(false);
        return;
      }

      const desfaseHorario = fechaSeleccionada.getTimezoneOffset() * 60000;
      const fechaLocal = new Date(fechaSeleccionada.getTime() - desfaseHorario);
      const fechaFormateada = fechaLocal.toISOString().split('T')[0];

      if (fechaMinima && fechaFormateada < fechaMinima) {
        toast.error(
          `Estás diferido temporalmente. Solo puedes agendar citas desde el ${fechaMinima}.`,
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
          esEdicion && citaActiva
            ? citaActiva.id
            : (datos.cita?.id ?? 0);

        setCitaActiva({
          id: idCita,
          sede,
          fechaSeleccionada,
          horaSeleccionada,
        });
        setAccionActual('crear');
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error al procesar la cita';
        toast.error(mensaje);
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

  return {
    fechaSeleccionada,
    setFechaSeleccionada,
    sede,
    setSede,
    horaSeleccionada,
    setHoraSeleccionada,
    mostrarModal,
    setMostrarModal,
    accionActual,
    setAccionActual,
    citaActiva,
    setCitaActiva,
    fechaMinimaPermitida,
    horariosDisponibles: HORARIOS_DISPONIBLES,
    esHoraBloqueada,
    manejarCambioDeFecha,
    manejarReagendamiento,
    confirmarCita,
    abrirModal,
  };
};
