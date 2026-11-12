'use client';

import { useEffect, useState } from 'react';
import './SeleccionPerfil.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

/**
 * Pantalla para consultar la tabla de donantes registrados y su estado clínico.
 */
export function TablaDonantes({ alVolver }: PropsTablaDonantes) {
  const [donantes, setDonantes] = useState<DonanteListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const consultarDonantes = async () => {
    const respuesta = await fetch(`${API_URL}/api/donantes`);
    const datos = (await respuesta.json()) as {
      donantes?: DonanteListado[];
      error?: string;
    };

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudo cargar la base de datos de donantes.');
    }

    return datos.donantes ?? [];
  };

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const lista = await consultarDonantes();
        if (!cancelado) {
          setDonantes(lista);
          setError(null);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error al consultar la base de datos de donantes.',
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
      const lista = await consultarDonantes();
      setDonantes(lista);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al consultar la base de datos de donantes.',
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
              Base de datos de donantes
            </h2>
            <p className="tarjeta-formulario__descripcion">
              Donantes registrados en el sistema y su estado clínico actual.
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
