/**
 * GAME_CONFIG
 * Configuración centralizada de constantes de juego y lógica de negocio.
 */
export const GAME_CONFIG = {
  /** Número de categorías por ronda */
  CATEGORIES_COUNT: 5,
  /** Longitud del código de sala */
  ROOM_CODE_LENGTH: 6,
  /** Caracteres permitidos en el código de sala */
  ROOM_CODE_CHARS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  /** Letras válidas para las rondas (sin K, W, Ñ) */
  ROUND_LETTERS: "ABCDEFGHIJLMNOPQRSTUVXYZ",
  /** Estados posibles de la sala */
  SALA_ESTADOS: [
    "lobby",
    "jugando",
    "puntuando",
    "resultado_ronda",
    "finalizada",
  ] as const,
  /** Estados posibles de la ronda */
  RONDA_ESTADOS: ["escribiendo", "puntuando", "completada"] as const,
  /** Ventana de cambio de letra (ms) */
  LETTER_CHANGE_WINDOW_MS: 3000,
  /** UUID nulo para referencias vacías */
  NULL_UUID: "00000000-0000-0000-0000-000000000000",
} as const;

/**
 * VALIDATION_RULES
 * Reglas de validación para inputs de usuario y lógica de juego.
 */
export const VALIDATION_RULES = {
  /** Nombre mínimo de jugador */
  NAME_MIN: 2,
  /** Nombre máximo de jugador */
  NAME_MAX: 20,
  /** Respuesta máxima permitida */
  ANSWER_MAX: 30,
  /** Categoría máxima permitida */
  CATEGORY_MAX: 30,
  /** Jugadores mínimos para iniciar */
  MIN_PLAYERS: 2,
} as const;

/**
 * UI_CONSTANTS
 * Constantes para animaciones, colores y otros detalles visuales.
 */
export const UI_CONSTANTS = {
  /** Delays base para animaciones (ms) */
  ANIMATION_BASE_DELAYS: [0, 100, 200, 300, 400] as const,
  /** Colores para posiciones de podio */
  PODIUM_COLORS: [
    "bg-yellow-400", // 1er lugar
    "bg-gray-300", // 2do lugar
    "bg-amber-700", // 3er lugar
  ] as const,
} as const;

// Tipos derivados de las constantes
export type SalaEstado = (typeof GAME_CONFIG.SALA_ESTADOS)[number];
export type RondaEstado = (typeof GAME_CONFIG.RONDA_ESTADOS)[number];
