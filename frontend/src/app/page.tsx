'use client';

import { CalendarioCitas } from '@/components/CalendarioCitas/CalendarioCitas';

export default function PaginaInicio() {
  return (
    <main>
      <header>
        <h1 style={{ textAlign: 'center' }}>Agenda tu cita con nosotros</h1>
      </header>

      <section>
        <CalendarioCitas />
      </section>
    </main>
  );
}
