"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { asignarPuntos, finalizarPuntuacion } from "@/app/actions";

interface Sala {
  readonly categorias: readonly string[];
}

interface Respuesta {
  readonly id: string;
  readonly texto: string;
  readonly jugador_id: string;
  readonly categoria_index: number;
}

type RespuestasPorCategoria = Record<number, Respuesta[]>;
type PuntosAsignados = Record<string, number>;

interface PuntuarPageProps {
  params: Promise<{ salaId: string; rondaId: string }>;
}

export default function PuntuarPage({ params }: PuntuarPageProps) {
  const router = useRouter();
  const { salaId, rondaId } = use(params);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [sala, setSala] = useState<Sala | null>(null);
  const [respuestasPorCategoria, setRespuestasPorCategoria] =
    useState<RespuestasPorCategoria>({});
  const [categoriaActual, setCategoriaActual] = useState(0);
  const [puntosAsignados, setPuntosAsignados] = useState<PuntosAsignados>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Obtener jugadorId de searchParams o localStorage
  const jugadorId = useMemo(() => {
    if (typeof window === "undefined") return null;

    const param = searchParams.get("jugadorId");
    const stored = localStorage.getItem("jugadorId");

    if (param) {
      localStorage.setItem("jugadorId", param);
      return param;
    }
    return stored;
  }, [searchParams]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let rondaChannel: ReturnType<typeof supabase.channel> | null = null;
    let salaChannel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchData() {
      if (!jugadorId) {
        setError("No se encontró el jugadorId.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Obtener sala
        const { data: salaData, error: salaError } = await supabase
          .from("salas")
          .select("categorias")
          .eq("id", salaId)
          .single();

        if (salaError || !salaData) {
          throw salaError || new Error("Sala no encontrada");
        }
        setSala(salaData);

        // Validar organizador
        const { data: jugador, error: jugadorError } = await supabase
          .from("jugadores")
          .select("id, es_organizador")
          .eq("id", jugadorId)
          .eq("sala_id", salaId)
          .single();

        if (jugadorError || !jugador) {
          throw jugadorError || new Error("Jugador no encontrado");
        }

        if (!jugador.es_organizador) {
          setError("Solo el organizador puede puntuar.");
          setLoading(false);
          return;
        }

        // Obtener respuestas
        const { data: respuestas, error: respError } = await supabase
          .from("respuestas")
          .select("id, texto, jugador_id, categoria_index")
          .eq("ronda_id", rondaId)
          .order("categoria_index", { ascending: true })
          .order("id", { ascending: true });

        if (respError || !respuestas) {
          throw respError || new Error("No se pudieron obtener respuestas");
        }

        // Agrupar por categoria_index
        const agrupadas: RespuestasPorCategoria = {};
        for (const r of respuestas) {
          if (!agrupadas[r.categoria_index]) {
            agrupadas[r.categoria_index] = [];
          }
          agrupadas[r.categoria_index].push(r);
        }
        setRespuestasPorCategoria(agrupadas);
      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error("Error inesperado");
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Suscripción realtime a respuestas de la ronda actual (por si otro organizador edita o para futuras mejoras)
    channel = supabase
      .channel(`puntuar_respuestas_ronda_${rondaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "respuestas",
          filter: `ronda_id=eq.${rondaId}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    // Suscripción realtime a la tabla de rondas para detectar nueva ronda
    rondaChannel = supabase
      .channel(`rondas-sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rondas",
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          // Si se crea una nueva ronda, redirigir a /juego/[salaId]
          router.replace(`/juego/${salaId}`);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rondas",
          filter: `id=eq.${rondaId}`,
        },
        () => {
          // Si la ronda actual se elimina, redirigir a /juego/[salaId]
          router.replace(`/juego/${salaId}`);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rondas",
          filter: `id=eq.${rondaId}`,
        },
        (payload) => {
          // Si el estado de la ronda deja de ser 'puntuando', redirigir a /juego/[salaId]
          if (payload.new && payload.new.estado !== "puntuando") {
            router.replace(`/juego/${salaId}`);
          }
        },
      )
      .subscribe();

    // Suscripción realtime a la tabla de salas para detectar cambio de estado global
    salaChannel = supabase
      .channel(`sala-estado-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "salas",
          filter: `id=eq.${salaId}`,
        },
        (payload) => {
          // Si el estado de la sala es "jugando", redirigir a /juego/[salaId]
          if (payload.new && payload.new.estado === "jugando") {
            router.replace(`/juego/${salaId}`);
          }
        },
      )
      .subscribe();

    return () => {
      if (channel) channel.unsubscribe();
      if (rondaChannel) rondaChannel.unsubscribe();
      if (salaChannel) salaChannel.unsubscribe();
    };
  }, [salaId, rondaId, jugadorId, supabase, router]);

  const handlePuntosChange = (respuestaId: string, puntos: number) => {
    setPuntosAsignados((prev) => ({ ...prev, [respuestaId]: puntos }));
  };

  const handleSiguiente = async () => {
    if (!jugadorId) {
      setError("No se encontró tu sesión");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const puntosArray = respuestasActual.map((resp) => ({
        respuestaId: resp.id,
        puntos: puntosAsignados[resp.id] ?? 0,
        jugadorId,
      }));
      await asignarPuntos(puntosArray);
      if (!esUltima) {
        setCategoriaActual((prev) => prev + 1);
      } else {
        await finalizarPuntuacion({ salaId, rondaId, jugadorId });
      }
    } catch (e: unknown) {
      const error =
        e instanceof Error ? e : new Error("Error al asignar puntos");
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading || !jugadorId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">Cargando...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
        </div>
      </main>
    );
  }

  if (!sala) return null;

  const respuestasActual = respuestasPorCategoria[categoriaActual] || [];
  const categoriaNombre = sala.categorias[categoriaActual] || "";
  const esUltima = categoriaActual === sala.categorias.length - 1;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Categoría {categoriaActual + 1}/5:{" "}
          <span className="text-blue-600">{categoriaNombre}</span>
        </h2>

        <div className="space-y-4 mb-6">
          {respuestasActual.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No hay respuestas para esta categoría
            </p>
          ) : (
            respuestasActual.map((resp) => (
              <div
                key={resp.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded"
              >
                <span className="flex-1 font-medium">
                  {resp.texto || (
                    <span className="italic text-gray-400">(vacía)</span>
                  )}
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-20 border border-gray-300 rounded px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={puntosAsignados[resp.id] ?? 0}
                  onChange={(e) =>
                    handlePuntosChange(resp.id, Number(e.target.value))
                  }
                  disabled={enviando}
                />
                <span className="text-sm text-gray-500 w-12">pts</span>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSiguiente}
          disabled={enviando}
        >
          {enviando
            ? "Guardando..."
            : esUltima
              ? "Finalizar Puntuación"
              : "Siguiente Categoría"}
        </button>
      </div>
    </main>
  );
}
