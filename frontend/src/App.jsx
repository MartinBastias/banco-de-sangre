import CalendarioCitas from './components/CalendarioCitas';
import './App.css';

/**
 * Componente principal de la aplicación.
 * Actúa como contenedor base y futuro gestor de rutas para las diferentes vistas del sistema.
 * 
 * @component
 * @returns {JSX.Element} Contenedor raíz de la aplicación.
 */
function App() {
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

export default App;