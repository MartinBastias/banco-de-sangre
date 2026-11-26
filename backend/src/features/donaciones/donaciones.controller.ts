import type { Request, Response } from 'express';
import { responderErrorControlador } from '../../lib/errores.ts';
import { listarDonaciones, registrarDonacion } from './donaciones.service.ts';
import type { EntradaRegistroDonacion } from './donaciones.types.ts';

/**
 * Controlador HTTP para registrar una nueva donación o extracción de sangre.
 */
export const manejadorRegistrarDonacion = async (
  req: Request,
  res: Response,
) => {
  try {
    const { rut, mlExtraidos } = (req.body ??
      {}) as Partial<EntradaRegistroDonacion>;

    if (
      typeof rut !== 'string' ||
      !rut.trim() ||
      mlExtraidos === undefined ||
      mlExtraidos === null ||
      mlExtraidos === ''
    ) {
      return res.status(400).json({
        error:
          'Faltan datos obligatorios para registrar la donación (rut, mlExtraidos).',
      });
    }

    const resultado = await registrarDonacion({
      rut,
      mlExtraidos,
    });

    return res.status(201).json(resultado);
  } catch (error) {
    if ((error as { code?: string })?.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe una donación registrada con este ID de bolsa.',
      });
    }

    return responderErrorControlador(
      res,
      error,
      'Error al registrar la extracción de sangre.',
      500,
    );
  }
};

/**
 * Controlador HTTP para listar todas las donaciones o filtrarlas por RUT de donante.
 */
export const manejadorListarDonaciones = async (
  req: Request,
  res: Response,
) => {
  try {
    const rut = typeof req.params?.rut === 'string' ? req.params.rut : undefined;
    const donaciones = await listarDonaciones(rut);
    return res.status(200).json({ donaciones });
  } catch (error) {
    return responderErrorControlador(
      res,
      error,
      'Error al consultar el historial de donaciones.',
      500,
    );
  }
};
