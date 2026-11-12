import { Router, type Request, type Response } from 'express';
import { verificarElegibilidad } from './elegibilidad.service.ts';

const enrutador = Router();

export const manejadorVerificarElegibilidad = (req: Request, res: Response) => {
  const { sexo, estadoMedico, ultimaDonacion, fechaFinDiferimiento } = (req.body ??
    {}) as {
    sexo?: string;
    estadoMedico?: string;
    ultimaDonacion?: string | null;
    fechaFinDiferimiento?: string | null;
  };

  if (!sexo || !estadoMedico) {
    return res.status(400).json({
      error:
        'Los campos "sexo" y "estadoMedico" son obligatorios para verificar elegibilidad.',
    });
  }

  const resultado = verificarElegibilidad({
    sexo,
    estadoMedico,
    ultimaDonacion: ultimaDonacion || null,
    fechaFinDiferimiento: fechaFinDiferimiento || null,
  });

  return res.status(200).json(resultado);
};

export const verifyEligibilityHandler = manejadorVerificarElegibilidad;

enrutador.post('/verificar-elegibilidad', manejadorVerificarElegibilidad);

export default enrutador;
