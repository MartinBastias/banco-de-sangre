'use client';

import { TIPOS_SANGRE } from '@/lib/constantes';
import { SeccionEntrevistaMedica } from './SeccionEntrevistaMedica';
import { useRegistroDonante } from './useRegistroDonante';
import './SeleccionPerfil.css';

export interface PropsRegistroDonante {
  alVolver: () => void;
}

/**
 * Formulario de enfermero para registrar o actualizar un donante,
 * sus datos clínicos y los resultados de su entrevista médica.
 */
export function RegistroDonante({ alVolver }: PropsRegistroDonante) {
  const {
    rut,
    buscando,
    donanteExistente,
    tipoSangreBloqueado,
    mensajeEstadoBusqueda,
    peso,
    setPeso,
    tipoSangre,
    setTipoSangre,
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
    error,
    mensajeExito,
    manejarCambioRut,
    manejarBuscarDonante,
    manejarGuardar,
  } = useRegistroDonante();

  return (
    <section className="seleccion-perfil seleccion-perfil--amplia">
      <div className="tarjeta-formulario tarjeta-formulario--amplia">
        <h2 className="tarjeta-formulario__titulo">
          Registro y Evaluación Médica del Donante
        </h2>
        <p className="tarjeta-formulario__descripcion">
          Ingresa el RUT del donante para registrarlo o actualizar sus datos
          clínicos y resultado de entrevista médica.
        </p>

        <form onSubmit={manejarGuardar}>
          <div className="campo-formulario">
            <label htmlFor="rut-registro" className="campo-formulario__etiqueta">
              RUT del donante
            </label>
            <div className="fila-busqueda-rut">
              <input
                id="rut-registro"
                type="text"
                value={rut}
                onChange={(e) => manejarCambioRut(e.target.value)}
                placeholder="Ej: 12.345.678-5"
                className="entrada-texto"
                disabled={enviando || buscando}
              />
              <button
                type="button"
                onClick={manejarBuscarDonante}
                disabled={enviando || buscando || !rut.trim()}
                className="boton boton--neutro-borde"
              >
                {buscando ? 'Buscando...' : 'Buscar RUT'}
              </button>
            </div>
            <span className="texto-ayuda">
              Si la persona ya está registrada, busca su RUT para precargar sus
              datos y actualizar solo lo necesario.
            </span>
          </div>

          {mensajeEstadoBusqueda && (
            <div className="alerta-info" role="status">
              {mensajeEstadoBusqueda}
            </div>
          )}

          <h3 className="seccion-formulario__titulo">Datos clínicos</h3>
          <div className="rejilla-campos">
            <div className="campo-formulario">
              <label htmlFor="peso-donante" className="campo-formulario__etiqueta">
                Peso (kg)
              </label>
              <input
                id="peso-donante"
                type="number"
                step="0.1"
                min={20}
                max={300}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ej: 70.5"
                className="entrada-texto"
                disabled={enviando}
              />
            </div>

            <div className="campo-formulario">
              <label htmlFor="tipo-sangre" className="campo-formulario__etiqueta">
                Tipo de sangre
              </label>
              <select
                id="tipo-sangre"
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
                className="entrada-texto"
                disabled={enviando || tipoSangreBloqueado}
              >
                <option value="">-- Seleccionar --</option>
                {TIPOS_SANGRE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {tipoSangreBloqueado && (
                <span className="texto-ayuda">
                  Tipo de sangre ya registrado (no modificable).
                </span>
              )}
            </div>
          </div>

          <SeccionEntrevistaMedica
            estadoClinico={estadoClinico}
            setEstadoClinico={setEstadoClinico}
            tiempoCantidad={tiempoCantidad}
            setTiempoCantidad={setTiempoCantidad}
            tiempoUnidad={tiempoUnidad}
            setTiempoUnidad={setTiempoUnidad}
            fechaElegibilidad={fechaElegibilidad}
            setFechaElegibilidad={setFechaElegibilidad}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            enviando={enviando}
          />

          {error && (
            <div className="alerta-aviso" role="alert">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="alerta-exito" role="status">
              {mensajeExito}
            </div>
          )}

          <div className="acciones-formulario">
            <button
              type="submit"
              disabled={enviando || buscando}
              className="boton boton--primario"
            >
              {enviando
                ? 'Guardando...'
                : donanteExistente
                  ? 'Actualizar Ficha Médica'
                  : 'Registrar Donante y Ficha'}
            </button>
            <button
              type="button"
              onClick={alVolver}
              className="boton boton--neutro-borde"
              disabled={enviando}
            >
              Volver a selección de perfil
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
