import db from './src/config/db.js';

db.serialize(() => {
  db.run("DELETE FROM citas", (err) => {
    if (err) console.error("Error al borrar citas:", err.message);
    else console.log("¡Todas las citas han sido eliminadas!");
  });
  
  db.run("DELETE FROM sqlite_sequence WHERE name='citas'", (err) => {
    if (err) console.error("Error al reiniciar autoincrement:", err.message);
    else console.log("¡El ID autoincremental se ha reiniciado a 1!");
  });
});