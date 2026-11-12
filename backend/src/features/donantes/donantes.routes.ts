import { Router } from 'express';
import {
  manejadorBuscarDonante,
  manejadorListarDonantes,
  manejadorRegistrarDonante,
} from './donantes.controller.ts';

const enrutador = Router();

enrutador.get('/donantes', manejadorListarDonantes);
enrutador.post('/donantes', manejadorRegistrarDonante);
enrutador.get('/donantes/:rut', manejadorBuscarDonante);

export default enrutador;

