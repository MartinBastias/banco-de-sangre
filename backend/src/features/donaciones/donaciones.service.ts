import {
  esRutValido,
  MENSAJE_RUT_INVALIDO,
  normalizarRut,
} from '../../lib/rut.ts';
import { marcarCitaRealizadaPorRutDB } from '../citas/citas.repository.ts';
import { buscarDonantePorRutDB } from '../donantes/donantes.repository.ts';
import { obtenerFichaMedicaDB } from '../ficha-medica/ficha-medica.repository.ts';
import {
  insertarDonacionDB,
  listarDonacionesDB,
} from './donaciones.repository.ts';
import {
  type DonacionDTO,
  type EntradaRegistroDonacion,
  ErrorDonacion,
  type RegistroDonacionDB,
} from './donaciones.types.ts';
import {
  generarIdBolsa,
  mapearDonacionADTO,
  validarEntradaDonacion,
  validarYPrepararDonacion,
} from './donaciones.validation.ts';

const MAX_INTENTOS_ID_BOLSA = 5;

/**
 * Registra una extracción de sangre validando donante, su ficha médica, generando un ID de bolsa único y cerrando citas agendadas activas.
 */
export async function registrarDonacion(entrada: EntradaRegistroDonacion) {
  const datosEntrada = validarEntradaDonacion(entrada);

  const donante = await buscarDonantePorRutDB(datosEntrada.rut);
  if (!donante) {
    throw new ErrorDonacion(
      'El donante con este RUT no se encuentra registrado en el sistema.',
      404,
    );
  }

  const ficha = await obtenerFichaMedicaDB(datosEntrada.rut);
  const datosBase = validarYPrepararDonacion(
    entrada,
    ficha?.tipoSangre,
    generarIdBolsa(),
  );

  let guardada: RegistroDonacionDB | null = null;
  let idBolsaActual = datosBase.idBolsa;

  for (let intento = 0; intento < MAX_INTENTOS_ID_BOLSA; intento += 1) {
    try {
      guardada = await insertarDonacionDB({
        ...datosBase,
        idBolsa: idBolsaActual,
      });
      break;
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') {
        idBolsaActual = generarIdBolsa();
        continue;
      }
      throw error;
    }
  }

  if (!guardada) {
    throw new ErrorDonacion(
      'No se pudo generar un identificador único para la bolsa.',
      500,
    );
  }

  const citaCompletada = await marcarCitaRealizadaPorRutDB(datosBase.rut);

  const mensaje = citaCompletada
    ? 'Extracción de sangre registrada correctamente. La cita agendada del donante fue marcada como realizada.'
    : 'Extracción de sangre registrada correctamente.';

  return {
    mensaje,
    citaCompletada,
    donacion: mapearDonacionADTO(guardada),
  };
}

/**
 * Lista el historial de donaciones, validando y normalizando el RUT cuando se entrega como filtro.
 */
export async function listarDonaciones(
  rutCrudo?: string,
): Promise<DonacionDTO[]> {
  let rutNormalizado: string | undefined;

  if (rutCrudo !== undefined) {
    rutNormalizado = normalizarRut(rutCrudo);
    if (!esRutValido(rutNormalizado)) {
      throw new ErrorDonacion(MENSAJE_RUT_INVALIDO, 400);
    }
  }

  const filas = await listarDonacionesDB(rutNormalizado);
  return filas.map(mapearDonacionADTO);
}
