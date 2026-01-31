// app/juego/[salaId]/page.tsx
"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { guardarRespuestas, terminarRonda } from "@/app/actions";
import type { SalaEstado } from "@/types/supabase";

interface JuegoPageProps {
  params: Promise<{ salaId: string }>;
}

interface Ronda {
  id: string;
  letra: string;
  estado: string;
}

interface Jugador {
  id: string;
  nombre: string;
  es_organizador: boolean;
  listo: boolean;
}

export default function JuegoPage({ params }: JuegoPageProps) {
  const { salaId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [sala, setSala] = useState<{
    id: string;
    categorias: string[];
    estado: SalaEstado;
    organizador_id: string;
  } | null>(null);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<string[]>(["", "", "", "", ""]);
  const [listo, setListo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Obtener jugadorId de searchParams o localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = searchParams.get("jugadorId");
    const stored = localStorage.getItem("jugadorId");
    if (param) {
      setJugadorId(param);
      localStorage.setItem("jugadorId", param);
    } else if (stored) {
      setJugadorId(stored);
    } else {
      setJugadorId(null);
    }
  }, [searchParams]);

  // Obtener sala, ronda y jugadores
  useEffect(() => {
    async function fetchSalaRondaJugadores() {
      setLoading(true);

      // Sala
      const { data: salaData } = await supabase
        .from("salas")
        .select("id, categorias, estado, organizador_id")
        .eq("id", salaId)
        .single();

      if (!salaData) {
        router.replace(`/?error=SalaNoEncontrada`);
        return;
      }
      setSala(salaData);
      if (salaData.estado === "lobby") {
        router.replace(
          `/lobby/${salaId}?jugadorId=${localStorage.getItem("jugadorId") || ""}`,
        );
        return;
      }

      // Ronda actual
      const { data: rondaData } = await supabase
        .from("rondas")
        .select("id, letra, estado")
        .eq("sala_id", salaId)
        .order("numero_ronda", { ascending: false })
        .limit(1)
        .single();

      if (!rondaData) {
        setError("Ronda no encontrada");
        setLoading(false);
        return;
      }
      setRonda(rondaData);

      // Jugadores
      const { data: jugadoresData } = await supabase
        .from("jugadores")
        .select("id, nombre, es_organizador, listo")
        .eq("sala_id", salaId)
        .order("created_at", { ascending: true });

      setJugadores(jugadoresData || []);
      setLoading(false);
    }

    fetchSalaRondaJugadores();
  }, [salaId, supabase]);

  // Realtime subscripciones
  useEffect(() => {
    if (!salaId || !ronda?.id) return;

    // Jugadores
    const jugadoresSub = supabase
      .channel(`jugadores-sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jugadores",
          filter: `sala_id=eq.${salaId}`,
        },
        async () => {
          const { data } = await supabase
            .from("jugadores")
            .select("id, nombre, es_organizador, listo")
            .eq("sala_id", salaId)
            .order("created_at", { ascending: true });
          setJugadores(data || []);
        },
      )
      .subscribe();

    // Ronda
    const rondaSub = supabase
      .channel(`ronda-${ronda.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rondas",
          filter: `id=eq.${ronda.id}`,
        },
        (payload: { new: { estado: string } }) => {
          setRonda((prev) => (prev ? { ...prev, ...payload.new } : prev));
          if (payload.new.estado === "puntuando") {
            const yo = jugadores.find((j) => j.id === jugadorId);
            if (yo?.es_organizador) {
              router.push(`/puntuar/${salaId}/${ronda.id}`);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jugadoresSub);
      supabase.removeChannel(rondaSub);
    };
  }, [salaId, ronda?.id, router, supabase, jugadores, jugadorId]);

  // Contador de listos
  const listos = jugadores.filter((j) => j.listo).length;
  const total = jugadores.length;
  const yo = jugadores.find((j) => j.id === jugadorId) || null;
  const esOrganizador = yo?.es_organizador;

  // Handlers
  function handleRespuesta(idx: number, value: string) {
    setRespuestas((prev) => prev.map((r, i) => (i === idx ? value : r)));
  }

  async function handleListo() {
    if (!yo) {
      setError(
        "No se encontró tu jugador. Refresca la página o vuelve a unirte.",
      );
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await guardarRespuestas({
        salaId,
        rondaId: ronda!.id,
        jugadorId: yo.id,
        respuestas,
        categorias: sala!.categorias,
      });
      setListo(true);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error("Error desconocido");
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleTerminarRonda() {
    setEnviando(true);
    setError(null);

    try {
      await terminarRonda({ rondaId: ronda!.id });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error("Error desconocido");
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
            <div className="h-16 bg-gray-200 rounded mb-4" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!jugadorId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            No se encontró tu jugador. Vuelve a unirte a la sala.
          </h2>
        </div>
      </main>
    );
  }

  if (error && (!sala || !ronda)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
        </div>
      </main>
    );
  }

  if (!sala || !ronda) return null;

  // Si la ronda está en puntuando y no soy organizador, mostrar mensaje de espera
  if (ronda.estado === "puntuando" && !esOrganizador) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            Esperando puntuación del organizador...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-medium">Letra de la ronda</div>
          <div className="text-5xl font-mono tracking-widest bg-yellow-100 rounded px-6 py-4 select-all">
            {ronda.letra}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold mb-3">Tus respuestas</div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleListo();
            }}
          >
            {sala.categorias.map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <label className="text-sm font-medium">{cat}</label>
                <input
                  type="text"
                  value={respuestas[idx]}
                  onChange={(e) => handleRespuesta(idx, e.target.value)}
                  maxLength={30}
                  disabled={listo}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  placeholder={`Respuesta para ${cat}`}
                />
              </div>
            ))}

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600 text-sm transition-all duration-300">
                <span className={listos !== total ? "animate-pulse" : ""}>
                  {listos} de {total} listos
                </span>
              </span>
              <button
                type="submit"
                className={`bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed ${listo ? "animate-bounce" : ""}`}
                disabled={listo || enviando}
              >
                {listo ? "Esperando..." : "Listo"}
              </button>
            </div>

            {esOrganizador && (
              <button
                type="button"
                className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded hover:bg-yellow-600 transition mt-2"
                onClick={handleTerminarRonda}
                disabled={enviando}
              >
                Terminar ronda
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
