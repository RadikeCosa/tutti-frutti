// Este archivo fue generado manualmente para tipado inicial de Supabase.
// Reemplaza por el generado por supabase si cambias el esquema.

export type SalaEstado =
  | "lobby"
  | "jugando"
  | "puntuando"
  | "resultado_ronda"
  | "finalizada";

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
    };
  };
}
