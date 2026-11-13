import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CAPACIDAD_MAXIMA_BLOQUE,
  type CitaOcupada,
  ErrorCita,
  HORARIOS_DISPONIBLES,
} from '../../../src/features/citas/citas.types.ts';
import {
  evaluarDisponibilidadCitas,
  validarCapacidadBloque,
  validarElegibilidadParaCita,
  validarReservaDisponible,
} from '../../../src/features/citas/citas.validation.ts';
import { obtenerFechaYMinutosActuales } from '../../../src/lib/fechas.ts';

describe('Validación de elegibilidad para agendar citas', () => {
  it('permite agendar cuando no existe ficha médica o el estado es Apto', () => {
    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(null, '2026-11-20');
    });

    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        { estadoClinico: 'Apto', fechaElegibilidad: '2026-11-12' },
        '2026-11-12',
      );
    });
  });

  it('bloquea citas para donantes con estado Excluyente', () => {
    assert.throws(
      () =>
        validarElegibilidadParaCita(
          { estadoClinico: 'Excluyente', fechaElegibilidad: null },
          '2026-11-20',
        ),
      ErrorCita,
    );
  });

  it('bloquea citas anteriores a fechaElegibilidad cuando está Diferido temporalmente', () => {
    assert.throws(
      () =>
        validarElegibilidadParaCita(
          {
            estadoClinico: 'Diferido temporalmente',
            fechaElegibilidad: '2027-02-12',
          },
          '2027-02-11',
        ),
      /2027-02-12/,
    );
  });

  it('permite citas desde fechaElegibilidad en adelante cuando está Diferido temporalmente', () => {
    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        {
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2027-02-12',
        },
        '2027-02-12',
      );
    });

    assert.doesNotThrow(() => {
      validarElegibilidadParaCita(
        {
          estadoClinico: 'Diferido temporalmente',
          fechaElegibilidad: '2027-02-12',
        },
        '2027-03-01',
      );
    });
  });
});

describe('Validación de cupos por bloque horario', () => {
  it('permite reservar cuando hay menos de 5 personas en el horario', () => {
    assert.equal(CAPACIDAD_MAXIMA_BLOQUE, 5);
    for (let ocupados = 0; ocupados < 5; ocupados += 1) {
      assert.doesNotThrow(() => {
        validarCapacidadBloque(ocupados);
      });
    }
  });

  it('no permite reservar cita cuando el horario ya tiene 5 o más personas', () => {
    assert.throws(() => validarCapacidadBloque(5), ErrorCita);
    assert.throws(() => validarCapacidadBloque(6), ErrorCita);
  });
});

function llenarDia(
  sede: string,
  fecha: string,
  horas: readonly string[] = HORARIOS_DISPONIBLES,
): CitaOcupada[] {
  const resultado: CitaOcupada[] = [];
  for (const hora of horas) {
    for (let i = 0; i < CAPACIDAD_MAXIMA_BLOQUE; i += 1) {
      resultado.push({ sede, fecha, hora });
    }
  }
  return resultado;
}

