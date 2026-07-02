// src/hooks/useBalanza.ts

import { useState } from 'react';
import { createLogger } from '../lib/consoleLogger';

const log = createLogger('Balanza');

export function useBalanza() {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Intenta leer el peso desde una balanza conectada por puerto serie.
   * Aplica: RN-13 (Lectura de balanza con fallback manual y timeout de 3 segundos)
   */
  const leerPeso = async (baudRate: number = 9600): Promise<number> => {
    log.info('leerPeso', { baudRate });
    setReading(true);
    setError(null);

    // Timeout de 3 segundos (RN-13)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Balanza no detectada (Timeout)')), 3000)
    );

    const readPromise = async (): Promise<number> => {
      // Validar si el navegador soporta Web Serial API
      if (typeof window === 'undefined' || !('serial' in navigator)) {
        throw new Error('Web Serial API no soportada en este navegador');
      }

      try {
        // Solicitar puerto al usuario (o reusar puerto)
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate });

        const reader = port.readable.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          // Leer datos
          const { value, done } = await reader.read();
          if (done || !value) {
            throw new Error('No se recibieron datos de la balanza');
          }

          buffer += decoder.decode(value);
          
          // Buscar patrón de números decimales (ej: "001.350 KG" o "  1.35  ")
          const matches = buffer.match(/(\d+\.\d+)/);
          if (matches) {
            const peso = parseFloat(matches[1]);
            return peso;
          } else {
            throw new Error('Formato de peso inválido');
          }
        } finally {
          // Liberar el reader y cerrar el puerto
          reader.releaseLock();
          await port.close();
        }
      } catch (err: any) {
        throw new Error(err.message || 'Error al conectar con la balanza');
      }
    };

    try {
      // Ejecutar con límite de tiempo
      const peso = await Promise.race([readPromise(), timeoutPromise]);
      setReading(false);
      return peso;
    } catch (err: any) {
      log.error('leerPeso FAIL', { error: err.message });
      setReading(false);
      const errMsg = err.message || 'Error desconocido en la balanza';
      setError(errMsg);
      throw err;
    }
  };

  /**
   * Simulador de peso para pruebas locales o cuando no hay hardware físico conectado
   */
  const simularLeerPeso = async (): Promise<number> => {
    log.info('simularLeerPeso');
    setReading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReading(false);
    
    // Retornar un peso aleatorio entre 0.5 kg y 5.0 kg
    const pesoSimulado = parseFloat((Math.random() * 4.5 + 0.5).toFixed(3));
    return pesoSimulado;
  };

  return {
    reading,
    error,
    leerPeso,
    simularLeerPeso,
    isSupported: typeof window !== 'undefined' && 'serial' in navigator,
  };
}
