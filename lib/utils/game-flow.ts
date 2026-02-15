/**
 * Determina el path de redirección correcto según el estado de la sala, ronda y rol del jugador.
 *
 * Reglas de transición:
 * - lobby: Todos van a /lobby/[salaId]?jugadorId=...
 * - escribiendo: Todos permanecen en /juego/[salaId]
 * - puntuando: Organizador va a /puntuar/[salaId]/[rondaId], resto a /resultados/[salaId]/[rondaId]?jugadorId=...
 * - resultado_ronda: Todos van a /resultados/[salaId]/[rondaId]?jugadorId=...
 * - finalizada: Todos van a /ranking/[salaId]
 *
 * @param estadoSala Estado actual de la sala
 * @param estadoRonda Estado actual de la ronda
 * @param esOrganizador Si el jugador es organizador
 * @param salaId Id de la sala
 * @param rondaId Id de la ronda (opcional, requerido para ciertas rutas)
 * @param jugadorId Id del jugador (opcional, requerido para ciertas rutas)
 * @returns string | null - Path de redirección o null si no aplica
 */
export function validateGameStateTransition(
  estadoSala: string,
  estadoRonda: string | null,
  esOrganizador: boolean,
  salaId: string,
  rondaId?: string,
  jugadorId?: string,
): string | null {
  switch (estadoSala) {
    case "lobby":
      return `/lobby/${salaId}${jugadorId ? `?jugadorId=${jugadorId}` : ""}`;
    case "jugando":
      if (estadoRonda === "puntuando") {
        if (esOrganizador && rondaId) {
          return `/puntuar/${salaId}/${rondaId}`;
        } else if (rondaId && jugadorId) {
          return `/resultados/${salaId}/${rondaId}?jugadorId=${jugadorId}`;
        }
      }
      // Si está escribiendo, permanece en juego
      return null;
    case "resultado_ronda":
      if (rondaId && jugadorId) {
        return `/resultados/${salaId}/${rondaId}?jugadorId=${jugadorId}`;
      }
      return null;
    case "finalizada":
      return `/ranking/${salaId}`;
    default:
      return null;
  }
}
