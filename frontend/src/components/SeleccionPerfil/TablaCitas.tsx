'use client';

import { useEffect, useState } from 'react';
import './SeleccionPerfil.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

const obtenerNombreSede = (codigo: string): string => {
  if (codigo === 'cpp') return 'Sede Concepción';
  if (codigo === 'spp') return 'Sede San Pedro de la Paz';
  return codigo;
};

/**
 * Pantalla para consultar la tabla de citas agendadas actualmente.
 */
export function TablaCitas({ alVolver }: PropsTablaCitas) {
  const [citas, setCitas] = useState<CitaListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const consultarCitas = async () => {
    const respuesta = await fetch(`${API_URL}/api/citas`);
    const datos = (await respuesta.json()) as {
      citas?: CitaListado[];
      error?: string;
    };

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudo cargar la base de datos de citas.');
    }

    return datos.citas ?? [];
  };

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const lista = await consultarCitas();
        if (!cancelado) {
          setCitas(lista);
          setError(null);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error al consultar la base de datos de citas.',
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  const manejarActualizar = async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await consultarCitas();
      setCitas(lista);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al consultar la base de datos de citas.',
      );
    } finally {
      setCargando(false);
    }
  };

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
            onClick={manejarActualizar}
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
                    <td>{obtenerNombreSede(cita.sede)}</td>
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
