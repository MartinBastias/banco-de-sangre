'use client';

import { useState } from 'react';
import { CalendarioCitas } from '@/components/CalendarioCitas/CalendarioCitas';
import { EstadoElegibilidad } from '@/components/EstadoElegibilidad/EstadoElegibilidad';
import type { InformacionElegibilidad } from '@/components/EstadoElegibilidad/estadoElegibilidad.utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PaginaInicio() {
  const [mostrarElegibilidad, setMostrarElegibilidad] = useState(false);
  const [elegibilidad, setElegibilidad] = useState<InformacionElegibilidad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main>
      <header>
        <h1 style={{ textAlign: 'center' }}>Agenda tu cita con nosotros</h1>
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
        <CalendarioCitas />
      </section>
    </main>
  );
}
