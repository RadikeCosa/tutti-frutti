"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { asignarPuntos, finalizarPuntuacion } from "@/app/actions";
import { useGameSession } from "@/app/_hooks/useGameSession";
import type { Ronda } from "@/types/supabase";

interface Sala {
  readonly categorias: readonly string[];
}

interface Jugador {
  readonly id: string;
  readonly nombre: string;
}

interface Respuesta {
  readonly id: string;
  readonly texto: string;
  readonly jugador_id: string;
  readonly categoria_index: number;
}

type PuntosAsignados = Record<string, number>;

interface PuntuarPageProps {
  params: Promise<{ salaId: string; rondaId: string }>;
}

export default function PuntuarPage({ params }: PuntuarPageProps) {
  const router = useRouter();
  const { salaId, rondaId } = use(params);
  const { jugadorId, isLoading: isSessionLoading } = useGameSession();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [sala, setSala] = useState<Sala | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [puntosAsignados, setPuntosAsignados] = useState<PuntosAsignados>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (isSessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">Cargando sesión...</div>
      </main>
    );
  }
  if (!jugadorId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">No se encontró tu sesión</div>
      </main>
    );
  }

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

        // Obtener jugadores
        const { data: jugadoresData, error: jugadoresError } = await supabase
          .from("jugadores")
          .select("id, nombre")
          .eq("sala_id", salaId)
          .order("nombre", { ascending: true });

        if (jugadoresError || !jugadoresData) {
          throw jugadoresError || new Error("No se pudieron obtener jugadores");
        }
        setJugadores(jugadoresData);

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

        setRespuestas(respuestas);
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
      .channel(`puntuar-rondas-sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rondas",
          filter: `sala_id=eq.${salaId}`,
        },
        () => {
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
          // Si el estado de la ronda deja de ser 'puntuando', redirigir a /resultados/[salaId]/[rondaId]?jugadorId=...
          if (payload.new && payload.new.estado !== "puntuando") {
            const jugadorIdParam =
              localStorage.getItem("jugadorId") || jugadorId || "";
            router.replace(
              `/resultados/${salaId}/${rondaId}?jugadorId=${jugadorIdParam}`,
            );
          }
        },
      )
      .subscribe();

    // Suscripción realtime a la tabla de salas para detectar cambio de estado global
    salaChannel = supabase
      .channel(`puntuar-sala-estado-${salaId}`)
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
      if (channel) supabase.removeChannel(channel);
      if (rondaChannel) supabase.removeChannel(rondaChannel);
      if (salaChannel) supabase.removeChannel(salaChannel);
    };
  }, [salaId, rondaId, jugadorId, supabase, router]);

  const handlePuntosChange = (respuestaId: string, puntos: number) => {
    setPuntosAsignados((prev) => ({ ...prev, [respuestaId]: puntos }));
  };

  const handleFinalizarPuntuacion = async () => {
    if (!jugadorId) {
      setError("No se encontró tu sesión");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      // Recopilar todos los puntos de todas las respuestas
      const puntosArray = respuestas.map((resp) => ({
        respuestaId: resp.id,
        puntos: puntosAsignados[resp.id] ?? 0,
        jugadorId,
      }));

      // Asignar todos los puntos a la vez
      await asignarPuntos(puntosArray);

      // Finalizar puntuación
      await finalizarPuntuacion({ salaId, rondaId, jugadorId });
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

  // Helper function to get respuesta for a specific jugador and categoria
  const getRespuesta = (jugadorId: string, categoriaIndex: number) => {
    return respuestas.find(
      (r) => r.jugador_id === jugadorId && r.categoria_index === categoriaIndex,
    );
  };

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Puntuación - Todas las Categorías
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-center">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-10">
                    Jugador
                  </th>
                  {sala.categorias.map((cat, idx) => (
                    <th
                      key={idx}
                      className="border-b px-4 py-3 text-center font-semibold min-w-[200px]"
                    >
                      {cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jugadores.map((jugador) => (
                  <tr key={jugador.id} className="hover:bg-gray-50">
                    <td className="border-b px-4 py-3 font-semibold sticky left-0 bg-white z-10">
                      {jugador.nombre}
                    </td>
                    {sala.categorias.map((_, categoriaIndex) => {
                      const respuesta = getRespuesta(
                        jugador.id,
                        categoriaIndex,
                      );
                      return (
                        <td key={categoriaIndex} className="border-b px-4 py-3">
                          <div className="space-y-2">
                            <div className="text-sm">
                              {respuesta?.texto || (
                                <span className="italic text-gray-400">
                                  (vacía)
                                </span>
                              )}
                            </div>
                            {respuesta && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  value={puntosAsignados[respuesta.id] ?? 0}
                                  onChange={(e) =>
                                    handlePuntosChange(
                                      respuesta.id,
                                      Number(e.target.value),
                                    )
                                  }
                                  disabled={enviando}
                                />
                                <span className="text-xs text-gray-500">
                                  pts
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleFinalizarPuntuacion}
            disabled={enviando}
          >
            {enviando ? "Guardando..." : "Finalizar Puntuación"}
          </button>
        </div>
      </div>
    </main>
  );
}
