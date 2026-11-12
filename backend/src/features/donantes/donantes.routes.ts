import { Router } from 'express';
import {
  manejadorBuscarDonante,
  manejadorRegistrarDonante,
} from './donantes.controller.ts';

const enrutador = Router();

enrutador.post('/donantes', manejadorRegistrarDonante);
enrutador.get('/donantes/:rut', manejadorBuscarDonante);

export default enrutador;

