'use client';

import './SeleccionPerfil.css';

export interface PropsMenuEnfermero {
  alIrAFichaMedica: () => void;
  alIrADonantes: () => void;
  alIrARegistrarDonacion: () => void;
  alIrACitas: () => void;
  alVolver: () => void;
}

/**
 * Menú principal del perfil de enfermero con acceso a las 4 vistas operativas.
 */
export function MenuEnfermero({
  alIrAFichaMedica,
  alIrADonantes,
  alIrARegistrarDonacion,
  alIrACitas,
  alVolver,
}: PropsMenuEnfermero) {
  return (
    <section className="seleccion-perfil">
      <p className="seleccion-perfil__subtitulo">
        Selecciona una opción para gestionar el banco de sangre:
      </p>

      <div className="seleccion-perfil__opciones">
        <button
          type="button"
          onClick={alIrAFichaMedica}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">
            Registrar / Actualizar ficha médica
          </span>
          <span className="seleccion-perfil__opcion-descripcion">
            Ingresar un donante nuevo o actualizar signos vitales, entrevista y
            estado clínico.
          </span>
        </button>

        <button
          type="button"
          onClick={alIrADonantes}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">
            Base de datos de donantes
          </span>
          <span className="seleccion-perfil__opcion-descripcion">
            Ver la tabla de donantes registrados junto con su estado clínico.
          </span>
        </button>

        <button
          type="button"
          onClick={alIrARegistrarDonacion}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">
            Registrar extracción de sangre
          </span>
          <span className="seleccion-perfil__opcion-descripcion">
            Ingresar una donación exitosa seleccionando un donante registrado y
            los ml extraídos (el tipo de sangre proviene de su ficha médica y el
            ID de bolsa se genera automáticamente).
          </span>
        </button>

        <button
          type="button"
          onClick={alIrACitas}
          className="seleccion-perfil__opcion"
        >
          <span className="seleccion-perfil__opcion-titulo">
            Base de datos de citas actuales
          </span>
          <span className="seleccion-perfil__opcion-descripcion">
            Ver la tabla de citas agendadas actualmente en el sistema.
          </span>
        </button>
      </div>

      <div className="acciones-formulario" style={{ marginTop: '20px' }}>
        <button
          type="button"
          onClick={alVolver}
          className="boton boton--flex-1 boton--neutro-borde"
        >
          Volver a selección de perfil
        </button>
      </div>
    </section>
  );
}
