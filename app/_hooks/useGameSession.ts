import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * useGameSession
 * Hook para obtener y persistir el jugadorId desde searchParams o localStorage.
 * Prioridad: searchParams > localStorage > null.
 *
 * @returns { jugadorId: string | null, isLoading: boolean }
 *
 * @example
 * const { jugadorId, isLoading } = useGameSession();
 * if (isLoading) return <div>Cargando sesión...</div>;
 * if (!jugadorId) return <div>No se encontró tu sesión</div>;
 */
export function useGameSession(): {
  readonly jugadorId: string | null;
  readonly isLoading: boolean;
} {
  const searchParams = useSearchParams();
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === "undefined") return;
    const param = searchParams.get("jugadorId");
    const stored = localStorage.getItem("jugadorId");
    if (param) {
      setJugadorId(param);
      localStorage.setItem("jugadorId", param);
      setIsLoading(false);
    } else if (stored) {
      setJugadorId(stored);
      setIsLoading(false);
    } else {
      setJugadorId(null);
      setIsLoading(false);
    }
    // searchParams no es reactivo, pero el hook se reejecuta en navegación
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return { jugadorId, isLoading };
}
