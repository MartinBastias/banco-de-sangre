import { Router } from 'express';
import {
  manejadorGuardarFichaMedica,
  manejadorObtenerFichaMedica,
} from './ficha-medica.controller.ts';

const enrutador = Router();

enrutador.get('/ficha-medica/:rut', manejadorObtenerFichaMedica);
enrutador.post('/ficha-medica', manejadorGuardarFichaMedica);
enrutador.put('/ficha-medica/:rut', manejadorGuardarFichaMedica);

export default enrutador;
