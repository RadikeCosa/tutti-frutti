// app/resultados/[salaId]/[rondaId]/page.tsx
"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

import { nuevaRonda, finalizarJuego } from "@/app/actions";
import type { Ronda } from "@/types/supabase";

interface ResultadoRonda {
  jugadorId: string;
  nombre: string;
  respuestas: Array<{
    categoria: string;
    texto: string;
    puntos: number;
  }>;
  totalRonda: number;
}

interface PuntajeAcumulado {
  jugadorId: string;
  nombre: string;
  totalAcumulado: number;
}

interface ResultadosPageProps {
  params: Promise<{ salaId: string; rondaId: string }>;
}

export default function ResultadosPage({ params }: ResultadosPageProps) {
  const router = useRouter();
  const { salaId, rondaId } = use(params);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [resultados, setResultados] = useState<ResultadoRonda[]>([]);
  const [puntajesAcumulados, setPuntajesAcumulados] = useState<
    PuntajeAcumulado[]
  >([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [numeroRonda, setNumeroRonda] = useState<number>(0);
  const [esOrganizador, setEsOrganizador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

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

    async function fetchResultados() {
      if (!jugadorId) {
        setError("No se encontró el jugadorId.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Obtener sala y categorías
        const { data: sala, error: salaError } = await supabase
          .from("salas")
          .select("categorias")
          .eq("id", salaId)
          .single();

        if (salaError || !sala) {
          throw salaError || new Error("Sala no encontrada");
        }
        setCategorias(sala.categorias);

        // Obtener número de ronda
        const { data: ronda, error: rondaError } = await supabase
          .from("rondas")
          .select("*")
          .eq("id", rondaId)
          .single<Ronda>();

        if (rondaError || !ronda) {
          throw rondaError || new Error("Ronda no encontrada");
        }
        setNumeroRonda(ronda.numero_ronda);

        // Obtener jugadores
        const { data: jugadores, error: jugadoresError } = await supabase
          .from("jugadores")
          .select("id, nombre, es_organizador")
          .eq("sala_id", salaId);

        if (jugadoresError || !jugadores) {
          throw jugadoresError || new Error("No se pudieron obtener jugadores");
        }

        // Verificar si el jugador es organizador
        const yo = jugadores.find((j) => j.id === jugadorId);
        setEsOrganizador(!!yo?.es_organizador);

        // Obtener respuestas de la ronda actual
        const { data: respuestas, error: respError } = await supabase
          .from("respuestas")
          .select("id, texto, puntos, categoria_index, jugador_id")
          .eq("ronda_id", rondaId);

        if (respError) {
          throw respError;
        }

        // Agrupar por jugador
        const resultadosPorJugador: Record<string, ResultadoRonda> = {};

        for (const jugador of jugadores) {
          resultadosPorJugador[jugador.id] = {
            jugadorId: jugador.id,
            nombre: jugador.nombre,
            respuestas: Array(5)
              .fill(null)
              .map((_, idx) => ({
                categoria: sala.categorias[idx] || `Cat ${idx + 1}`,
                texto: "",
                puntos: 0,
              })),
            totalRonda: 0,
          };
        }

        for (const r of respuestas || []) {
          const jugadorIdR = r.jugador_id;
          if (resultadosPorJugador[jugadorIdR]) {
            resultadosPorJugador[jugadorIdR].respuestas[r.categoria_index] = {
              categoria:
                sala.categorias[r.categoria_index] ||
                `Cat ${r.categoria_index + 1}`,
              texto: r.texto || "",
              puntos: r.puntos ?? 0,
            };
            resultadosPorJugador[jugadorIdR].totalRonda += r.puntos ?? 0;
          }
        }

        setResultados(Object.values(resultadosPorJugador));

        // Obtener todas las rondas de la sala
        const { data: todasRondas, error: rondasError } = await supabase
          .from("rondas")
          .select("id")
          .eq("sala_id", salaId);

        if (rondasError || !todasRondas) {
          throw rondasError || new Error("No se pudieron obtener rondas");
        }

        // todasRondas: { id: string }[]
        const idsRondas = todasRondas.map((r: { id: string }) => r.id);

        // Obtener todas las respuestas de todas las rondas
        const { data: todasRespuestas, error: todasRespError } = await supabase
          .from("respuestas")
          .select("jugador_id, puntos")
          .in("ronda_id", idsRondas);

        if (todasRespError) {
          throw todasRespError;
        }

        // Calcular acumulados
        const acumulados: Record<string, PuntajeAcumulado> = {};

        for (const jugador of jugadores) {
          acumulados[jugador.id] = {
            jugadorId: jugador.id,
            nombre: jugador.nombre,
            totalAcumulado: 0,
          };
        }

        for (const r of todasRespuestas || []) {
          if (acumulados[r.jugador_id]) {
            acumulados[r.jugador_id].totalAcumulado += r.puntos ?? 0;
          }
        }

        setPuntajesAcumulados(
          Object.values(acumulados).sort(
            (a, b) => b.totalAcumulado - a.totalAcumulado,
          ),
        );
      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error("Error inesperado");
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResultados();

    // Suscripción realtime a respuestas de la ronda actual
    channel = supabase
      .channel(`respuestas_ronda_${rondaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "respuestas",
          filter: `ronda_id=eq.${rondaId}`,
        },
        () => {
          fetchResultados();
        },
      )
      .subscribe();

    // Suscripción realtime a la tabla de rondas para detectar nueva ronda
    rondaChannel = supabase
      .channel(`resultados-rondas-sala-${salaId}`)
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
      .subscribe();

    // Suscripción realtime a la tabla de salas para detectar cambio de estado global
    salaChannel = supabase
      .channel(`resultados-sala-estado-${salaId}`)
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
          // Si el estado de la sala es "finalizada", redirigir a /ranking/[salaId]
          if (payload.new && payload.new.estado === "finalizada") {
            router.replace(`/ranking/${salaId}`);
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

  const handleNuevaRonda = async () => {
    if (!jugadorId) {
      setError("No se encontró tu sesión");
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      await nuevaRonda({ salaId, jugadorId });
    } catch (e: unknown) {
      const error =
        e instanceof Error ? e : new Error("Error al crear nueva ronda");
      setError(error.message);
      setProcesando(false);
    }
  };

  const handleFinalizarJuego = async () => {
    if (!jugadorId) {
      setError("No se encontró tu sesión");
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      await finalizarJuego({ salaId, jugadorId });
    } catch (e: unknown) {
      const error =
        e instanceof Error ? e : new Error("Error al finalizar juego");
      setError(error.message);
      setProcesando(false);
    }
  };

  if (loading || !jugadorId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">Cargando...</div>
      </main>
    );
  }

  if (error && !resultados.length) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{error}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Resultados - Ronda {numeroRonda}
        </h2>

        {/* Tabla de resultados de la ronda */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <h3 className="text-xl font-semibold p-4 bg-gray-100">
            Resultados de esta ronda
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-semibold">
                    Jugador
                  </th>
                  {categorias.map((cat, idx) => (
                    <th
                      key={idx}
                      className="border-b px-4 py-3 text-center font-semibold"
                    >
                      {cat}
                    </th>
                  ))}
                  <th className="border-b px-4 py-3 text-center font-semibold bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((res) => (
                  <tr key={res.jugadorId} className="hover:bg-gray-50">
                    <td className="border-b px-4 py-3 font-semibold">
                      {res.nombre}
                    </td>
                    {res.respuestas.map((r, idx) => (
                      <td key={idx} className="border-b px-4 py-3 text-center">
                        <div className="text-sm">
                          {r?.texto || (
                            <span className="italic text-gray-400">-</span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-blue-600">
                          {typeof r?.puntos === "number" ? (
                            `${r.puntos} pts`
                          ) : (
                            <span className="italic text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="border-b px-4 py-3 text-center font-bold text-lg bg-blue-50">
                      {res.totalRonda}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de puntajes acumulados */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <h3 className="text-xl font-semibold p-4 bg-gray-100">
            Puntajes acumulados
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-3 text-center font-semibold w-24">
                    Pos.
                  </th>
                  <th className="border-b px-4 py-3 text-left font-semibold">
                    Jugador
                  </th>
                  <th className="border-b px-4 py-3 text-center font-semibold">
                    Puntaje Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {puntajesAcumulados.map((p, idx) => (
                  <tr
                    key={p.jugadorId}
                    className={`hover:bg-gray-50 ${
                      idx === 0 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="border-b px-4 py-3 text-center font-bold text-lg">
                      {idx + 1}°
                    </td>
                    <td className="border-b px-4 py-3 font-semibold">
                      {p.nombre}
                      {idx === 0 && (
                        <span className="ml-2 text-yellow-500">👑</span>
                      )}
                    </td>
                    <td className="border-b px-4 py-3 text-center font-bold text-lg">
                      {p.totalAcumulado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones de acción */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-center">
            {error}
          </div>
        )}

        {esOrganizador ? (
          <div className="flex gap-4 justify-center">
            <button
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNuevaRonda}
              disabled={procesando}
            >
              {procesando ? "Procesando..." : "Nueva Ronda"}
            </button>
            <button
              className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleFinalizarJuego}
              disabled={procesando}
            >
              {procesando ? "Procesando..." : "Finalizar Juego"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
