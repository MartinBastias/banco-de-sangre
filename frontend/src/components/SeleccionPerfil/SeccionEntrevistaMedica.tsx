import { ESTADOS_CLINICOS } from '@/lib/constantes';
import type { UnidadTiempoEstimado } from './useRegistroDonante';

export interface PropsSeccionEntrevistaMedica {
  estadoClinico: string;
  setEstadoClinico: (valor: string) => void;
  tiempoCantidad: string;
  setTiempoCantidad: (valor: string) => void;
  tiempoUnidad: UnidadTiempoEstimado;
  setTiempoUnidad: (valor: UnidadTiempoEstimado) => void;
  fechaElegibilidad: string;
  setFechaElegibilidad: (valor: string) => void;
  observaciones: string;
  setObservaciones: (valor: string) => void;
  enviando: boolean;
}

export function SeccionEntrevistaMedica({
  estadoClinico,
  setEstadoClinico,
  tiempoCantidad,
  setTiempoCantidad,
  tiempoUnidad,
  setTiempoUnidad,
  fechaElegibilidad,
  setFechaElegibilidad,
  observaciones,
  setObservaciones,
  enviando,
}: PropsSeccionEntrevistaMedica) {
  return (
    <>
      <h3 className="seccion-formulario__titulo">
        Entrevista médica y elegibilidad
      </h3>

      <div className="campo-formulario">
        <label htmlFor="estado-clinico" className="campo-formulario__etiqueta">
          Estado de elegibilidad
        </label>
        <select
          id="estado-clinico"
          value={estadoClinico}
          onChange={(e) => setEstadoClinico(e.target.value)}
          className="entrada-texto"
          disabled={enviando}
        >
          {ESTADOS_CLINICOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </div>

      {estadoClinico === 'Excluyente' && (
        <p className="alerta-error" role="status">
          Estado Excluyente: el donante quedará inhabilitado de forma
          permanente para donar y no podrá agendar citas.
        </p>
      )}

      {estadoClinico === 'Diferido temporalmente' && (
        <div className="rejilla-campos">
          <div className="campo-formulario">
            <label
              htmlFor="tiempo-estimado"
              className="campo-formulario__etiqueta"
            >
              Tiempo estimado (requerido si no pones fecha)
            </label>
            <div className="fila-busqueda-rut">
              <input
                id="tiempo-estimado"
                type="number"
                min={1}
                max={3650}
                value={tiempoCantidad}
                onChange={(e) => {
                  setTiempoCantidad(e.target.value);
                  if (e.target.value) setFechaElegibilidad('');
                }}
                placeholder="Ej: 15"
                className="entrada-texto"
                disabled={enviando}
              />
              <select
                aria-label="Unidad de tiempo estimado"
                value={tiempoUnidad}
                onChange={(e) =>
                  setTiempoUnidad(e.target.value as UnidadTiempoEstimado)
                }
                className="entrada-texto"
                disabled={enviando}
              >
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
                <option value="anios">Años</option>
              </select>
            </div>
          </div>

          <div className="campo-formulario">
            <label
              htmlFor="fecha-elegibilidad"
              className="campo-formulario__etiqueta"
            >
              O fecha estimada
            </label>
            <input
              id="fecha-elegibilidad"
              type="date"
              value={fechaElegibilidad}
              onChange={(e) => {
                setFechaElegibilidad(e.target.value);
                if (e.target.value) setTiempoCantidad('');
              }}
              className="entrada-texto"
              disabled={enviando}
            />
          </div>
        </div>
      )}

      <div className="campo-formulario">
        <label htmlFor="observaciones" className="campo-formulario__etiqueta">
          Observaciones de la entrevista médica
        </label>
        <textarea
          id="observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Antecedentes médicos, medicamentos, motivo de diferimiento o notas relevantes..."
          maxLength={1000}
          className="entrada-texto area-texto"
          disabled={enviando}
        />
      </div>
    </>
  );
}
