import type { Response } from 'express';

/**
 * Error base de dominio con código HTTP asociado.
 */
export class ErrorDominio extends Error {
  statusCode: number;

  constructor(mensaje: string, statusCode = 400) {
    super(mensaje);
    this.statusCode = statusCode;
  }
}

/**
 * Envía una respuesta HTTP de error estandarizada desde los controladores.
 */
export function responderErrorControlador(
  res: Response,
  error: unknown,
  mensajePorDefecto: string,
  statusPorDefecto = 500,
) {
  if (error instanceof ErrorDominio) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  const mensaje = error instanceof Error ? error.message : mensajePorDefecto;
  return res.status(statusPorDefecto).json({ error: mensaje });
}
