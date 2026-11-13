import { obtenerNombreSede } from '@/lib/constantes';
import type { CitaActiva, TipoAccionCita } from './calendarioCitas.utils';

export interface PropsModalConfirmacionCita {
  accionActual: TipoAccionCita;
  citaActiva: CitaActiva | null;
  sede: string;
  fechaSeleccionada: Date;
  horaSeleccionada: string;
  alCerrar: () => void;
  alConfirmar: () => void;
}

export function ModalConfirmacionCita({
  accionActual,
  citaActiva,
  sede,
  fechaSeleccionada,
  horaSeleccionada,
  alCerrar,
  alConfirmar,
}: PropsModalConfirmacionCita) {
  return (
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
            onClick={alCerrar}
            className="boton boton--flex-1 boton--neutro-borde"
          >
            {accionActual === 'cancelar' ? 'Volver' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            className={`boton boton--flex-1 ${
              accionActual === 'cancelar'
                ? 'boton--peligro-solido'
                : 'boton--primario'
            }`}
          >
            {accionActual === 'cancelar' ? 'Sí, Cancelar' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
