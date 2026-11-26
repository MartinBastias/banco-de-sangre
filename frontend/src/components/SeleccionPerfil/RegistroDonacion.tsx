'use client';

import { formatearRut } from '@/lib/rut';
import { ModalConfirmacionDonacion } from './ModalConfirmacionDonacion';
import {
  ML_MAXIMO_DONACION,
  ML_MINIMO_DONACION,
  formatearOpcionDonante,
} from './registroDonacion.utils';
import { useRegistroDonacion } from './useRegistroDonacion';
import './SeleccionPerfil.css';

export interface PropsRegistroDonacion {
  alVolver: () => void;
}

function formatearFechaDonacion(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return fechaIso;
  }
  return fecha.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Pantalla del perfil de enfermero para registrar una extracción/donación de sangre exitosa
 * con confirmación previa y consulta del historial reciente.
 */
export function RegistroDonacion({ alVolver }: PropsRegistroDonacion) {
  const {
    donantes,
    cargandoDonantes,
    errorDonantes,
    recargarDonantes,
    donaciones,
    cargandoDonaciones,
    errorDonaciones,
    recargarDonaciones,
    rutSeleccionado,
    tipoSangreFicha,
    mlExtraidos,
    setMlExtraidos,
    mostrarConfirmacion,
    setMostrarConfirmacion,
    enviando,
    error,
    mensajeExito,
    manejarSeleccionDonante,
    manejarSolicitarConfirmacion,
    manejarConfirmarGuardado,
  } = useRegistroDonacion();

  return (
    <section className="seleccion-perfil seleccion-perfil--amplia">
      <div className="tarjeta-formulario tarjeta-formulario--amplia">
        <h2 className="tarjeta-formulario__titulo">
          Registrar extracción de sangre
        </h2>
        <p className="tarjeta-formulario__descripcion">
          Ingresa los datos de una donación exitosa para registrarla en el
          historial del donante y actualizar el inventario.
        </p>

        <form onSubmit={manejarSolicitarConfirmacion}>
          <div className="campo-formulario">
            <label
              htmlFor="donante-extraccion"
              className="campo-formulario__etiqueta"
            >
              Donante registrado (RUT)
            </label>
            <div className="fila-busqueda-rut">
              <select
                id="donante-extraccion"
                value={rutSeleccionado}
                onChange={(e) => manejarSeleccionDonante(e.target.value)}
                className="entrada-texto"
                disabled={enviando || cargandoDonantes}
              >
                <option value="">-- Seleccionar donante --</option>
                {donantes.map((donante) => (
                  <option key={donante.rut} value={donante.rut}>
                    {formatearOpcionDonante(donante)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void recargarDonantes()}
                className="boton boton--neutro-borde"
                disabled={enviando || cargandoDonantes}
              >
                {cargandoDonantes ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
          </div>

          {errorDonantes && (
            <div className="alerta-aviso" role="alert">
              {errorDonantes}
            </div>
          )}

          {!cargandoDonantes && !errorDonantes && donantes.length === 0 && (
            <div className="alerta-info" role="status">
              Aún no hay donantes registrados en el sistema. Registra primero un
              donante desde la ficha médica.
            </div>
          )}

          {rutSeleccionado && tipoSangreFicha && (
            <div className="alerta-info" role="status">
              Tipo de sangre (ficha médica): <strong>{tipoSangreFicha}</strong>
            </div>
          )}

          {rutSeleccionado && !tipoSangreFicha && (
            <div className="alerta-aviso" role="alert">
              Este donante no tiene tipo de sangre registrado en su ficha
              médica. Completa su ficha médica antes de registrar una
              extracción.
            </div>
          )}

          <div className="campo-formulario">
            <label
              htmlFor="ml-extraidos"
              className="campo-formulario__etiqueta"
            >
              Cantidad extraída (ml)
            </label>
            <input
              id="ml-extraidos"
              type="number"
              min={ML_MINIMO_DONACION}
              max={ML_MAXIMO_DONACION}
              step={1}
              value={mlExtraidos}
              onChange={(e) => setMlExtraidos(e.target.value)}
              placeholder="Ej: 450"
              className="entrada-texto"
              disabled={enviando}
            />
            <span className="texto-ayuda">
              El ID de la bolsa se generará automáticamente al confirmar el
              registro.
            </span>
          </div>

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
              disabled={
                enviando ||
                cargandoDonantes ||
                Boolean(rutSeleccionado && !tipoSangreFicha)
              }
              className="boton boton--primario"
            >
              Registrar extracción
            </button>
            <button
              type="button"
              onClick={alVolver}
              className="boton boton--neutro-borde"
              disabled={enviando}
            >
              Volver al menú de enfermero
            </button>
          </div>
        </form>

        <div className="seccion-formulario__titulo encabezado-tabla">
          <span>Historial reciente de donaciones</span>
          <button
            type="button"
            onClick={() => void recargarDonaciones()}
            className="boton boton--neutro-borde"
            disabled={cargandoDonaciones || enviando}
            style={{ fontSize: '13px', padding: '6px 10px' }}
          >
            {cargandoDonaciones ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {errorDonaciones && (
          <div className="alerta-aviso" role="alert">
            {errorDonaciones}
          </div>
        )}

        {!errorDonaciones && cargandoDonaciones && (
          <p className="texto-ayuda">Cargando historial de donaciones...</p>
        )}

        {!errorDonaciones &&
          !cargandoDonaciones &&
          donaciones.length === 0 && (
            <p className="alerta-info">
              Aún no se han registrado extracciones de sangre.
            </p>
          )}

        {!errorDonaciones && !cargandoDonaciones && donaciones.length > 0 && (
          <div className="contenedor-tabla">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>ID Bolsa</th>
                  <th>RUT</th>
                  <th>Tipo</th>
                  <th>Volumen (ml)</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {donaciones.map((donacion) => (
                  <tr key={donacion.id}>
                    <td>{donacion.idBolsa}</td>
                    <td>{formatearRut(donacion.rut) || donacion.rut}</td>
                    <td>{donacion.tipoSangre}</td>
                    <td>{donacion.mlExtraidos} ml</td>
                    <td>{formatearFechaDonacion(donacion.fechaDonacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarConfirmacion && (
        <ModalConfirmacionDonacion
          rut={rutSeleccionado}
          tipoSangre={tipoSangreFicha ?? ''}
          mlExtraidos={mlExtraidos}
          enviando={enviando}
          alCerrar={() => setMostrarConfirmacion(false)}
          alConfirmar={() => void manejarConfirmarGuardado()}
        />
      )}
    </section>
  );
}
