import express from 'express';
import { inicializarEsquemaFichaMedica } from './models/FichaMedica.js';

const app = express();
const PORT = 3000;

// Middleware para entender JSON en el body de las peticiones
app.use(express.json());

// 1. Inicializar la base de datos y sus tablas
console.log('Inicializando esquemas de base de datos...');
inicializarEsquemaFichaMedica();

// 2. Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});