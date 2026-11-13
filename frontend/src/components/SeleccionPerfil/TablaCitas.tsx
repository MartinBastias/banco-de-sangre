'use client';

import { API_URL, obtenerNombreSede } from '@/lib/constantes';
import { useConsultaLista } from '@/lib/useConsultaLista';
import './SeleccionPerfil.css';

export interface CitaListado {
  id: number;
  rut: string;
  sede: string;
  fecha: string;
  hora: string;
  estado: string;
}

export interface PropsTablaCitas {
  alVolver: () => void;
}

async function consultarCitas(): Promise<CitaListado[]> {
  const respuesta = await fetch(`${API_URL}/api/citas`);
  const datos = (await respuesta.json()) as {
    citas?: CitaListado[];
    error?: string;
  };

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'No se pudo cargar la base de datos de citas.',
    );
  }

  return datos.citas ?? [];
}

/**
 * Pantalla para consultar la tabla de citas agendadas actualmente.
 */
export function TablaCitas({ alVolver }: PropsTablaCitas) {
  const {
    items: citas,
    cargando,
    error,
    actualizar,
  } = useConsultaLista<CitaListado>(
    consultarCitas,
    'Error al consultar la base de datos de citas.',
  );

  return (
    <section className="seleccion-perfil seleccion-perfil--tabla">
      <div className="tarjeta-formulario tarjeta-formulario--tabla">
        <div className="encabezado-tabla">
          <div>
            <h2 className="tarjeta-formulario__titulo">
              Base de datos de citas actuales
            </h2>
            <p className="tarjeta-formulario__descripcion">
              Citas agendadas vigentes en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void actualizar()}
            className="boton boton--neutro-borde"
            disabled={cargando}
          >
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {error && (
          <p className="alerta-error" role="alert">
            {error}
          </p>
        )}

        {!error && cargando && (
          <p className="texto-ayuda">Cargando citas actuales...</p>
        )}

        {!error && !cargando && citas.length === 0 && (
          <p className="alerta-info">No hay citas agendadas actualmente.</p>
        )}

        {!error && !cargando && citas.length > 0 && (
          <div className="contenedor-tabla">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Sede</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id}>
                    <td>{cita.rut}</td>
                    <td>{obtenerNombreSede(cita.sede, cita.sede)}</td>
                    <td>{cita.fecha}</td>
                    <td>{cita.hora}</td>
                    <td>
                      <span className="insignia-estado insignia-estado--apto">
                        {cita.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="acciones-formulario">
          <button
            type="button"
            onClick={alVolver}
            className="boton boton--flex-1 boton--neutro-borde"
          >
            Volver al menú de enfermero
          </button>
        </div>
      </div>
    </section>
  );
}
