import { crearCitaEnBD, reagendarCitaEnBD, cancelarCitaEnBD } from '../models/Cita.js';

export const agendarCita = async (req, res) => {
  try {
    // Estos datos deben coincidir con lo que enviará el frontend
    const { rut, sede, fecha, hora } = req.body;

    if (!rut || !sede || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan datos requeridos (rut, sede, fecha, hora).' });
    }

    const nuevaCita = await crearCitaEnBD(rut, sede, fecha, hora);
    
    res.status(201).json({
      mensaje: 'Cita agendada con éxito',
      cita: nuevaCita
    });

  } catch (error) {
    // Si la capacidad está llena, devuelve error 400
    res.status(400).json({ error: error.message });
  }
};
export const modificarCita = async (req, res) => {
  try {
    const idCita = req.params.id; // Captura el ID desde la URL
    const { sede, fecha, hora } = req.body;

    if (!sede || !fecha || !hora) {
      return res.status(400).json({ error: 'Faltan datos para reagendar (sede, fecha, hora).' });
    }

    const citaActualizada = await reagendarCitaEnBD(idCita, sede, fecha, hora);
    
    res.status(200).json({
      mensaje: 'Cita reagendada con éxito',
      cita: citaActualizada
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelarCita = async (req, res) => {
  try {
    const idCita = req.params.id; // Captura el ID desde la URL

    const citaCancelada = await cancelarCitaEnBD(idCita);

    res.status(200).json({
      mensaje: 'Cita cancelada con éxito',
      cita: citaCancelada
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};