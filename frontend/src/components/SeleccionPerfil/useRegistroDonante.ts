'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/constantes';
import { esRutValido, formatearRut } from '@/lib/rut';

export type UnidadTiempoEstimado = 'dias' | 'meses' | 'anios';

export interface FichaMedicaRespuesta {
  rut: string;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
}

/**
 * Hook para la lógica de búsqueda, validación y guardado de ficha médica del donante.
 */
export function useRegistroDonante() {
  const [rut, setRut] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [donanteExistente, setDonanteExistente] = useState(false);
  const [tipoSangreBloqueado, setTipoSangreBloqueado] = useState(false);
  const [mensajeEstadoBusqueda, setMensajeEstadoBusqueda] = useState<
    string | null
  >(null);

  const [peso, setPeso] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');
  const [estadoClinico, setEstadoClinico] = useState<string>('Apto');
  const [tiempoCantidad, setTiempoCantidad] = useState('');
  const [tiempoUnidad, setTiempoUnidad] =
    useState<UnidadTiempoEstimado>('dias');
  const [fechaElegibilidad, setFechaElegibilidad] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const limpiarCamposFicha = () => {
    setPeso('');
    setTipoSangre('');
    setEstadoClinico('Apto');
    setTiempoCantidad('');
    setTiempoUnidad('dias');
    setFechaElegibilidad('');
    setObservaciones('');
    setDonanteExistente(false);
    setTipoSangreBloqueado(false);
  };

  const manejarCambioRut = (nuevoRut: string) => {
    setRut(formatearRut(nuevoRut));
    setMensajeEstadoBusqueda(null);
    if (donanteExistente || tipoSangreBloqueado) {
      limpiarCamposFicha();
    }
  };

  const manejarBuscarDonante = async () => {
    setError(null);
    setMensajeExito(null);
    setMensajeEstadoBusqueda(null);

    const rutLimpio = rut.trim();
    if (!esRutValido(rutLimpio)) {
      setError('Ingresa un RUT válido antes de buscar (ej: 12.345.678-5).');
      return;
    }

    setBuscando(true);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/ficha-medica/${encodeURIComponent(rutLimpio)}`,
      );

      if (respuesta.status === 404) {
        limpiarCamposFicha();
        setMensajeEstadoBusqueda(
          'Donante nuevo: completa todos los campos para registrarlo en el sistema.',
        );
        return;
      }

      const datos = (await respuesta.json()) as {
        registrado?: boolean;
        ficha?: FichaMedicaRespuesta | null;
        error?: string;
      };

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo consultar el RUT.');
      }

      setDonanteExistente(true);

      if (datos.ficha) {
        const ficha = datos.ficha;
        setPeso(ficha.peso !== null ? String(ficha.peso) : '');
        setTipoSangre(ficha.tipoSangre ?? '');
        setTipoSangreBloqueado(Boolean(ficha.tipoSangre));
        setEstadoClinico(ficha.estadoClinico ?? 'Apto');
        setFechaElegibilidad(ficha.fechaElegibilidad ?? '');
        setTiempoCantidad('');
        setObservaciones(ficha.observaciones ?? '');
        setMensajeEstadoBusqueda(
          'Donante ya registrado: actualiza solo los campos que cambian. El tipo de sangre se mantiene sin cambios.',
        );
      } else {
        setTipoSangreBloqueado(false);
        setMensajeEstadoBusqueda(
          'Donante ya registrado sin ficha médica previa: completa sus datos clínicos y signos vitales.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al buscar donante.',
      );
    } finally {
      setBuscando(false);
    }
  };

  const validarFormulario = (): string | null => {
    if (!esRutValido(rut)) {
      return 'Debes ingresar un RUT válido (solo números y K opcional después del guion).';
    }

    const tieneFichaPrevia = donanteExistente && tipoSangreBloqueado;

    if (!tieneFichaPrevia || peso !== '') {
      const pesoNum = Number(peso);
      if (!Number.isFinite(pesoNum) || pesoNum < 20 || pesoNum > 300) {
        return 'El peso debe ser un número válido entre 20 y 300 kg.';
      }
    }

    if (!tipoSangreBloqueado && !tipoSangre) {
      return 'Debes seleccionar el tipo de sangre del donante.';
    }

    if (!estadoClinico) {
      return 'Debes seleccionar el estado de elegibilidad médica.';
    }

    if (estadoClinico === 'Diferido temporalmente') {
      const cantidad = Number(tiempoCantidad);
      if (!tiempoCantidad && !fechaElegibilidad) {
        return 'Para un diferimiento temporal debes ingresar el tiempo estimado o la fecha estimada.';
      }
      if (tiempoCantidad && (!Number.isInteger(cantidad) || cantidad <= 0)) {
        return 'El tiempo estimado debe ser un número entero mayor a 0.';
      }
    }

    return null;
  };

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    try {
      const cuerpo: Record<string, unknown> = {
        rut: rut.trim(),
        estadoClinico,
        observaciones: observaciones.trim() || null,
      };

      if (peso !== '') {
        cuerpo.peso = Number(peso);
      }
      if (!tipoSangreBloqueado && tipoSangre) {
        cuerpo.tipoSangre = tipoSangre;
      }

      if (estadoClinico === 'Diferido temporalmente') {
        if (tiempoCantidad) {
          cuerpo.tiempoEstimadoCantidad = Number(tiempoCantidad);
          cuerpo.tiempoEstimadoUnidad = tiempoUnidad;
        } else if (fechaElegibilidad) {
          cuerpo.fechaElegibilidad = fechaElegibilidad;
        }
      }

      const respuesta = await fetch(`${API_URL}/api/ficha-medica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });

      const datos = (await respuesta.json()) as {
        error?: string;
        mensaje?: string;
        actualizado?: boolean;
        ficha?: FichaMedicaRespuesta;
      };

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo guardar la ficha médica.');
      }

      const fichaGuardada = datos.ficha;
      const detalleFecha = fichaGuardada?.fechaElegibilidad
        ? ` Fecha elegibilidad: ${fichaGuardada.fechaElegibilidad}.`
        : '';

      setMensajeExito(
        `${datos.mensaje || 'Ficha guardada con éxito.'} (RUT: ${fichaGuardada?.rut ?? rut.trim()}, Estado: ${fichaGuardada?.estadoClinico ?? estadoClinico}.${detalleFecha})`,
      );

      if (fichaGuardada) {
        setDonanteExistente(true);
        setTipoSangre(fichaGuardada.tipoSangre ?? tipoSangre);
        setTipoSangreBloqueado(Boolean(fichaGuardada.tipoSangre));
        setFechaElegibilidad(fichaGuardada.fechaElegibilidad ?? '');
        setTiempoCantidad('');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar ficha médica.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return {
    rut,
    buscando,
    donanteExistente,
    tipoSangreBloqueado,
    mensajeEstadoBusqueda,
    peso,
    setPeso,
    tipoSangre,
    setTipoSangre,
    estadoClinico,
    setEstadoClinico,
    tiempoCantidad,
    setTiempoCantidad,
    tiempoUnidad,
    setTiempoUnidad,
    fechaElegibilidad,
    setFechaElegibilidad,
    observaciones,
    setObservaciones,
    enviando,
    error,
    mensajeExito,
    manejarCambioRut,
    manejarBuscarDonante,
    manejarGuardar,
  };
}
