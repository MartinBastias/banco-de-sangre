'use client';

import Calendar from 'react-calendar';
import { Toaster } from 'react-hot-toast';
import {
  type CitaActiva,
  useCalendarioCitas,
} from './useCalendarioCitas';
import 'react-calendar/dist/Calendar.css';
import './CalendarioCitas.css';

export interface PropsCalendarioCitas {
  citaInicial?: CitaActiva | null;
  rut?: string;
  fechaMinima?: string | null;
}

const obtenerNombreSede = (codigo: string): string => {
  if (codigo === 'cpp') return 'Sede Concepción';
  if (codigo === 'spp') return 'Sede San Pedro de la Paz';
  return '';
};

/**
 * Componente interactivo para agendar, reagendar y cancelar citas de donación.
 */
export function CalendarioCitas({
  citaInicial = null,
  rut,
  fechaMinima = null,
}: PropsCalendarioCitas) {
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
    fechaMinimaPermitida,
    horariosDisponibles,
    esHoraBloqueada,
    manejarCambioDeFecha,
    manejarReagendamiento,
    confirmarCita,
    abrirModal,
  } = useCalendarioCitas(citaInicial, rut, fechaMinima);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--text-h)',
            border: '1px solid var(--border)',
          },
        }}
      />

      <div className="calendario-citas agenda">
        {citaActiva && accionActual !== 'editar' ? (
          <div className="cita-activa">
            <h3>Tu Cita Activa</h3>
            <p>
              <strong>Sede:</strong> {obtenerNombreSede(citaActiva.sede)}
            </p>
            <p>
              <strong>Fecha:</strong>{' '}
              {citaActiva.fechaSeleccionada.toLocaleDateString('es-CL')}
            </p>
            <p>
              <strong>Hora:</strong> {citaActiva.horaSeleccionada}
            </p>

            <div className="acciones">
              <button
                type="button"
                onClick={() => abrirModal('cancelar')}
                className="boton boton--flex-1 boton--peligro-borde"
              >
                Cancelar Cita
              </button>
              <button
                type="button"
                onClick={manejarReagendamiento}
                className="boton boton--flex-1 boton--advertencia"
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

            {fechaMinima && (
              <p className="aviso-sin-horarios" role="status">
                Tienes un diferimiento temporal vigente. Solo puedes agendar
                citas desde el{' '}
                {fechaMinimaPermitida.toLocaleDateString('es-CL')}.
              </p>
            )}

            <p className="texto-dia">Selecciona un día:</p>
            <Calendar
              onChange={manejarCambioDeFecha}
              value={fechaSeleccionada}
              minDate={fechaMinimaPermitida}
            />

            <div className="horarios-titulo">
              <p>
                Horarios para el {fechaSeleccionada.toLocaleDateString('es-CL')}:
              </p>
              {horariosDisponibles.every((hora) => esHoraBloqueada(hora)) ? (
                <p className="aviso-sin-horarios">
                  No quedan horarios disponibles para este día. Por favor,
                  selecciona otra fecha.
                </p>
              ) : (
                <div className="horarios">
                  {horariosDisponibles.map((hora) => {
                    const bloqueado = esHoraBloqueada(hora);
                    const seleccionado = !bloqueado && horaSeleccionada === hora;

                    return (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => setHoraSeleccionada(hora)}
                        disabled={bloqueado}
                        title={bloqueado ? 'Este horario ya pasó' : undefined}
                        className={`horario${seleccionado ? ' horario--seleccionado' : ''}`}
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
                    type="button"
                    className="boton boton--flex-1 boton--neutro-borde"
                    onClick={() => {
                      setAccionActual('crear');
                      setSede('');
                      setHoraSeleccionada('');
                    }}
                  >
                    Volver
                  </button>
                )}
                <button
                  type="button"
                  className="boton boton--flex-2 boton--exito"
                  onClick={() => abrirModal(accionActual)}
                >
                  {accionActual === 'editar'
                    ? 'Confirmar Reagendamiento'
                    : 'Agendar Cita'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-superposicion">
          <div className="modal-contenido">
            <h3>
              {accionActual === 'cancelar'
                ? 'Cancelar Cita'
                : 'Resumen de tu Cita'}
            </h3>

            {accionActual === 'cancelar' ? (
              <p>
                ¿Estás seguro de que deseas cancelar tu cita para el{' '}
                <strong>
                  {(citaActiva?.fechaSeleccionada || new Date()).toLocaleDateString(
                    'es-CL',
                  )}
                </strong>{' '}
                a las <strong>{citaActiva?.horaSeleccionada}</strong>?
              </p>
            ) : (
              <>
                <p>
                  <strong>Sede:</strong> {obtenerNombreSede(sede)}
                </p>
                <p>
                  <strong>Fecha:</strong>{' '}
                  {fechaSeleccionada.toLocaleDateString('es-CL')}
                </p>
                <p>
                  <strong>Hora:</strong> {horaSeleccionada}
                </p>
              </>
            )}

            <div className="acciones acciones--modal">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="boton boton--flex-1 boton--neutro-borde"
              >
                {accionActual === 'cancelar' ? 'Volver' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={confirmarCita}
                className={`boton boton--flex-1 ${
                  accionActual === 'cancelar'
                    ? 'boton--peligro-solido'
                    : 'boton--primario'
                }`}
              >
                {accionActual === 'cancelar'
                  ? 'Sí, Cancelar'
                  : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarioCitas;
