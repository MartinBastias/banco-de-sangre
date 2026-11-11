import Calendar from 'react-calendar';
import { Toaster } from 'react-hot-toast';
import { useCalendarioCitas } from './useCalendarioCitas';
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
  const {
    fechaSeleccionada,
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
  } = useCalendarioCitas();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--text-h)',
            border: '1px solid var(--border)'
          }
        }}
      />
      
      <div className="agenda">
        
        {citaActiva && accionActual !== 'editar' ? (
          <div className="cita-activa">
            <h3>Tu Cita Activa</h3>
            <p><strong>Sede:</strong> {citaActiva.sede === 'cpp' ? 'Sede Concepción' : citaActiva.sede === 'spp' ? 'Sede San Pedro de la Paz' : ''}</p>
            <p><strong>Fecha:</strong> {citaActiva.fechaSeleccionada.toLocaleDateString('es-CL')}</p>
            <p><strong>Hora:</strong> {citaActiva.horaSeleccionada}</p>
            
            <div className="acciones">
              <button 
                onClick={() => abrirModal('cancelar')} 
                className="btn btn--flex-1 btn--danger-outline"
              >
                Cancelar Cita
              </button>
              <button 
                onClick={manejarReagendamiento}
                className="btn btn--flex-1 btn--warning"
              >
                Reagendar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="campo-sede">
              <label htmlFor="sede">Selecciona una sede:</label>
              <select 
                id="sede"
                value={sede} 
                onChange={(e) => setSede(e.target.value)}
                className="select-sede"
              >
                <option value="">-- Elige una sede --</option>
                <option value="cpp">Sede Concepción</option>
                <option value="spp">Sede San Pedro de la Paz</option>
              </select>
            </div>

            <p className="texto-dia">Selecciona un día:</p>
            <Calendar 
              onChange={manejarCambioDeFecha} 
              value={fechaSeleccionada} 
              minDate={new Date()}
            />
            
            <div className="horarios-titulo">
              <p>Horarios para el {fechaSeleccionada.toLocaleDateString('es-CL')}:</p>
              {horariosDisponibles.every((hora) => esHoraBloqueada(hora)) ? (
                <p className="aviso-sin-horarios">
                  No quedan horarios disponibles para este día. Por favor, selecciona otra fecha.
                </p>
              ) : (
                <div className="horarios">
                  {horariosDisponibles.map((hora) => {
                    const bloqueada = esHoraBloqueada(hora);
                    const seleccionada = !bloqueada && horaSeleccionada === hora;

                    return (
                      <button 
                        key={hora}
                        onClick={() => setHoraSeleccionada(hora)}
                        disabled={bloqueada}
                        title={bloqueada ? 'Este horario ya pasó' : undefined}
                        className={`horario${seleccionada ? ' horario--seleccionado' : ''}`}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {sede && horaSeleccionada && (
              <div className="acciones acciones--finales">
                {accionActual === 'editar' && (
                  <button 
                    className="btn btn--flex-1 btn--neutral-outline"
                    onClick={() => { setAccionActual('crear'); setSede(''); setHoraSeleccionada(''); }}
                  >
                    Volver
                  </button>
                )}
                <button 
                  className="btn btn--flex-2 btn--success"
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
              <p>¿Estás seguro de que deseas cancelar tu cita para el <strong>{citaActiva?.fechaSeleccionada.toLocaleDateString('es-CL')}</strong> a las <strong>{citaActiva?.horaSeleccionada}</strong>?</p>
            ) : (
              <>
                <p><strong>Sede:</strong> {sede === 'cpp' ? 'Sede Concepción' : sede === 'spp' ? 'Sede San Pedro de la Paz' : ''}</p>
                <p><strong>Fecha:</strong> {fechaSeleccionada.toLocaleDateString('es-CL')}</p>
                <p><strong>Hora:</strong> {horaSeleccionada}</p>
              </>
            )}
            
            <div className="acciones acciones--modal">
              <button 
                onClick={() => setMostrarModal(false)} 
                className="btn btn--flex-1 btn--neutral-outline"
              >
                {accionActual === 'cancelar' ? 'Volver' : 'Cancelar'}
              </button>
              <button 
                onClick={confirmarCita} 
                className={`btn btn--flex-1 ${accionActual === 'cancelar' ? 'btn--danger-solid' : 'btn--primary'}`}
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