describe('Evaluación de elegibilidad, cupos reales y fallback automático de fecha', () => {
  // 2026-11-13 14:10 America/Santiago (UTC-3 -> 17:10Z)
  const ahora1410 = new Date('2026-11-13T17:10:00Z');
  // 2026-11-13 15:45 America/Santiago (UTC-3 -> 18:45Z)
  const ahora1545 = new Date('2026-11-13T18:45:00Z');

  it('interpreta correctamente la hora local de la clínica (America/Santiago)', () => {
    const info = obtenerFechaYMinutosActuales(ahora1410);
    assert.equal(info.fechaActual, '2026-11-13');
    assert.equal(info.minutosActuales, 14 * 60 + 10);
  });

  it('mantiene la fecha base cuando el usuario es Apto y existen cupos posteriores a la hora actual', () => {
    const res = evaluarDisponibilidadCitas({
      ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
      sede: 'cpp',
      citasAgendadas: [],
      ahora: ahora1410,
    });

    assert.equal(res.elegible, true);
    if (!res.elegible) return;
    assert.equal(res.fechaBase, '2026-11-13');
    assert.equal(res.fechaMinimaDisponible, '2026-11-13');
    assert.equal(res.avanzadaPorDisponibilidad, false);
    assert.deepEqual(
      res.slotsFechaConsultada.filter((s) => s.disponible).map((s) => s.hora),
      ['15:30'],
    );
  });

  it('considera el margen de anticipación para filtrar horarios del mismo día', () => {
    const res = evaluarDisponibilidadCitas({
      ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
      sede: 'cpp',
      citasAgendadas: [],
      ahora: ahora1410,
      margenAnticipacionMinutos: 90,
    });

    assert.equal(res.elegible, true);
    if (!res.elegible) return;
    assert.equal(res.fechaBase, '2026-11-13');
    assert.equal(res.fechaMinimaDisponible, '2026-11-14');
    assert.equal(res.avanzadaPorDisponibilidad, true);
    assert.ok(res.diasSinCupos.includes('2026-11-13'));
  });

  it('avanza automáticamente al próximo día disponible si todas las horas del día base ya pasaron', () => {
    const res = evaluarDisponibilidadCitas({
      ficha: null,
      sede: 'cpp',
      citasAgendadas: [],
      ahora: ahora1545,
    });

    assert.equal(res.elegible, true);
    if (!res.elegible) return;
    assert.equal(res.fechaBase, '2026-11-13');
    assert.equal(res.fechaMinimaDisponible, '2026-11-14');
    assert.equal(res.avanzadaPorDisponibilidad, true);
    assert.equal(res.slotsFechaConsultada.length, HORARIOS_DISPONIBLES.length);
    assert.ok(res.slotsFechaConsultada.every((s) => s.disponible));
  });

  it('salta días llenos y días cerrados desde la fecha base de elegibilidad', () => {
    const citas = [
      ...llenarDia('cpp', '2026-11-13', ['15:30']),
      ...llenarDia('cpp', '2026-11-14'),
    ];
    const diasCerrados = new Set(['2026-11-15']);

    const res = evaluarDisponibilidadCitas({
      ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
      sede: 'cpp',
      citasAgendadas: citas,
      ahora: ahora1410,
      diasCerrados,
    });

    assert.equal(res.elegible, true);
    if (!res.elegible) return;
    assert.equal(res.fechaBase, '2026-11-13');
    assert.equal(res.fechaMinimaDisponible, '2026-11-16');
    assert.equal(res.avanzadaPorDisponibilidad, true);
    assert.deepEqual(
      res.diasSinCupos.slice(0, 3),
      ['2026-11-13', '2026-11-14', '2026-11-15'],
    );
  });

  it('para un donante diferido temporalmente, evalúa elegibilidad base y salta días sin cupos desde fechaElegibilidad', () => {
    const citas = [...llenarDia('spp', '2026-11-20')];

    const res = evaluarDisponibilidadCitas({
      ficha: {
        estadoClinico: 'Diferido temporalmente',
        fechaElegibilidad: '2026-11-20',
      },
      sede: 'spp',
      citasAgendadas: citas,
      ahora: ahora1410,
    });

    assert.equal(res.elegible, true);
    if (!res.elegible) return;
    assert.equal(res.fechaBase, '2026-11-20');
    assert.equal(res.fechaMinimaDisponible, '2026-11-21');
    assert.equal(res.avanzadaPorDisponibilidad, true);
    assert.ok(res.diasSinCupos.includes('2026-11-20'));
  });

  it('marca no elegible cuando el donante tiene estado Excluyente', () => {
    const res = evaluarDisponibilidadCitas({
      ficha: { estadoClinico: 'Excluyente', fechaElegibilidad: null },
      sede: 'cpp',
      citasAgendadas: [],
      ahora: ahora1410,
    });

    assert.equal(res.elegible, false);
  });

  it('rechaza en backend agendar en días vacíos saltados, horarios pasados o bloques completos', () => {
    const citas = [
      ...llenarDia('cpp', '2026-11-13', ['15:30']),
      ...llenarDia('cpp', '2026-11-14', ['09:00']),
    ];

    assert.throws(
      () =>
        validarReservaDisponible({
          ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
          sede: 'cpp',
          fecha: '2026-11-13',
          hora: '14:00',
          citasAgendadas: citas,
          ahora: ahora1410,
        }),
      /2026-11-14/,
    );

    assert.throws(
      () =>
        validarReservaDisponible({
          ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
          sede: 'cpp',
          fecha: '2026-11-14',
          hora: '09:00',
          citasAgendadas: citas,
          ahora: ahora1410,
        }),
      ErrorCita,
    );

    assert.doesNotThrow(() =>
      validarReservaDisponible({
        ficha: { estadoClinico: 'Apto', fechaElegibilidad: null },
        sede: 'cpp',
        fecha: '2026-11-14',
        hora: '10:00',
        citasAgendadas: citas,
        ahora: ahora1410,
      }),
    );
  });
});
