'use client';

import { API_URL } from '@/lib/constantes';
import { useConsultaLista } from '@/lib/useConsultaLista';
import './SeleccionPerfil.css';

export interface DonanteListado {
  rut: string;
  estadoClinico: string | null;
}

export interface PropsTablaDonantes {
  alVolver: () => void;
}

const obtenerClaseEstado = (estado: string | null): string => {
  if (estado === 'Apto') return 'insignia-estado insignia-estado--apto';
  if (estado === 'Diferido temporalmente') {
    return 'insignia-estado insignia-estado--diferido';
  }
  if (estado === 'Excluyente') {
    return 'insignia-estado insignia-estado--excluyente';
  }
  return 'insignia-estado insignia-estado--pendiente';
};

async function consultarDonantes(): Promise<DonanteListado[]> {
  const respuesta = await fetch(`${API_URL}/api/donantes`);
  const datos = (await respuesta.json()) as {
    donantes?: DonanteListado[];
    error?: string;
  };

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'No se pudo cargar la base de datos de donantes.',
    );
  }

  return datos.donantes ?? [];
}

/**
 * Pantalla para consultar la tabla de donantes registrados y su estado clínico.
 */
export function TablaDonantes({ alVolver }: PropsTablaDonantes) {
  const {
    items: donantes,
    cargando,
    error,
    actualizar,
  } = useConsultaLista<DonanteListado>(
    consultarDonantes,
    'Error al consultar la base de datos de donantes.',
  );

  return (
    <section className="seleccion-perfil seleccion-perfil--tabla">
      <div className="tarjeta-formulario tarjeta-formulario--tabla">
        <div className="encabezado-tabla">
          <div>
            <h2 className="tarjeta-formulario__titulo">
              Base de datos de donantes
            </h2>
            <p className="tarjeta-formulario__descripcion">
              Donantes registrados en el sistema y su estado clínico actual.
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
          <p className="texto-ayuda">Cargando donantes...</p>
        )}

        {!error && !cargando && donantes.length === 0 && (
          <p className="alerta-info">No hay donantes registrados todavía.</p>
        )}

        {!error && !cargando && donantes.length > 0 && (
          <div className="contenedor-tabla">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {donantes.map((donante) => (
                  <tr key={donante.rut}>
                    <td>{donante.rut}</td>
                    <td>
                      <span className={obtenerClaseEstado(donante.estadoClinico)}>
                        {donante.estadoClinico ?? 'Sin ficha médica'}
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
