/**
 * Máquina de Estados del Chat AI Tutor
 * Sistema SOPHI - Fase 4 (Simplificado v2.3.0)
 *
 * Define utilidades básicas para el flujo de momentos
 */

import { ChatState } from './sessions';

/**
 * Obtiene el siguiente momento pedagógico
 */
export function getNextMoment(currentMoment: string): string | null {
  const moments = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];
  const currentIndex = moments.indexOf(currentMoment);

  if (currentIndex === -1 || currentIndex === moments.length - 1) {
    return null; // No hay siguiente momento
  }

  return moments[currentIndex + 1];
}

/**
 * Tipo exportado para compatibilidad
 */
export type { ChatState };
