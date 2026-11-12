'use client';

import { useState } from 'react';
import './SeleccionPerfil.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;
const ESTADOS_CLINICOS = [
  'Apto',
  'Diferido temporalmente',
  'Excluyente',
] as const;

interface FichaMedicaRespuesta {
  rut: string;
  presionArterial: string | null;
  frecuenciaCardiaca: number | null;
  peso: number | null;
  estadoClinico: string | null;
  tipoSangre: string | null;
  fechaElegibilidad: string | null;
  observaciones: string | null;
}

export interface PropsRegistroDonante {
  alVolver: () => void;
}

/**
 * Formulario de enfermero para registrar o actualizar un donante,
 * sus signos vitales y los datos de su entrevista médica.
 */
export function RegistroDonante({ alVolver }: PropsRegistroDonante) {
  const [rut, setRut] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [donanteExistente, setDonanteExistente] = useState(false);
  const [tipoSangreBloqueado, setTipoSangreBloqueado] = useState(false);
  const [mensajeEstadoBusqueda, setMensajeEstadoBusqueda] = useState<string | null>(
    null,
  );

  // Signos vitales
  const [presionArterial, setPresionArterial] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [peso, setPeso] = useState('');

  // Entrevista médica
  const [tipoSangre, setTipoSangre] = useState('');
  const [estadoClinico, setEstadoClinico] = useState<string>('Apto');
  const [tiempoCantidad, setTiempoCantidad] = useState('');
  const [tiempoUnidad, setTiempoUnidad] = useState<'dias' | 'meses' | 'anios'>(
    'dias',
  );
  const [fechaElegibilidad, setFechaElegibilidad] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const limpiarCamposFicha = () => {
    setPresionArterial('');
    setFrecuenciaCardiaca('');
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
    setRut(nuevoRut);
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
    if (!rutLimpio) {
      setError('Ingresa un RUT antes de buscar.');
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
        setPresionArterial(ficha.presionArterial ?? '');
        setFrecuenciaCardiaca(
          ficha.frecuenciaCardiaca !== null ? String(ficha.frecuenciaCardiaca) : '',
        );
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
    if (!rut.trim() || rut.trim().length < 3) {
      return 'Debes ingresar un RUT válido.';
    }

    const tieneFichaPrevia = donanteExistente && tipoSangreBloqueado;

    if (!tieneFichaPrevia || presionArterial.trim()) {
      const matchPresion = /^(\d{2,3})\/(\d{2,3})$/.exec(presionArterial.trim());
      if (!matchPresion) {
        return 'La presión arterial debe tener el formato sistólica/diastólica (ej: 120/80).';
      }
      const sistolica = Number(matchPresion[1]);
      const diastolica = Number(matchPresion[2]);
      if (
        sistolica < 50 ||
        sistolica > 250 ||
        diastolica < 30 ||
        diastolica > 160 ||
        sistolica <= diastolica
      ) {
        return 'Los valores de presión arterial están fuera del rango clínico válido.';
      }
    }

    if (!tieneFichaPrevia || frecuenciaCardiaca !== '') {
      const fc = Number(frecuenciaCardiaca);
      if (!Number.isInteger(fc) || fc < 30 || fc > 220) {
        return 'La frecuencia cardíaca debe ser un número entero entre 30 y 220 lpm.';
      }
    }

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

      if (presionArterial.trim()) {
        cuerpo.presionArterial = presionArterial.trim();
      }
      if (frecuenciaCardiaca !== '') {
        cuerpo.frecuenciaCardiaca = Number(frecuenciaCardiaca);
      }
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

  return (
    <section className="seleccion-perfil seleccion-perfil--amplia">
      <div className="tarjeta-formulario tarjeta-formulario--amplia">
        <h2 className="tarjeta-formulario__titulo">
          Registro y Evaluación Médica del Donante
        </h2>
        <p className="tarjeta-formulario__descripcion">
          Ingresa el RUT del donante para registrarlo o actualizar sus signos
          vitales y resultado de entrevista médica.
        </p>

        <form onSubmit={manejarGuardar}>
          <div className="campo-formulario">
            <label htmlFor="rut-registro" className="campo-formulario__etiqueta">
              RUT del donante
            </label>
            <div className="fila-busqueda-rut">
              <input
                id="rut-registro"
                type="text"
                value={rut}
                onChange={(e) => manejarCambioRut(e.target.value)}
                placeholder="Ej: 12345678-9"
                className="entrada-texto"
                disabled={enviando || buscando}
              />
              <button
                type="button"
                onClick={manejarBuscarDonante}
                disabled={enviando || buscando || !rut.trim()}
                className="boton boton--neutro-borde"
              >
                {buscando ? 'Buscando...' : 'Buscar RUT'}
              </button>
            </div>
            <span className="texto-ayuda">
              Si la persona ya está registrada, busca su RUT para precargar sus
              datos y actualizar solo lo necesario.
            </span>
          </div>

          {mensajeEstadoBusqueda && (
            <div className="alerta-info" role="status">
              {mensajeEstadoBusqueda}
            </div>
          )}

          <h3 className="seccion-formulario__titulo">Signos vitales</h3>
          <div className="rejilla-campos">
            <div className="campo-formulario">
              <label
                htmlFor="presion-arterial"
                className="campo-formulario__etiqueta"
              >
                Presión arterial (mmHg)
              </label>
              <input
                id="presion-arterial"
                type="text"
                value={presionArterial}
                onChange={(e) => setPresionArterial(e.target.value)}
                placeholder="Ej: 120/80"
                className="entrada-texto"
                disabled={enviando}
              />
            </div>

            <div className="campo-formulario">
              <label
                htmlFor="frecuencia-cardiaca"
                className="campo-formulario__etiqueta"
              >
                Frecuencia cardíaca (lpm)
              </label>
              <input
                id="frecuencia-cardiaca"
                type="number"
                min={30}
                max={220}
                value={frecuenciaCardiaca}
                onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                placeholder="Ej: 72"
                className="entrada-texto"
                disabled={enviando}
              />
            </div>

            <div className="campo-formulario">
              <label htmlFor="peso-donante" className="campo-formulario__etiqueta">
                Peso (kg)
              </label>
              <input
                id="peso-donante"
                type="number"
                step="0.1"
                min={20}
                max={300}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ej: 70.5"
                className="entrada-texto"
                disabled={enviando}
              />
            </div>

            <div className="campo-formulario">
              <label htmlFor="tipo-sangre" className="campo-formulario__etiqueta">
                Tipo de sangre
              </label>
              <select
                id="tipo-sangre"
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
                className="entrada-texto"
                disabled={enviando || tipoSangreBloqueado}
              >
                <option value="">-- Seleccionar --</option>
                {TIPOS_SANGRE.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {tipoSangreBloqueado && (
                <span className="texto-ayuda">
                  Tipo de sangre ya registrado (no modificable).
                </span>
              )}
            </div>
          </div>

          <h3 className="seccion-formulario__titulo">
            Entrevista médica y elegibilidad
          </h3>

          <div className="campo-formulario">
            <label htmlFor="estado-clinico" className="campo-formulario__etiqueta">
              Estado de elegibilidad
            </label>
            <select
              id="estado-clinico"
              value={estadoClinico}
              onChange={(e) => setEstadoClinico(e.target.value)}
              className="entrada-texto"
              disabled={enviando}
            >
              {ESTADOS_CLINICOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {estadoClinico === 'Excluyente' && (
            <p className="alerta-error" role="status">
              Estado Excluyente: el donante quedará inhabilitado de forma
              permanente para donar y no podrá agendar citas.
            </p>
          )}

          {estadoClinico === 'Diferido temporalmente' && (
            <div className="rejilla-campos">
              <div className="campo-formulario">
                <label
                  htmlFor="tiempo-estimado"
                  className="campo-formulario__etiqueta"
                >
                  Tiempo estimado (requerido si no pones fecha)
                </label>
                <div className="fila-busqueda-rut">
                  <input
                    id="tiempo-estimado"
                    type="number"
                    min={1}
                    max={3650}
                    value={tiempoCantidad}
                    onChange={(e) => {
                      setTiempoCantidad(e.target.value);
                      if (e.target.value) setFechaElegibilidad('');
                    }}
                    placeholder="Ej: 15"
                    className="entrada-texto"
                    disabled={enviando}
                  />
                  <select
                    aria-label="Unidad de tiempo estimado"
                    value={tiempoUnidad}
                    onChange={(e) =>
                      setTiempoUnidad(
                        e.target.value as 'dias' | 'meses' | 'anios',
                      )
                    }
                    className="entrada-texto"
                    disabled={enviando}
                  >
                    <option value="dias">Días</option>
                    <option value="meses">Meses</option>
                    <option value="anios">Años</option>
                  </select>
                </div>
              </div>

              <div className="campo-formulario">
                <label
                  htmlFor="fecha-elegibilidad"
                  className="campo-formulario__etiqueta"
                >
                  O fecha estimada
                </label>
                <input
                  id="fecha-elegibilidad"
                  type="date"
                  value={fechaElegibilidad}
                  onChange={(e) => {
                    setFechaElegibilidad(e.target.value);
                    if (e.target.value) setTiempoCantidad('');
                  }}
                  className="entrada-texto"
                  disabled={enviando}
                />
              </div>
            </div>
          )}

          <div className="campo-formulario">
            <label htmlFor="observaciones" className="campo-formulario__etiqueta">
              Observaciones de la entrevista médica
            </label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Antecedentes médicos, medicamentos, motivo de diferimiento o notas relevantes..."
              maxLength={1000}
              className="entrada-texto area-texto"
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
              disabled={enviando || buscando}
              className="boton boton--primario"
            >
              {enviando
                ? 'Guardando...'
                : donanteExistente
                  ? 'Actualizar Ficha Médica'
                  : 'Registrar Donante y Ficha'}
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
