import db from '../config/db.js'; // Ajusta la ruta a tu conexión SQLite real

/**
 * Crea la tabla de fichas médicas en la base de datos si no existe.
 * Establece el RUT como clave primaria para asegurar una única ficha actual por donante.
 */
export const inicializarEsquemaFichaMedica = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ficha_medica (
      rut TEXT PRIMARY KEY,
      presion_arterial TEXT,
      frecuencia_cardiaca INTEGER,
      peso REAL,
      estado_clinico TEXT CHECK(estado_clinico IN ('listo para donar', 'Diferido')),
      tipo_sangre TEXT,
      fecha_elegibilidad TEXT,
      observaciones TEXT,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.exec(query, (err) => {
    if (err) {
      console.error('Error inicializando esquema ficha_medica:', err.message);
    }
  });
};

/**
 * Registra o actualiza la ficha médica y signos vitales de un donante.
 * Si el RUT no existe, inserta un nuevo registro. Si ya existe, actualiza los valores.
 * 
 * @param {Object} datosFicha - Objeto con los datos médicos del donante.
 * @param {string} datosFicha.rut - Identificador único del donante.
 * @param {string} datosFicha.presionArterial - Medición de presión arterial (ej. "120/80").
 * @param {number} datosFicha.frecuenciaCardiaca - Pulsaciones por minuto.
 * @param {number} datosFicha.peso - Peso en kilogramos.
 * @param {string} datosFicha.estadoClinico - Estado de evaluación ('listo para donar' o 'Diferido').
 * @param {string} datosFicha.tipoSangre - Grupo sanguíneo y factor Rh.
 * @param {string} datosFicha.fechaElegibilidad - Fecha calculada para próxima donación (formato ISO).
 * @param {string} datosFicha.observaciones - Notas adicionales de la entrevista.
 * @returns {Promise<Object>} Resultado de la operación en la base de datos.
 */
export const guardarFichaMedica = (datosFicha) => {
  return new Promise((resolve, reject) => {
    const {
      rut,
      presionArterial,
      frecuenciaCardiaca,
      peso,
      estadoClinico,
      tipoSangre,
      fechaElegibilidad,
      observaciones
    } = datosFicha;

    const query = `
      INSERT INTO ficha_medica (
        rut, presion_arterial, frecuencia_cardiaca, peso, 
        estado_clinico, tipo_sangre, fecha_elegibilidad, observaciones, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(rut) DO UPDATE SET
        presion_arterial = excluded.presion_arterial,
        frecuencia_cardiaca = excluded.frecuencia_cardiaca,
        peso = excluded.peso,
        estado_clinico = excluded.estado_clinico,
        tipo_sangre = excluded.tipo_sangre,
        fecha_elegibilidad = excluded.fecha_elegibilidad,
        observaciones = excluded.observaciones,
        fecha_actualizacion = CURRENT_TIMESTAMP;
    `;

    db.run(
      query,
      [rut, presionArterial, frecuenciaCardiaca, peso, estadoClinico, tipoSangre, fechaElegibilidad, observaciones],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            filasAfectadas: this.changes,
            mensaje: 'Ficha médica registrada/actualizada correctamente'
          });
        }
      }
    );
  });
};