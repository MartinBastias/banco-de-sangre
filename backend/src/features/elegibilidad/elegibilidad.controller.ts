import type { Request, Response } from 'express';
import { normalizarEstadoClinico } from '../ficha-medica/ficha-medica.validation.ts';
import { verificarElegibilidad } from './elegibilidad.service.ts';

export const manejadorVerificarElegibilidad = (
  req: Request,
  res: Response,
) => {
  const { sexo, estadoClinico, ultimaDonacion, fechaElegibilidad } = (req.body ??
    {}) as {
    sexo?: string;
    estadoClinico?: string;
    ultimaDonacion?: string | null;
    fechaElegibilidad?: string | null;
  };

  const estadoValidado = normalizarEstadoClinico(estadoClinico);

  if (!sexo || !estadoValidado) {
    return res.status(400).json({
      error:
        'Los campos "sexo" y "estadoClinico" (Apto, Diferido temporalmente o Excluyente) son obligatorios.',
    });
  }

  const resultado = verificarElegibilidad({
    sexo,
    estadoClinico: estadoValidado,
    ultimaDonacion: ultimaDonacion || null,
    fechaElegibilidad: fechaElegibilidad || null,
  });

  return res.status(200).json(resultado);
};
