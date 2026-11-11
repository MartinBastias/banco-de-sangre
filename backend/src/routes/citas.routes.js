import express from 'express';
import { agendarCita, modificarCita, cancelarCita } from '../controllers/citas.controller.js';

const router = express.Router();

// Endpoint para crear una cita (POST /api/citas)
router.post('/citas', agendarCita);
router.put('/citas/:id', modificarCita);
router.delete('/citas/:id', cancelarCita);

export default router;