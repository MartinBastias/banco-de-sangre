import db from '../config/db.js';

export const inicializarEsquemaCitas = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rut TEXT NOT NULL,
      sede TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      estado TEXT DEFAULT 'agendada' CHECK(estado IN ('agendada', 'cancelada', 'realizada')),
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.exec(query, (err) => {
    if (err) {
      console.error('Error inicializando esquema citas:', err.message);
    }
  });
};

export const crearCitaEnBD = (rut, sede, fecha, hora) => {
  return new Promise((resolve, reject) => {
    // 1. Un donante solo puede tener una cita agendada a la vez.
    // Si ya existe una, debe reagendarla o cancelarla en lugar de crear otra.
    const checkRutQuery = `SELECT COUNT(*) as agendadas FROM citas WHERE rut = ? AND estado = 'agendada'`;

    db.get(checkRutQuery, [rut], (err, row) => {
      if (err) return reject(err);

      if (row.agendadas > 0) {
        return reject(new Error('El donante ya tiene una cita agendada. Debe reagendarla o cancelarla antes de crear una nueva.'));
      }

      // 2. Validación cruzada: Verificar si el horario ya está ocupado (RF-11)
      const checkQuery = `SELECT COUNT(*) as ocupados FROM citas WHERE sede = ? AND fecha = ? AND hora = ? AND estado = 'agendada'`;

      db.get(checkQuery, [sede, fecha, hora], (err, row) => {
        if (err) return reject(err);

        const CAPACIDAD_MAXIMA = 5; // Límite de donantes por bloque
        if (row.ocupados >= CAPACIDAD_MAXIMA) {
          return reject(new Error('El bloque horario ha superado su capacidad máxima.'));
        }

        // 3. Si hay capacidad, insertar la cita
        const insertQuery = `INSERT INTO citas (rut, sede, fecha, hora) VALUES (?, ?, ?, ?)`;

        db.run(insertQuery, [rut, sede, fecha, hora], function (err) {
          if (err) return reject(err);
          resolve({
            id: this.lastID,
            rut, sede, fecha, hora, estado: 'agendada'
          });
        });
      });
    });
  });
};
export const reagendarCitaEnBD = (id, sede, fecha, hora) => {
  return new Promise((resolve, reject) => {
    // 1. Validar capacidad del nuevo bloque
    const checkQuery = `SELECT COUNT(*) as ocupados FROM citas WHERE sede = ? AND fecha = ? AND hora = ? AND estado = 'agendada' AND id != ?`;
    
    db.get(checkQuery, [sede, fecha, hora, id], (err, row) => {
      if (err) return reject(err);
      
      const CAPACIDAD_MAXIMA = 5;
      if (row.ocupados >= CAPACIDAD_MAXIMA) {
        return reject(new Error('El nuevo bloque horario ha superado su capacidad máxima.'));
      }

      // 2. Actualizar únicamente la cita original si sigue agendada
      const updateQuery = `UPDATE citas SET sede = ?, fecha = ?, hora = ? WHERE id = ? AND estado = 'agendada'`;

      db.run(updateQuery, [sede, fecha, hora, id], function (err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error('No se encontró una cita agendada para reagendar.'));

        resolve({ id, sede, fecha, hora, estado: 'agendada' });
      });
    });
  });
};

export const cancelarCitaEnBD = (id) => {
  return new Promise((resolve, reject) => {
    const updateQuery = `UPDATE citas SET estado = 'cancelada' WHERE id = ? AND estado = 'agendada'`;

    db.run(updateQuery, [id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return reject(new Error('No se encontró una cita agendada para cancelar.'));

      resolve({ id, estado: 'cancelada' });
    });
  });
};