'use client';

import { useState } from 'react';
import './SeleccionPerfil.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PropsIngresoDonante {
  alVerificarExitoso: (rut: string) => void;
  alNoRegistrado: (mensaje: string) => void;
  alVolver: () => void;
}

/**
 * Formulario para que un donante ingrese su RUT y verifique si está registrado.
 */
export function IngresoDonante({
  alVerificarExitoso,
  alNoRegistrado,
  alVolver,
}: PropsIngresoDonante) {
  const [rut, setRut] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarVerificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rutLimpio = rut.trim();
    if (!rutLimpio) {
      setError('Debes ingresar tu RUT para continuar.');
      return;
    }

    setVerificando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/donantes/${encodeURIComponent(rutLimpio)}`,
      );

      if (respuesta.status === 404) {
        alNoRegistrado(
          'No te encuentras registrado en la base de datos. Un enfermero debe registrarte antes de agendar una cita.',
        );
        return;
      }

      const datos = (await respuesta.json()) as {
        registrado?: boolean;
        donante?: { rut: string };
        error?: string;
      };

      if (!respuesta.ok) {
        throw new Error(datos.error || 'Error al verificar tu RUT.');
      }

      if (datos.registrado && datos.donante?.rut) {
        alVerificarExitoso(datos.donante.rut);
      } else {
        alNoRegistrado(
          'No te encuentras registrado en la base de datos. Un enfermero debe registrarte antes de agendar una cita.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al consultar el sistema.',
      );
    } finally {
      setVerificando(false);
    }
  };

  return (
    <section className="seleccion-perfil">
      <div className="tarjeta-formulario">
        <h2 className="tarjeta-formulario__titulo">Ingreso de Donante</h2>
        <p className="tarjeta-formulario__descripcion">
          Ingresa tu RUT para verificar tu registro y agendar tu cita.
        </p>

        <form onSubmit={manejarVerificacion}>
          <div className="campo-formulario">
            <label htmlFor="rut-donante" className="campo-formulario__etiqueta">
              Tu RUT
            </label>
            <input
              id="rut-donante"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="Ej: 12345678-9"
              className="entrada-texto"
              disabled={verificando}
            />
          </div>

          {error && (
            <div className="alerta-aviso" role="alert">
              {error}
            </div>
          )}

          <div className="acciones-formulario">
            <button
              type="submit"
              disabled={verificando}
              className="boton boton--primario"
            >
              {verificando ? 'Verificando...' : 'Continuar'}
            </button>
            <button
              type="button"
              onClick={alVolver}
              className="boton boton--neutro-borde"
              disabled={verificando}
            >
              Volver a selección de perfil
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

