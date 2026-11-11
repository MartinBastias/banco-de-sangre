import sqlite3 from 'sqlite3';
import path from 'path';

// Crea o se conecta a un archivo físico llamado 'banco_sangre.sqlite'
const dbPath = path.resolve(process.cwd(), 'banco_sangre.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

export default db;