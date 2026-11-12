'use client';

import './SeleccionPerfil.css';

export interface PropsSeleccionPerfil {
  alSeleccionarEnfermero: () => void;
  alSeleccionarDonante: () => void;
  mensajeAviso?: string | null;
}

/**
 * Pantalla inicial para seleccionar el perfil de acceso (Enfermero o Donante).
 */
export function SeleccionPerfil({
  alSeleccionarEnfermero,
  alSeleccionarDonante,
  mensajeAviso = null,
}: PropsSeleccionPerfil) {
  return (
    <section className="seleccion-perfil">
      <p className="seleccion-perfil__subtitulo">
        Selecciona tu perfil para continuar:
      </p>

      {mensajeAviso && (
        <div className="alerta-aviso" role="alert">
          {mensajeAviso}
        </div>
      )}

      <div className="seleccion-perfil__opciones">
        <button
          type="button"
          onClick={alSeleccionarEnfermero}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">Enfermero</span>
          <span className="seleccion-perfil__opcion-descripcion">
            Registrar un donante en el sistema mediante su RUT.
          </span>
        </button>

        <button
          type="button"
          onClick={alSeleccionarDonante}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">Donante</span>
          <span className="seleccion-perfil__opcion-descripcion">
            Ingresar con tu RUT para agendar o gestionar tu cita.
          </span>
        </button>
      </div>
    </section>
  );
}

