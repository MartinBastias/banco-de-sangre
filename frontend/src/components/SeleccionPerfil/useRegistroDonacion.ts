'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/constantes';
import { useConsultaLista } from '@/lib/useConsultaLista';
import {
  type DonacionRegistrada,
  type DonanteParaDonacion,
  validarFormularioDonacion,
} from './registroDonacion.utils';

async function consultarDonantesParaDonacion(): Promise<
  DonanteParaDonacion[]
> {
  const respuesta = await fetch(`${API_URL}/api/donantes`);
  const datos = (await respuesta.json()) as {
    donantes?: DonanteParaDonacion[];
    error?: string;
  };

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'No se pudo cargar la lista de donantes registrados.',
    );
  }

  return datos.donantes ?? [];
}

async function consultarDonaciones(): Promise<DonacionRegistrada[]> {
  const respuesta = await fetch(`${API_URL}/api/donaciones`);
  const datos = (await respuesta.json()) as {
    donaciones?: DonacionRegistrada[];
    error?: string;
  };

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'No se pudo cargar el historial de donaciones.',
    );
  }

  return datos.donaciones ?? [];
}

/**
 * Hook para gestionar el formulario de registro de extracción/donación de sangre,
 * su modal de confirmación previa y el historial reciente de donaciones.
 */
export function useRegistroDonacion() {
  const {
    items: donantes,
    cargando: cargandoDonantes,
    error: errorDonantes,
    actualizar: recargarDonantes,
  } = useConsultaLista<DonanteParaDonacion>(
    consultarDonantesParaDonacion,
    'Error al consultar la lista de donantes.',
  );

  const {
    items: donaciones,
    cargando: cargandoDonaciones,
    error: errorDonaciones,
    actualizar: recargarDonaciones,
  } = useConsultaLista<DonacionRegistrada>(
    consultarDonaciones,
    'Error al consultar el historial de donaciones.',
  );

  const [rutSeleccionado, setRutSeleccionado] = useState('');
  const [mlExtraidos, setMlExtraidos] = useState('');

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const donanteSeleccionado =
    donantes.find((item) => item.rut === rutSeleccionado) ?? null;
  const tipoSangreFicha = donanteSeleccionado?.tipoSangre?.trim() || null;

  const manejarSeleccionDonante = (rut: string) => {
    setRutSeleccionado(rut);
    setError(null);
    setMensajeExito(null);
  };

  const manejarSolicitarConfirmacion = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    const errorValidacion = validarFormularioDonacion({
      rut: rutSeleccionado,
      tipoSangreFicha,
      mlExtraidos,
    });

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setMostrarConfirmacion(true);
  };

  const manejarConfirmarGuardado = async () => {
    setError(null);
    setEnviando(true);

    const cantidadMl = Number(mlExtraidos);

    try {
      const respuesta = await fetch(`${API_URL}/api/donaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: rutSeleccionado,
          mlExtraidos: cantidadMl,
        }),
      });

      const datos = (await respuesta.json()) as {
        mensaje?: string;
        citaCompletada?: boolean;
        donacion?: DonacionRegistrada;
        error?: string;
      };

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo registrar la donación.');
      }

      const guardada = datos.donacion;
      const bolsaGuardada = guardada?.idBolsa ? `ID Bolsa asignado: ${guardada.idBolsa}, ` : '';
      const tipoGuardado = guardada?.tipoSangre ?? tipoSangreFicha ?? '';
      const mlGuardados = guardada?.mlExtraidos ?? cantidadMl;
      const avisoCita = datos.citaCompletada
        ? ' La cita agendada del donante fue marcada como completada.'
        : '';

      setMostrarConfirmacion(false);
      setMensajeExito(
        `${datos.mensaje || 'Donación registrada con éxito.'} (${bolsaGuardada}Tipo: ${tipoGuardado}, Volumen: ${mlGuardados} ml).${avisoCita}`,
      );

      setRutSeleccionado('');
      setMlExtraidos('');

      await recargarDonaciones();
    } catch (err) {
      setMostrarConfirmacion(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al registrar la donación de sangre.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return {
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
  };
}
