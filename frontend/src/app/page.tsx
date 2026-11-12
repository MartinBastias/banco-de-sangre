'use client';

import { useState } from 'react';
import { CalendarioCitas } from '@/components/CalendarioCitas/CalendarioCitas';
import { EstadoElegibilidad } from '@/components/EstadoElegibilidad/EstadoElegibilidad';
import type { InformacionElegibilidad } from '@/components/EstadoElegibilidad/estadoElegibilidad.utils';
import { IngresoDonante } from '@/components/SeleccionPerfil/IngresoDonante';
import { RegistroDonante } from '@/components/SeleccionPerfil/RegistroDonante';
import { SeleccionPerfil } from '@/components/SeleccionPerfil/SeleccionPerfil';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type VistaActual =
  | 'seleccion-perfil'
  | 'enfermero'
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

  const manejarAlternarElegibilidad = async () => {
    if (mostrarElegibilidad) {
      setMostrarElegibilidad(false);
      return;
    }

    setMostrarElegibilidad(true);
    if (!elegibilidad && !cargando) {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await fetch(`${API_URL}/api/donantes/verificar-elegibilidad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sexo: 'M',
            estadoMedico: 'Apto',
            ultimaDonacion: '2026-06-01',
          }),
        });

        if (!respuesta.ok) {
          throw new Error('No se pudo verificar la elegibilidad');
        }

        const datos = (await respuesta.json()) as InformacionElegibilidad;
        setElegibilidad(datos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al consultar perfil');
      } finally {
        setCargando(false);
      }
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
            setVista('enfermero');
          }}
          alSeleccionarDonante={() => {
            setMensajeAviso(null);
            setVista('identificacion-donante');
          }}
        />
      </main>
    );
  }

  if (vista === 'enfermero') {
    return (
      <main>
        <header>
          <h1 style={{ textAlign: 'center' }}>Portal de Enfermero</h1>
        </header>
        <RegistroDonante alVolver={() => volverASeleccionPerfil()} />
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
          }}
          alNoRegistrado={(mensaje) => volverASeleccionPerfil(mensaje)}
          alVolver={() => volverASeleccionPerfil()}
        />
      </main>
    );
  }

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
      </header>

      <section style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
        {mostrarElegibilidad && (
          <div>
            {cargando && <p style={{ textAlign: 'center' }}>Consultando perfil de elegibilidad...</p>}
            {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
            {elegibilidad && <EstadoElegibilidad elegibilidad={elegibilidad} />}
          </div>
        )}
      </section>

      <section>
        <CalendarioCitas rut={rutDonante} />
      </section>
    </main>
  );
}
