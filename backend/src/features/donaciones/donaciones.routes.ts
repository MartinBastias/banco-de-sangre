import { Router } from 'express';
import {
  manejadorListarDonaciones,
  manejadorRegistrarDonacion,
} from './donaciones.controller.ts';

const enrutador = Router();

enrutador.post('/donaciones', manejadorRegistrarDonacion);
enrutador.get('/donaciones', manejadorListarDonaciones);
enrutador.get('/donantes/:rut/donaciones', manejadorListarDonaciones);

export default enrutador;
