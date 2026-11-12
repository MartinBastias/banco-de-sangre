import type { Request, Response } from 'express';
import { buscarDonantePorRut } from '../donantes/donantes.service.ts';
import {
  type EntradaFormularioFichaMedica,
  ErrorFichaMedica,
  guardarFichaMedica,
  obtenerFichaMedicaPorRut,
} from './ficha-medica.service.ts';

export const manejadorObtenerFichaMedica = async (
  req: Request,
  res: Response,
) => {
  try {
    const rut = typeof req.params.rut === 'string' ? req.params.rut : '';

    if (!rut.trim()) {
      return res.status(400).json({ error: 'El RUT es obligatorio.' });
    }

    const [donante, ficha] = await Promise.all([
      buscarDonantePorRut(rut),
      obtenerFichaMedicaPorRut(rut),
    ]);

    if (!donante && !ficha) {
      return res.status(404).json({
        registrado: false,
        ficha: null,
        error: 'No se encontró un registro previo para este RUT.',
      });
    }

    return res.status(200).json({
      registrado: true,
      donante,
      ficha,
    });
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : 'Error al consultar la ficha médica.';
    return res.status(500).json({ error: mensaje });
  }
};

export const manejadorGuardarFichaMedica = async (
  req: Request,
  res: Response,
) => {
  try {
    const cuerpo = (req.body ?? {}) as Partial<EntradaFormularioFichaMedica>;
    const rutParam =
      typeof req.params.rut === 'string' ? req.params.rut : undefined;
    const rut = rutParam || cuerpo.rut || '';

    if (!rut || typeof rut !== 'string' || !rut.trim()) {
      return res.status(400).json({ error: 'El RUT del donante es obligatorio.' });
    }

    const resultado = await guardarFichaMedica({
      ...cuerpo,
      rut,
    });

    return res.status(resultado.actualizado ? 200 : 201).json(resultado);
  } catch (error) {
    if (error instanceof ErrorFichaMedica) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const mensaje =
      error instanceof Error
        ? error.message
        : 'Error al guardar la ficha médica.';
    return res.status(500).json({ error: mensaje });
  }
};
