'use client';

import { formatearRut } from '@/lib/rut';

export interface PropsModalConfirmacionDonacion {
  rut: string;
  tipoSangre: string;
  mlExtraidos: number | string;
  enviando: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
}

/**
 * Modal de confirmación previa al guardado definitivo de una extracción de sangre.
 */
export function ModalConfirmacionDonacion({
  rut,
  tipoSangre,
  mlExtraidos,
  enviando,
  alCerrar,
  alConfirmar,
}: PropsModalConfirmacionDonacion) {
  const rutLegible = formatearRut(rut) || rut;

  return (
    <div className="modal-superposicion">
      <div
        className="modal-contenido"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-donacion"
      >
        <h3 id="titulo-modal-donacion">Confirmar registro de extracción</h3>
        <p>
          ¿Estás seguro de que deseas registrar esta donación de sangre en el
          historial del donante y en el inventario?
        </p>

        <div className="modal-resumen">
          <p>
            <strong>RUT del donante:</strong> {rutLegible}
          </p>
          <p>
            <strong>Tipo de sangre (ficha médica):</strong> {tipoSangre}
          </p>
          <p>
            <strong>Cantidad extraída:</strong> {mlExtraidos} ml
          </p>
          <p>
            <strong>ID de la bolsa:</strong> Generación automática al confirmar
          </p>
        </div>

        <div className="acciones acciones--modal">
          <button
            type="button"
            onClick={alCerrar}
            className="boton boton--flex-1 boton--neutro-borde"
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={alConfirmar}
            className="boton boton--flex-1 boton--primario"
            disabled={enviando}
          >
            {enviando ? 'Guardando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
