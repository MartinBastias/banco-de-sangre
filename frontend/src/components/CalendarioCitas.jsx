import React, { useState } from 'react';
import Calendar from 'react-calendar';
import toast, { Toaster } from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';
import './CalendarioCitas.css';

/**
 * Componente interactivo para la gestión de agendamiento de citas.
 * Permite al donante seleccionar una sede física, una fecha hábil y un bloque horario disponible.
 * 
 * @component
 * @returns {JSX.Element} Interfaz de selección y visualización de disponibilidad.
 */
function CalendarioCitas() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [sede, setSede] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false); // Controla la visibilidad del modal

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
   * Simula el envío de datos a la API y muestra la notificación de éxito.
   */
  const confirmarCita = async () => {
    // Aquí se conectará la petición POST a la API del backend más adelante
    
    // Mostramos la notificación requerida
    toast.success('¡Cita agendada con éxito!', {
      style: { background: '#333', color: '#fff' }
    });
    
    setMostrarModal(false); // Cerramos el modal
    
    // Opcional: Reiniciar el formulario
    setSede('');
    setHoraSeleccionada('');
  };

  return (
    <>
      <Toaster position="top-right" />
      
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: 'white' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Selecciona una sede:</label>
          <select 
            value={sede} 
            onChange={(e) => setSede(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#242424', color: 'white', border: '1px solid #444' }}
          >
            <option value="">-- Elige una sede --</option>
            <option value="cpp">Sede Concepción</option>
            <option value="spp">Sede San Pedro de la Paz</option>
          </select>
        </div>

        <p style={{ marginBottom: '8px' }}>Selecciona un día:</p>
        <Calendar 
          onChange={manejarCambioDeFecha} 
          value={fechaSeleccionada} 
        />
        
        <div style={{ marginTop: '20px' }}>
          <p>Horarios para el {fechaSeleccionada.toLocaleDateString()}:</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {horariosDisponibles.map((hora) => (
              <button 
                key={hora}
                onClick={() => setHoraSeleccionada(hora)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #1a73e8',
                  background: horaSeleccionada === hora ? '#1a73e8' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {hora}
              </button>
            ))}
          </div>
        </div>

        {/* El botón ahora abre el modal*/}
        {sede && horaSeleccionada && (
          <button 
            style={{ marginTop: '30px', width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            onClick={() => setMostrarModal(true)}
          >
            Agendar Cita
          </button>
        )}
      </div>

      {/* Renderizado condicional del Modal de Confirmación */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Resumen de tu Cita</h3>
            <p><strong>Sede:</strong> {sede === 'cpp' ? 'Sede Concepción' : sede === 'spp' ? 'Sede San Pedro de la Paz': ''}</p>
            <p><strong>Fecha:</strong> {fechaSeleccionada.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {horaSeleccionada}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button 
                onClick={() => setMostrarModal(false)} 
                style={{ flex: 1, padding: '10px', background: 'transparent', color: 'white', border: '1px solid #6c757d', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarCita} 
                style={{ flex: 1, padding: '10px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarioCitas;