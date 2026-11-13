import { Router } from 'express';
import { manejadorVerificarElegibilidad } from './elegibilidad.controller.ts';

export { manejadorVerificarElegibilidad };

const enrutador = Router();

enrutador.post('/verificar-elegibilidad', manejadorVerificarElegibilidad);

export default enrutador;
