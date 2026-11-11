/**
 * Calcula próxima fecha hábil, diferenciando si el usuario es hombre o mujer.
 * @param {string|null} ultimaDonacion - Fecha en formato DD-MM-YYYY 
 * @param {*} sexo - 'M' (Masculino) o 'F' (Femenino)
 * @returns Fecha en formato YYYY-MM-DD (Mas fácil si queremos comparar)
 */
function calcularProximaFechaHabil(ultimaDonacion, sexo) {
    if(!ultimaDonacion) return null;
    
    // Destacar que se ocupa horario universal para evitar desfases al pasar a horario chileno!
    const [year, month, day] = ultimaDonacion.split('-').map(Number);
    const fecha = new Date(Date.UTC(year, month - 1, day));

    const mesesEspera = (sexo === 'M' || sexo === 'Hombre') ? 3 : 4;
    fecha.setUTCMonth(fecha.getUTCMonth() + mesesEspera);

    return fecha.toISOString().split('T')[0]
}

/**
 * Funcion para verificar elegibilidad del donante
 * @param {Object} donante - Datos del donante 
 * @param {string} fechaReferencia - Fecha Actual 'YYYY-MM-DD' (lo usamos para tests) 
 * @returns - Estado de elegibilidad del donante en forma de enum
 */
function verificarElegibilidad(donante, fechaReferencia = null) {
    const hoy = fechaReferencia || new Date().toISOString().split('T')[0];

    // Valida bloqueo permanente
    if(donante.estadoMedico === 'No apto permanentemente') {
        return {
            habilitado: false,
            estado: 'Inhabilitado',
            motivo: 'Debido a test de elegibilidad, el donante ha quedado no apto permanentemente.',
            proximaFechaHabil: null,
        };
    }

    // Calculamos fecha biológica según su última donación
    const fechaBiologica = calcularProximaFechaHabil(donante.ultimaDonacion, donante.sexo);

    // Validar diferimiento temporal
    if(donante.estadoMedico === 'Diferido temporalmente') {
        if(!donante.fechaFinDiferimiento || donante.fechaFinDiferimiento > hoy) {
            let proximaFecha = donante.fechaFinDiferimiento || null;
            if (proximaFecha && fechaBiologica && fechaBiologica > proximaFecha) {
                proximaFecha = fechaBiologica;
            }
            
            return {
            habilitado: false,
            estado: 'Inhabilitado',
            motivo: 'El donante de encuentra diferido temporalmente',
            proximaFechaHabil: proximaFecha,
            };
        }
    }

    // Validar plazo espera biológica
    if(fechaBiologica && fechaBiologica > hoy) {
        return {
            habilitado: false,
            estado: 'Inhabilitado',
            motivo: "El donante se encuentra en periodo de espera biológica (${donante.sexo === 'M' ? '3 meses' : '4 meses'})",
            proximaFechaHabil: fechaBiologica,
        };
    }

    // Habilitar si pasa todas las pruebas
    return {
        habilitado: true,
        estado: 'Habilitado',
        motivo: 'El donante cumple con los requisitos de elegibilidad',
        proximaFechaHabil: fechaBiologica || hoy
    };
}

// Exportar funciones para usar en endpoints
module.exports = {
    calcularProximaFechaHabil,
    verificarElegibilidad
};