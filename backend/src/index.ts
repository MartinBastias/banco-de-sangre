import cors from 'cors';
import express from 'express';
import rutasCitas from './features/citas/citas.routes.ts';
import rutasDonantes from './features/donantes/donantes.routes.ts';
import rutasElegibilidad from './features/elegibilidad/elegibilidad.routes.ts';
import rutasFichaMedica from './features/ficha-medica/ficha-medica.routes.ts';
import { initializeDatabaseSchema, pool } from './lib/db/index.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', rutasCitas);
app.use('/api', rutasDonantes);
app.use('/api', rutasFichaMedica);
app.use('/api/donantes', rutasElegibilidad);

export const startServer = async () => {
  try {
    console.log('Inicializando esquemas de base de datos PostgreSQL...');
    await initializeDatabaseSchema();

    const port = Number(process.env.PORT || 3000);
    return app.listen(port, () => {
      console.log(`Servidor backend corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el backend:', error);
    await pool.end();
    process.exitCode = 1;
    return null;
  }
};

if (process.env.NODE_ENV !== 'test') {
  void startServer();
}

export default app;
