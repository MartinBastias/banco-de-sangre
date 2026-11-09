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

  return (
    <>
      <Toaster position="top-right" />
      
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', color: 'white' }}>
        
        {citaActiva && accionActual !== 'editar' ? (
          <div style={{ background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
            <h3 style={{ marginTop: 0 }}>Tu Cita Activa</h3>
            <p><strong>Sede:</strong> {citaActiva.sede === 'cpp' ? 'Sede Concepción' : citaActiva.sede === 'spp' ? 'Sede San Pedro de la Paz' : ''}</p>
            <p><strong>Fecha:</strong> {citaActiva.fechaSeleccionada.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {citaActiva.horaSeleccionada}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                onClick={() => abrirModal('cancelar')} 
                style={{ flex: 1, padding: '10px', background: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar Cita
              </button>
              <button 
                onClick={() => { 
                  setAccionActual('editar'); 
                  setSede(citaActiva.sede); 
                  setHoraSeleccionada(citaActiva.horaSeleccionada); 
                  setFechaSeleccionada(citaActiva.fechaSeleccionada); 
                }} 
                style={{ flex: 1, padding: '10px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Reagendar
              </button>
            </div>
          </div>
        ) : (
          <>
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

            {sede && horaSeleccionada && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                {accionActual === 'editar' && (
                  <button 
                    style={{ flex: 1, padding: '12px', background: 'transparent', color: 'white', border: '1px solid #6c757d', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => { setAccionActual('crear'); setSede(''); setHoraSeleccionada(''); }}
                  >
                    Volver
                  </button>
                )}
                <button 
                  style={{ flex: 2, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                  onClick={() => abrirModal(accionActual)}
                >
                  {accionActual === 'editar' ? 'Confirmar Reagendamiento' : 'Agendar Cita'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{accionActual === 'cancelar' ? 'Cancelar Cita' : 'Resumen de tu Cita'}</h3>
            
            {accionActual === 'cancelar' ? (
              <p>¿Estás seguro de que deseas cancelar tu cita para el <strong>{citaActiva?.fechaSeleccionada.toLocaleDateString()}</strong> a las <strong>{citaActiva?.horaSeleccionada}</strong>?</p>
            ) : (
              <>
                <p><strong>Sede:</strong> {sede === 'cpp' ? 'Sede Concepción' : sede === 'spp' ? 'Sede San Pedro de la Paz' : ''}</p>
                <p><strong>Fecha:</strong> {fechaSeleccionada.toLocaleDateString()}</p>
                <p><strong>Hora:</strong> {horaSeleccionada}</p>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button 
                onClick={() => setMostrarModal(false)} 
                style={{ flex: 1, padding: '10px', background: 'transparent', color: 'white', border: '1px solid #6c757d', borderRadius: '6px', cursor: 'pointer' }}
              >
                {accionActual === 'cancelar' ? 'Volver' : 'Cancelar'}
              </button>
              <button 
                onClick={confirmarCita} 
                style={{ flex: 1, padding: '10px', background: accionActual === 'cancelar' ? '#dc3545' : '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {accionActual === 'cancelar' ? 'Sí, Cancelar' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarioCitas;