import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Banco de Sangre',
  description: 'Agenda tu cita de donación de sangre.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="contenedor-principal">{children}</div>
      </body>
    </html>
  );
}
