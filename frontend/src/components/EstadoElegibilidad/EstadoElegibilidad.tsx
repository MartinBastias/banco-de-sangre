import './EstadoElegibilidad.css';
import {
  type InformacionElegibilidad,
  normalizarEstadoElegibilidad,
} from './estadoElegibilidad.utils';

const MAPA_ESTADOS: Record<string, { etiqueta: string; clase: string }> = {
  apto: { etiqueta: 'Apto', clase: 'apto' },
  diferido_temporalmente: {
    etiqueta: 'Diferido temporalmente',
    clase: 'diferido',
  },
  excluyente: { etiqueta: 'Excluyente', clase: 'excluyente' },
};

const formatearFechaElegibilidad = (fecha?: string | Date | null): string => {
  if (!fecha) return 'No informada';

  const fechaParseada =
    fecha instanceof Date
      ? fecha
      : /^\d{4}-\d{2}-\d{2}$/.test(fecha)
        ? new Date(`${fecha}T00:00:00`)
        : new Date(fecha);

  if (Number.isNaN(fechaParseada.getTime())) return 'No informada';

  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fechaParseada);
};

export interface PropsEstadoElegibilidad {
  elegibilidad?: InformacionElegibilidad | null;
}

export function EstadoElegibilidad({
  elegibilidad,
}: PropsEstadoElegibilidad) {
  const estadoNormalizado = normalizarEstadoElegibilidad(
    elegibilidad?.estadoClinico,
  );
  const configuracionEstado = MAPA_ESTADOS[estadoNormalizado] ?? {
    etiqueta: 'Pendiente de validación',
    clase: 'pendiente',
  };
  const esApto = estadoNormalizado === 'apto';
  const esExcluyente = estadoNormalizado === 'excluyente';
  const esDiferido = estadoNormalizado === 'diferido_temporalmente';

  let mensaje =
    elegibilidad?.observaciones ||
    (estadoNormalizado
      ? 'No es posible agendar mientras tu estado no sea Apto.'
      : 'El agendamiento se habilitará cuando se confirme tu elegibilidad.');

  if (esApto) {
    mensaje = 'Puedes continuar con el agendamiento.';
  } else if (esExcluyente) {
    mensaje =
      elegibilidad?.observaciones ||
      'Tu estado clínico es Excluyente. No puedes donar ni agendar citas de forma permanente.';
  } else if (esDiferido) {
    mensaje =
      elegibilidad?.observaciones ||
      (elegibilidad?.fechaElegibilidad
        ? `Te encuentras diferido temporalmente. Solo puedes agendar citas desde el ${elegibilidad.fechaElegibilidad}.`
        : 'Te encuentras diferido temporalmente.');
  }

  return (
    <section
      className={`tarjeta-elegibilidad tarjeta-elegibilidad--${configuracionEstado.clase}`}
      aria-live="polite"
      aria-labelledby="titulo-elegibilidad"
    >
      <div className="tarjeta-elegibilidad__encabezado">
        <div>
          <p className="tarjeta-elegibilidad__antetitulo">Tu perfil de donante</p>
          <h2 id="titulo-elegibilidad" className="tarjeta-elegibilidad__titulo">
            Estado de elegibilidad
          </h2>
        </div>
        <span className="tarjeta-elegibilidad__estado">
          {configuracionEstado.etiqueta}
        </span>
      </div>

      <div className="tarjeta-elegibilidad__fecha">
        <span className="tarjeta-elegibilidad__etiqueta-fecha">
          Fecha de elegibilidad
        </span>
        <strong>
          {formatearFechaElegibilidad(elegibilidad?.fechaElegibilidad)}
        </strong>
      </div>

      <p className="tarjeta-elegibilidad__mensaje">{mensaje}</p>
    </section>
  );
}

export default EstadoElegibilidad;
