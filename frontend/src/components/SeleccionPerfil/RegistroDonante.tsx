'use client';

import { useState } from 'react';
import './SeleccionPerfil.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PropsRegistroDonante {
  alVolver: () => void;
}

/**
 * Formulario básico para que un enfermero registre un donante mediante su RUT.
 */
export function RegistroDonante({ alVolver }: PropsRegistroDonante) {
  const [rut, setRut] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    if (!rut.trim()) {
      setError('Debes ingresar el RUT del donante.');
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/donantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut }),
      });

      const datos = (await respuesta.json()) as {
        error?: string;
        mensaje?: string;
        donante?: { rut: string };
      };

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo registrar al donante.');
      }

      setMensajeExito(
        `Donante con RUT ${datos.donante?.rut ?? rut.trim()} registrado correctamente.`,
      );
      setRut('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al registrar donante.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="seleccion-perfil">
      <div className="tarjeta-formulario">
        <h2 className="tarjeta-formulario__titulo">Registro de Donante</h2>
        <p className="tarjeta-formulario__descripcion">
          Ingresa el RUT del donante para habilitarlo en el sistema.
        </p>

        <form onSubmit={manejarRegistro}>
          <div className="campo-formulario">
            <label htmlFor="rut-registro" className="campo-formulario__etiqueta">
              RUT del donante
            </label>
            <input
              id="rut-registro"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="Ej: 12345678-9"
              className="entrada-texto"
              disabled={enviando}
            />
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
              disabled={enviando}
              className="boton boton--primario"
            >
              {enviando ? 'Registrando...' : 'Registrar Donante'}
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

