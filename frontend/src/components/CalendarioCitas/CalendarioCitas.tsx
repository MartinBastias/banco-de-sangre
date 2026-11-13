'use client';

import Calendar from 'react-calendar';
import { Toaster } from 'react-hot-toast';
import { SEDES } from '@/lib/constantes';
import type { CitaActiva } from './calendarioCitas.utils';
import { ModalConfirmacionCita } from './ModalConfirmacionCita';
import { TarjetaCitaActiva } from './TarjetaCitaActiva';
import { useCalendarioCitas } from './useCalendarioCitas';
import 'react-calendar/dist/Calendar.css';
import './CalendarioCitas.css';

export interface PropsCalendarioCitas {
  citaInicial?: CitaActiva | null;
  rut?: string;
  fechaMinima?: string | null;
}

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
    manejarCambioDeSede,
    horaSeleccionada,
    setHoraSeleccionada,
    mostrarModal,
    setMostrarModal,
    accionActual,
    setAccionActual,
    citaActiva,
    fechaMinimaPermitida,
    avanzadaPorDisponibilidad,
    horariosDisponibles,
    esHoraBloqueada,
    obtenerMotivoBloqueoHora,
    esDiaDeshabilitado,
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
          <TarjetaCitaActiva
            citaActiva={citaActiva}
            alCancelar={() => abrirModal('cancelar')}
            alReagendar={manejarReagendamiento}
          />
        ) : (
          <>
            <div className="campo-sede">
              <label htmlFor="sede">Selecciona una sede:</label>
              <select
                id="sede"
                value={sede}
                onChange={(e) => manejarCambioDeSede(e.target.value)}
                className="select-sede"
              >
                <option value="">-- Elige una sede --</option>
                {SEDES.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            {fechaMinima && (
              <p className="aviso-sin-horarios" role="status">
                Tienes un diferimiento temporal vigente. Solo puedes agendar
                citas desde el{' '}
                {fechaMinimaPermitida.toLocaleDateString('es-CL')}.
              </p>
            )}

            {!fechaMinima && avanzadaPorDisponibilidad && (
              <p className="aviso-sin-horarios" role="status">
                No quedan horarios disponibles en tu fecha base. Próxima fecha
                disponible: {fechaMinimaPermitida.toLocaleDateString('es-CL')}.
              </p>
            )}

            <p className="texto-dia">Selecciona un día:</p>
            <Calendar
              onChange={manejarCambioDeFecha}
              value={fechaSeleccionada}
              minDate={fechaMinimaPermitida}
              tileDisabled={({ date, view }) => esDiaDeshabilitado(date, view)}
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
                        title={
                          bloqueado
                            ? obtenerMotivoBloqueoHora(hora)
                            : undefined
                        }
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
        <ModalConfirmacionCita
          accionActual={accionActual}
          citaActiva={citaActiva}
          sede={sede}
          fechaSeleccionada={fechaSeleccionada}
          horaSeleccionada={horaSeleccionada}
          alCerrar={() => setMostrarModal(false)}
          alConfirmar={confirmarCita}
        />
      )}
    </>
  );
}

export default CalendarioCitas;
