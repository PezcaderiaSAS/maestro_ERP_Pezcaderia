/**
 * Utilidades generales del ERP MaestroPescaderia
 */

/** Genera IDs únicos usando crypto.randomUUID() — resistente a colisiones en operaciones rápidas */
export const generateId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  // Fallback si crypto.randomUUID no está disponible en entorno de test/legacy
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
};

export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const smallWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'a', 'por', 'para'];
      if (smallWords.includes(word) && str.toLowerCase().indexOf(word) !== 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
