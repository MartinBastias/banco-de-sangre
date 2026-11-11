import express from 'express';
import { inicializarEsquemaFichaMedica } from './models/FichaMedica.js';
import { inicializarEsquemaCitas } from './models/Cita.js';
import cors from 'cors';
import citasRoutes from './routes/citas.routes.js';

const app = express();
const PORT = 3000;


app.use(cors());


// Middleware para entender JSON en el body de las peticiones
app.use(express.json());

// 1. Inicializar la base de datos y sus tablas
console.log('Inicializando esquemas de base de datos...');
inicializarEsquemaFichaMedica();
inicializarEsquemaCitas();

// 3. Rutas de la API
app.use('/api', citasRoutes);

// 2. Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

export default app;