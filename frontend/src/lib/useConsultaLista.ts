'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook genérico para consultar listados desde la API con soporte de recarga manual.
 */
export function useConsultaLista<T>(
  consultarFn: () => Promise<T[]>,
  mensajeErrorDefecto: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const lista = await consultarFn();
        if (!cancelado) {
          setItems(lista);
          setError(null);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : mensajeErrorDefecto);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [consultarFn, mensajeErrorDefecto]);

  const actualizar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await consultarFn();
      setItems(lista);
    } catch (err) {
      setError(err instanceof Error ? err.message : mensajeErrorDefecto);
    } finally {
      setCargando(false);
    }
  }, [consultarFn, mensajeErrorDefecto]);

  return {
    items,
    cargando,
    error,
    actualizar,
  };
}
