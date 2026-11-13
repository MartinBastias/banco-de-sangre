import { Router } from 'express';
import {
  manejadorAgendarCita,
  manejadorCancelarCita,
  manejadorObtenerCita,
  manejadorObtenerDisponibilidad,
  manejadorReagendarCita,
} from './citas.controller.ts';

const enrutador = Router();

enrutador.get('/citas/disponibilidad', manejadorObtenerDisponibilidad);
enrutador.get('/citas', manejadorObtenerCita);
enrutador.post('/citas', manejadorAgendarCita);
enrutador.put('/citas/:id', manejadorReagendarCita);
enrutador.delete('/citas/:id', manejadorCancelarCita);

export default enrutador;
