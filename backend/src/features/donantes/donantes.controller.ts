import type { Request, Response } from 'express';
import { responderErrorControlador } from '../../lib/errores.ts';
import {
  buscarDonantePorRut,
  listarDonantesConEstado,
  registrarDonante,
} from './donantes.service.ts';

export const manejadorRegistrarDonante = async (
  req: Request,
  res: Response,
) => {
  try {
    const { rut } = (req.body ?? {}) as { rut?: string };

    if (!rut || typeof rut !== 'string' || !rut.trim()) {
      return res.status(400).json({ error: 'El RUT es obligatorio.' });
    }

    const donante = await registrarDonante(rut);
    return res.status(201).json({
      mensaje: 'Donante registrado con éxito.',
      donante,
    });
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'Error al registrar donante.',
      500,
    );
  }
};

export const manejadorBuscarDonante = async (req: Request, res: Response) => {
  try {
    const rut = typeof req.params.rut === 'string' ? req.params.rut : '';

    if (!rut.trim()) {
      return res.status(400).json({ error: 'El RUT es obligatorio.' });
    }

    const donante = await buscarDonantePorRut(rut);

    if (!donante) {
      return res.status(404).json({
        registrado: false,
        error: 'Donante no encontrado. Un enfermero debe registrarlo primero.',
      });
    }

    return res.status(200).json({
      registrado: true,
      donante,
    });
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'Error al consultar donante.',
      500,
    );
  }
};

export const manejadorListarDonantes = async (
  _req: Request,
  res: Response,
) => {
  try {
    const donantes = await listarDonantesConEstado();
    return res.status(200).json({ donantes });
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'Error al listar donantes.',
      500,
    );
  }
};
