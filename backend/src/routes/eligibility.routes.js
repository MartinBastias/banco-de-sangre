const express = require('express');
const router = express.Router();
const { verificarElegibilidad } = require('../services/eligibility.service');

router.post('/verificar-elegibilidad', (req, res) => {
    const { sexo, estadoMedico, ultimaDonacion, fechaFinDiferimiento } = req.body;

    // Validación basica datos necesarios
    if(!sexo || !estadoMedico) {
        return res.status(400).json({
            error: 'Los campos "sexo" y "estadoMedico" son obligatorios para verificar elegibilidad.'
        }); 
    }

    const resultado = verificarElegibilidad({
        sexo,
        estadoMedico,
        ultimaDonacion: ultimaDonacion || null,
        fechaFinDiferimiento: fechaFinDiferimiento || null,
    });

    return res.status(200).json(resultado);
});

module.exports = router;