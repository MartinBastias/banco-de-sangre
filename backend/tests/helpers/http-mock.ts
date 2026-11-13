import type { Request, Response } from 'express';

export function crearRespuestaSimulada() {
  let statusCode = 200;
  let body: Record<string, unknown> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  return {
    res,
    obtenerResultado: () => ({ statusCode, body }),
  };
}

export function invocarControladorSincrono(
  controlador: (req: Request, res: Response) => unknown,
  body: Record<string, unknown>,
) {
  const req = { body } as Request;
  const { res, obtenerResultado } = crearRespuestaSimulada();
  controlador(req, res);
  return obtenerResultado();
}
