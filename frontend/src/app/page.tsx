'use client';

import { useCallback, useState } from 'react';
import { CalendarioCitas } from '@/components/CalendarioCitas/CalendarioCitas';
import { EstadoElegibilidad } from '@/components/EstadoElegibilidad/EstadoElegibilidad';
import {
  type InformacionElegibilidad,
  normalizarEstadoElegibilidad,
} from '@/components/EstadoElegibilidad/estadoElegibilidad.utils';
import { IngresoDonante } from '@/components/SeleccionPerfil/IngresoDonante';
import { MenuEnfermero } from '@/components/SeleccionPerfil/MenuEnfermero';
import { RegistroDonante } from '@/components/SeleccionPerfil/RegistroDonante';
import { SeleccionPerfil } from '@/components/SeleccionPerfil/SeleccionPerfil';
import { TablaCitas } from '@/components/SeleccionPerfil/TablaCitas';
import { TablaDonantes } from '@/components/SeleccionPerfil/TablaDonantes';
import { API_URL } from '@/lib/constantes';

type VistaActual =
  | 'seleccion-perfil'
  | 'enfermero-menu'
  | 'enfermero-ficha'
  | 'enfermero-donantes'
  | 'enfermero-citas'
  | 'identificacion-donante'
  | 'agendar-cita';

export default function PaginaInicio() {
  const [vista, setVista] = useState<VistaActual>('seleccion-perfil');
  const [rutDonante, setRutDonante] = useState<string>('');
  const [mensajeAviso, setMensajeAviso] = useState<string | null>(null);

  const [mostrarElegibilidad, setMostrarElegibilidad] = useState(false);
  const [elegibilidad, setElegibilidad] = useState<InformacionElegibilidad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const volverASeleccionPerfil = (aviso: string | null = null) => {
    setVista('seleccion-perfil');
    setRutDonante('');
    setMensajeAviso(aviso);
    setMostrarElegibilidad(false);
    setElegibilidad(null);
    setError(null);
  };

  const cargarElegibilidad = useCallback(async (rut: string) => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch(
        `${API_URL}/api/ficha-medica/${encodeURIComponent(rut)}`,
      );

      if (!respuesta.ok) {
        throw new Error('No se pudo verificar la elegibilidad');
      }

      const datos = (await respuesta.json()) as {
        ficha?: {
          estadoClinico?: string | null;
          fechaElegibilidad?: string | null;
          observaciones?: string | null;
        } | null;
      };

      if (datos.ficha) {
        setElegibilidad({
          estadoClinico: datos.ficha.estadoClinico ?? null,
          fechaElegibilidad: datos.ficha.fechaElegibilidad ?? null,
          observaciones: datos.ficha.observaciones ?? null,
        });
      } else {
        setElegibilidad({
          estadoClinico: null,
          fechaElegibilidad: null,
          observaciones:
            'Aún no se registra tu ficha médica. Un enfermero debe completar tu evaluación.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar perfil');
    } finally {
      setCargando(false);
    }
  }, []);

  const manejarAlternarElegibilidad = async () => {
    if (mostrarElegibilidad) {
      setMostrarElegibilidad(false);
      return;
    }

    setMostrarElegibilidad(true);
    if (!elegibilidad && !cargando && rutDonante) {
      await cargarElegibilidad(rutDonante);
    }
  };

  if (vista === 'seleccion-perfil') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Banco de Sangre</h1>
        </header>
        <SeleccionPerfil
          mensajeAviso={mensajeAviso}
          alSeleccionarEnfermero={() => {
            setMensajeAviso(null);
            setVista('enfermero-menu');
          }}
          alSeleccionarDonante={() => {
            setMensajeAviso(null);
            setVista('identificacion-donante');
          }}
        />
      </main>
    );
  }

  if (vista === 'enfermero-menu') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Enfermero</h1>
        </header>
        <MenuEnfermero
          alIrAFichaMedica={() => setVista('enfermero-ficha')}
          alIrADonantes={() => setVista('enfermero-donantes')}
          alIrACitas={() => setVista('enfermero-citas')}
          alVolver={() => volverASeleccionPerfil()}
        />
      </main>
    );
  }

  if (vista === 'enfermero-ficha') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Enfermero</h1>
        </header>
        <RegistroDonante alVolver={() => setVista('enfermero-menu')} />
      </main>
    );
  }

  if (vista === 'enfermero-donantes') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Enfermero</h1>
        </header>
        <TablaDonantes alVolver={() => setVista('enfermero-menu')} />
      </main>
    );
  }

  if (vista === 'enfermero-citas') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Enfermero</h1>
        </header>
        <TablaCitas alVolver={() => setVista('enfermero-menu')} />
      </main>
    );
  }

  if (vista === 'identificacion-donante') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Donante</h1>
        </header>
        <IngresoDonante
          alVerificarExitoso={(rut) => {
            setMensajeAviso(null);
            setRutDonante(rut);
            setVista('agendar-cita');
            void cargarElegibilidad(rut);
          }}
          alNoRegistrado={(mensaje) => volverASeleccionPerfil(mensaje)}
          alVolver={() => volverASeleccionPerfil()}
        />
      </main>
    );
  }

  const estadoNormalizado = normalizarEstadoElegibilidad(
    elegibilidad?.estadoClinico,
  );
  const esExcluyente = estadoNormalizado === 'excluyente';
  const esDiferido = estadoNormalizado === 'diferido_temporalmente';
  const fechaCruda = elegibilidad?.fechaElegibilidad;
  const fechaMinimaDiferido =
    esDiferido && fechaCruda
      ? typeof fechaCruda === 'string'
        ? fechaCruda
        : fechaCruda.toISOString().split('T')[0]
      : null;

  return (
    <main>
      <header>
        <h1 style={{ textAlign: 'center' }}>Agenda tu cita con nosotros</h1>
        <div className="barra-superior">
          <span>Donante: {rutDonante}</span>
          <button
            type="button"
            onClick={() => volverASeleccionPerfil()}
            className="boton boton--neutro-borde"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Cambiar perfil
          </button>
        </div>
        {!esExcluyente && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={manejarAlternarElegibilidad}
              className="boton boton--neutro-borde"
              style={{ fontWeight: 600, padding: '10px 18px', fontSize: '15px' }}
            >
              {mostrarElegibilidad ? 'Ocultar perfil de elegibilidad' : 'Ver perfil de elegibilidad'}
            </button>
          </div>
        )}
      </header>

      <section style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
        {(mostrarElegibilidad || esExcluyente) && (
          <div>
            {cargando && <p style={{ textAlign: 'center' }}>Consultando perfil de elegibilidad...</p>}
            {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
            {elegibilidad && <EstadoElegibilidad elegibilidad={elegibilidad} />}
          </div>
        )}
      </section>

      <section>
        {esExcluyente ? (
          <div
            className="alerta-error"
            role="alert"
            style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}
          >
            No es posible agendar citas porque tu estado clínico es{' '}
            <strong>Excluyente</strong>. No puedes donar sangre de forma
            permanente.
          </div>
        ) : (
          <CalendarioCitas rut={rutDonante} fechaMinima={fechaMinimaDiferido} />
        )}
      </section>
    </main>
  );
}
