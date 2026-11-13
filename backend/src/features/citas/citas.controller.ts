import type { Request, Response } from 'express';
import { responderErrorControlador } from '../../lib/errores.ts';
import {
  cancelarCita,
  crearCita,
  listarCitasActuales,
  obtenerCitaActiva,
  obtenerDisponibilidadCitas,
  reagendarCita,
} from './citas.service.ts';

function parsearIdPositivo(valor: unknown): number | null {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

export const manejadorObtenerDisponibilidad = async (
  req: Request,
  res: Response,
) => {
  const rut = typeof req.query.rut === 'string' ? req.query.rut.trim() : '';
  const sede = typeof req.query.sede === 'string' ? req.query.sede.trim() : '';
  const fecha =
    typeof req.query.fecha === 'string' ? req.query.fecha.trim() : '';
  const excluirCitaId =
    typeof req.query.excluirCitaId === 'string'
      ? (parsearIdPositivo(req.query.excluirCitaId) ?? undefined)
      : undefined;

  try {
    const disponibilidad = await obtenerDisponibilidadCitas({
      rut: rut || undefined,
      sede: sede || undefined,
      fecha: fecha || undefined,
      excluirCitaId,
    });
    return res.status(200).json(disponibilidad);
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'No se pudo consultar la disponibilidad de citas.',
      500,
    );
  }
};

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
    return responderErrorControlador(
      res,
      error,
      'No se pudo consultar las citas.',
      500,
    );
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
      return res.status(400).json({
        error: 'Faltan datos obligatorios para agendar (rut, sede, fecha, hora).',
      });
    }

    const citaCreada = await crearCita({ rut, sede, fecha, hora });

    return res.status(201).json({
      mensaje: 'Cita agendada con éxito',
      cita: citaCreada,
    });
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'Error al agendar la cita.',
      400,
    );
  }
};

export const manejadorReagendarCita = async (
  req: Request,
  res: Response,
) => {
  try {
    const idCita = parsearIdPositivo(req.params.id);
    if (!idCita) {
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
    return responderErrorControlador(
      res,
      error,
      'Error al reagendar la cita.',
      400,
    );
  }
};

export const manejadorCancelarCita = async (
  req: Request,
  res: Response,
) => {
  try {
    const idCita = parsearIdPositivo(req.params.id);
    if (!idCita) {
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
    return responderErrorControlador(
      res,
      error,
      'Error al cancelar la cita.',
      400,
    );
  }
};
