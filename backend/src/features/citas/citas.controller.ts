import type { Request, Response } from 'express';
import {
  cancelarCita,
  crearCita,
  ErrorCita,
  listarCitasActuales,
  obtenerCitaActiva,
  reagendarCita,
} from './citas.service.ts';

export const manejadorObtenerCita = async (req: Request, res: Response) => {
  const rut = typeof req.query.rut === 'string' ? req.query.rut.trim() : '';

  try {
    if (rut) {
      const cita = await obtenerCitaActiva(rut);
      return res.status(200).json({ cita });
    }

    const citas = await listarCitasActuales();
    return res.status(200).json({ citas });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : 'No se pudo consultar las citas.';
    return res.status(500).json({ error: mensaje });
  }
};

export const manejadorAgendarCita = async (
  req: Request,
  res: Response,
) => {
  try {
    const { rut, sede, fecha, hora } = (req.body ?? {}) as {
      rut?: string;
      sede?: string;
      fecha?: string;
      hora?: string;
    };

    if (!rut || !sede || !fecha || !hora) {
      return res
        .status(400)
        .json({ error: 'Faltan datos requeridos (rut, sede, fecha, hora).' });
    }

    const citaCreada = await crearCita({
      rut,
      sede,
      fecha,
      hora,
    });

    return res.status(201).json({
      mensaje: 'Cita agendada con éxito',
      cita: citaCreada,
    });
  } catch (error) {
    if (error instanceof ErrorCita) {
      return res.status(400).json({ error: error.message });
    }
    const mensaje =
      error instanceof Error ? error.message : 'Error al agendar la cita.';
    return res.status(400).json({ error: mensaje });
  }
};

export const manejadorReagendarCita = async (
  req: Request,
  res: Response,
) => {
  try {
    const idCita = Number(req.params.id);
    if (!Number.isSafeInteger(idCita) || idCita <= 0) {
      return res
        .status(400)
        .json({ error: 'El identificador de la cita no es válido.' });
    }

    const { sede, fecha, hora } = (req.body ?? {}) as {
      sede?: string;
      fecha?: string;
      hora?: string;
    };

    if (!sede || !fecha || !hora) {
      return res.status(400).json({
        error: 'Faltan datos para reagendar (sede, fecha, hora).',
      });
    }

    const citaActualizada = await reagendarCita(idCita, {
      sede,
      fecha,
      hora,
    });

    return res.status(200).json({
      mensaje: 'Cita reagendada con éxito',
      cita: citaActualizada,
    });
  } catch (error) {
    if (error instanceof ErrorCita) {
      return res.status(400).json({ error: error.message });
    }
    const mensaje =
      error instanceof Error ? error.message : 'Error al reagendar la cita.';
    return res.status(400).json({ error: mensaje });
  }
};

export const manejadorCancelarCita = async (
  req: Request,
  res: Response,
) => {
  try {
    const idCita = Number(req.params.id);
    if (!Number.isSafeInteger(idCita) || idCita <= 0) {
      return res
        .status(400)
        .json({ error: 'El identificador de la cita no es válido.' });
    }

    const citaCancelada = await cancelarCita(idCita);

    return res.status(200).json({
      mensaje: 'Cita cancelada con éxito',
      cita: citaCancelada,
    });
  } catch (error) {
    if (error instanceof ErrorCita) {
      return res.status(400).json({ error: error.message });
    }
    const mensaje =
      error instanceof Error ? error.message : 'Error al cancelar la cita.';
    return res.status(400).json({ error: mensaje });
  }
};
