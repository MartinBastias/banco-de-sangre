import { useState } from 'react';
import toast from 'react-hot-toast';

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

  const horariosDisponibles = ['09:00', '10:00', '11:30', '14:00', '15:30'];

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
   * y muestra la notificación correspondiente.
   */
  const confirmarCita = async () => {
    if (accionActual === 'cancelar') {
      toast.success('Cita cancelada con éxito', { style: { background: '#333', color: '#fff' } });
      setCitaActiva(null);
      setAccionActual('crear');
    } else {
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
    manejarCambioDeFecha,
    confirmarCita,
    abrirModal
  };
};