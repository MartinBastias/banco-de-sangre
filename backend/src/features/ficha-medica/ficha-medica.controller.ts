import type { Request, Response } from 'express';
import { responderErrorControlador } from '../../lib/errores.ts';
import { buscarDonantePorRut } from '../donantes/donantes.service.ts';
import {
  guardarFichaMedica,
  obtenerFichaMedicaPorRut,
} from './ficha-medica.service.ts';
import type { EntradaFormularioFichaMedica } from './ficha-medica.types.ts';

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
    return responderErrorControlador(
      res,
      error,
      'Error al consultar la ficha médica.',
      500,
    );
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
    return responderErrorControlador(
      res,
      error,
      'Error al guardar la ficha médica.',
      500,
    );
  }
};
