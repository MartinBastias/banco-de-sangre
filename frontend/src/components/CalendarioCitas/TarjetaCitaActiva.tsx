import { obtenerNombreSede } from '@/lib/constantes';
import type { CitaActiva } from './calendarioCitas.utils';

export interface PropsTarjetaCitaActiva {
  citaActiva: CitaActiva;
  alCancelar: () => void;
  alReagendar: () => void;
}

export function TarjetaCitaActiva({
  citaActiva,
  alCancelar,
  alReagendar,
}: PropsTarjetaCitaActiva) {
  return (
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
          onClick={alCancelar}
          className="boton boton--flex-1 boton--peligro-borde"
        >
          Cancelar Cita
        </button>
        <button
          type="button"
          onClick={alReagendar}
          className="boton boton--flex-1 boton--advertencia"
        >
          Reagendar
        </button>
      </div>
    </div>
  );
}
