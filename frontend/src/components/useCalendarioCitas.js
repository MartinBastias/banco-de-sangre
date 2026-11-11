import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Determina si un bloque horario ya transcurrió para la fecha indicada.
 *
 * Un bloque se considera "ya pasado" cuando su hora de inicio es menor o igual
 * a la hora de referencia: si son las 10:00 de la mañana, el bloque de las 09:00
 * ya no puede agendarse.
 *
 * @param {Date} fecha - Fecha seleccionada para la cita.
 * @param {string} hora - Bloque horario en formato 'HH:MM' (ej. '09:00').
 * @param {Date} [referencia=new Date()] - Hora contra la cual se compara; por defecto, la actual del sistema.
 * @returns {boolean} true si la hora de la cita ya transcurrió.
 */
export const esHoraPasada = (fecha, hora, referencia = new Date()) => {
  const [horas, minutos] = hora.split(':').map(Number);
  const fechaYHoraCita = new Date(fecha);
  fechaYHoraCita.setHours(horas, minutos, 0, 0);
  return fechaYHoraCita.getTime() <= referencia.getTime();
};

/**
 * Hook que gestiona el estado y la lógica de negocio para el agendamiento de citas.
 * 
 * @returns {Object} Estado y funciones controladoras para la interfaz de calendario.
 */
export const useCalendarioCitas = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [sede, setSede] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  const [accionActual, setAccionActual] = useState('crear');
  const [citaActiva, setCitaActiva] = useState(null);

  // Reloj interno que se refresca cada 30 segundos para volver a renderizar la
  // interfaz y deshabilitar los bloques horarios de hoy a medida que pasan.
  const [ahora, setAhora] = useState(() => new Date());

  const horariosDisponibles = ['09:00', '10:00', '11:30', '14:00', '15:30'];

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  /**
   * Indica si un bloque horario ya transcurrió para la fecha seleccionada,
   * usando el reloj interno del hook para mantener la interfaz al día.
   *
   * @param {string} hora - Bloque horario en formato 'HH:MM'.
   * @returns {boolean} true si el bloque ya pasó y no debe agendarse.
   */
  const esHoraBloqueada = (hora) => esHoraPasada(fechaSeleccionada, hora, ahora);

  /**
   * Maneja la selección de una nueva fecha en el calendario y reinicia el bloque horario.
   * 
   * @param {Date} nuevaFecha - Objeto Date seleccionado por el usuario.
   */
  const manejarCambioDeFecha = (nuevaFecha) => {
    setFechaSeleccionada(nuevaFecha);
    setHoraSeleccionada('');
  };

  /**
   * Simula la petición a la API para procesar la creación, edición o cancelación de la cita,
   * y muestra la notificación correspondiente. Antes de crear o reagendar, valida que el
   * bloque horario seleccionado no haya transcurrido.
   */
  const confirmarCita = async () => {
    if (accionActual === 'cancelar') {
      toast.success('Cita cancelada con éxito', { style: { background: '#333', color: '#fff' } });
      setCitaActiva(null);
      setAccionActual('crear');
    } else {
      // Validación de negocio: no se permite agendar un bloque horario que ya transcurrió.
      if (esHoraPasada(fechaSeleccionada, horaSeleccionada)) {
        toast.error('Esa hora ya pasó. Por favor, selecciona un horario aún disponible.', {
          style: { background: '#333', color: '#fff' }
        });
        setHoraSeleccionada('');
        setMostrarModal(false);
        return;
      }

      toast.success(accionActual === 'editar' ? '¡Cita reagendada con éxito!' : '¡Cita agendada con éxito!', {
        style: { background: '#333', color: '#fff' }
      });
      setCitaActiva({ sede, fechaSeleccionada, horaSeleccionada });
      setAccionActual('crear');
    }
    
    setMostrarModal(false);
    setSede('');
    setHoraSeleccionada('');
  };

  /**
   * Prepara el formulario para reagendar la cita activa, precargando su sede, fecha y hora.
   * Si la hora de la cita ya transcurrió, no se precarga para obligar a elegir un bloque vigente.
   */
  const manejarReagendamiento = () => {
    setAccionActual('editar');
    setSede(citaActiva.sede);
    setFechaSeleccionada(citaActiva.fechaSeleccionada);
    setHoraSeleccionada(
      esHoraPasada(citaActiva.fechaSeleccionada, citaActiva.horaSeleccionada)
        ? ''
        : citaActiva.horaSeleccionada
    );
  };

  /**
   * Configura la acción a realizar y despliega el modal de confirmación correspondiente.
   * 
   * @param {string} accion - Tipo de acción ('crear', 'editar', 'cancelar').
   */
  const abrirModal = (accion) => {
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
    horariosDisponibles,
    esHoraBloqueada,
    manejarCambioDeFecha,
    manejarReagendamiento,
    confirmarCita,
    abrirModal
  };
};