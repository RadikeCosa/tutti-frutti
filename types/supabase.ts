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

export type RondaEstado = "escribiendo" | "puntuando" | "finalizada";

export interface Ronda {
  readonly id: string;
  readonly sala_id: string;
  readonly numero_ronda: number;
  readonly letra: string;
  readonly estado: RondaEstado;
  readonly created_at: string;
}
