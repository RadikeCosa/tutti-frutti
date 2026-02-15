// Este archivo fue generado manualmente para tipado inicial de Supabase.
// Reemplaza por el generado por supabase si cambias el esquema.

import type { SalaEstado, RondaEstado } from "@/lib/constants/game";
export type { SalaEstado, RondaEstado } from "@/lib/constants/game";

export interface Sala {
  readonly id: string; // uuid
  readonly codigo_invitacion: string;
  readonly organizador_id: string;
  readonly categorias: string[];
  readonly estado: SalaEstado;
  readonly created_at: string;
}

export interface Jugador {
  readonly id: string; // uuid
  readonly sala_id: string;
  readonly nombre: string;
  readonly es_organizador: boolean;
  readonly listo: boolean;
  readonly puntos_acumulados: number;
  readonly created_at: string;
}

export interface Database {
  public: {
    Tables: {
      salas: {
        Row: Sala;
        Insert: {
          codigo_invitacion: string;
          organizador_id: string;
          categorias: string[];
          estado?: SalaEstado;
        };
        Update: Partial<Omit<Sala, "id" | "created_at">>;
      };
      jugadores: {
        Row: Jugador;
        Insert: {
          sala_id: string;
          nombre: string;
          es_organizador?: boolean;
        };
        Update: Partial<Omit<Jugador, "id" | "created_at">>;
      };
      rondas: {
        Row: Ronda;
        Insert: {
          sala_id: string;
          numero_ronda: number;
          letra: string;
          estado: RondaEstado;
        };
        Update: Partial<Omit<Ronda, "id" | "created_at">>;
      };
      categorias_sugeridas: {
        Row: {
          readonly id: string;
          readonly nombre: string;
          readonly creador_id: string;
          readonly created_at: string;
        };
        Insert: {
          nombre: string;
          creador_id: string;
        };
        Update: Partial<
          Omit<
            {
              id: string;
              nombre: string;
              creador_id: string;
              created_at: string;
            },
            "id" | "created_at"
          >
        >;
      };
    };
  };
}

export interface Ronda {
  readonly id: string;
  readonly sala_id: string;
  readonly numero_ronda: number;
  readonly letra: string;
  readonly estado: RondaEstado;
  readonly created_at: string;
}

// --- Tipos helper para responses comunes ---

/**
 * Sala con jugadores anidados
 */
export type SalaWithJugadores = Sala & {
  readonly jugadores: readonly Jugador[];
};

/**
 * Ronda con respuestas anidadas
 */
export interface Respuesta {
  readonly id: string;
  readonly ronda_id: string;
  readonly jugador_id: string;
  readonly categoria: string;
  readonly respuesta: string;
  readonly valida: boolean | null;
  readonly puntaje: number | null;
  readonly created_at: string;
}

export type RondaWithRespuestas = Ronda & {
  readonly respuestas: readonly Respuesta[];
};

// --- Utility types para responses y acciones ---

/** Resultado de un select simple (puede ser null) */
export type SelectResult<T> = T | null;

/** Resultado de un select array */
export type SelectArrayResult<T> = readonly T[];

/** Resultado de una mutación Supabase */
export type MutationResult<T> = {
  readonly data: T | null;
  readonly error: Error | null;
};

/** Resultado estándar para Server Actions */
export type ActionResult<T = void> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

// --- Type guards para validación runtime ---

/**
 * Valida si un valor es un objeto no nulo
 */
function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

/**
 * Valida si un valor es de tipo Sala
 * @param data Valor a validar
 */
export function isSala(data: unknown): data is Sala {
  return (
    isObject(data) &&
    typeof data.id === "string" &&
    typeof data.codigo_invitacion === "string" &&
    typeof data.organizador_id === "string" &&
    Array.isArray(data.categorias) &&
    typeof data.estado === "string" &&
    typeof data.created_at === "string"
  );
}

/**
 * Valida si un valor es de tipo Jugador
 * @param data Valor a validar
 */
export function isJugador(data: unknown): data is Jugador {
  return (
    isObject(data) &&
    typeof data.id === "string" &&
    typeof data.sala_id === "string" &&
    typeof data.nombre === "string" &&
    typeof data.es_organizador === "boolean" &&
    typeof data.listo === "boolean" &&
    typeof data.puntos_acumulados === "number" &&
    typeof data.created_at === "string"
  );
}

/**
 * Valida si un valor es de tipo Ronda
 * @param data Valor a validar
 */
export function isRonda(data: unknown): data is Ronda {
  return (
    isObject(data) &&
    typeof data.id === "string" &&
    typeof data.sala_id === "string" &&
    typeof data.numero_ronda === "number" &&
    typeof data.letra === "string" &&
    typeof data.estado === "string" &&
    typeof data.created_at === "string"
  );
}

/**
 * Valida si un valor es de tipo Respuesta
 * @param data Valor a validar
 */
export function isRespuesta(data: unknown): data is Respuesta {
  return (
    isObject(data) &&
    typeof data.id === "string" &&
    typeof data.ronda_id === "string" &&
    typeof data.jugador_id === "string" &&
    typeof data.categoria === "string" &&
    typeof data.respuesta === "string" &&
    (typeof data.valida === "boolean" || data.valida === null) &&
    (typeof data.puntaje === "number" || data.puntaje === null) &&
    typeof data.created_at === "string"
  );
}
