"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { guardarRespuestas, terminarRonda } from "@/app/actions";
import { GAME_CONFIG } from "@/lib/constants/game";
import { useGameSession } from "@/app/_hooks/useGameSession";
import type { SalaEstado, Ronda, RondaEstado } from "@/types/supabase";
import { ErrorBoundary } from "@/app/_components/ui/ErrorBoundary";
import LoadingSpinner from "@/app/_components/ui/LoadingSpinner";

interface JuegoPageProps {
  params: Promise<{ salaId: string }>;
}

// Se usa el tipo Ronda importado

interface Jugador {
  id: string;
  nombre: string;
  es_organizador: boolean;
  listo: boolean;
}

export default function JuegoPage({ params }: JuegoPageProps) {
  return (
    <ErrorBoundary>
      <JuegoPageInner params={params} />
    </ErrorBoundary>
  );
}

function JuegoPageInner({ params }: JuegoPageProps) {
  const { salaId } = use(params);
  const router = useRouter();
  const { jugadorId, isLoading: isSessionLoading } = useGameSession();
  const supabase = useMemo(() => createBrowserClient(), []);

  // States (todos los hooks van al inicio)
  // Declaraciones únicas de hooks (todas al inicio, sin duplicados)
  const [sala, setSala] = useState<{
    id: string;
    categorias: string[];
    estado: SalaEstado;
    organizador_id: string;
  } | null>(null);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [jugadores, setJugadores] = useState<
    {
      id: string;
      nombre: string;
      es_organizador: boolean;
      listo: boolean;
    }[]
  >([]);
  const [respuestas, setRespuestas] = useState<string[]>(["", "", "", "", ""]);
  const [listo, setListo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [puedeCambiarLetra, setPuedeCambiarLetra] = useState(false);
  const [cambiandoLetra, setCambiandoLetra] = useState(false);
  const [errorLetra, setErrorLetra] = useState<string | null>(null);

  // Control de sesión y loading
  const showSessionLoading = isSessionLoading;
  const showNoSession = !isSessionLoading && !jugadorId;

  // Early returns control variables
  let earlyContent: React.ReactNode = null;
  if (showSessionLoading) {
    earlyContent = (
      <div className="flex min-h-screen items-center justify-center">
        Cargando sesión...
      </div>
    );
  } else if (showNoSession) {
    earlyContent = (
      <div className="flex min-h-screen items-center justify-center">
        No se encontró tu sesión
      </div>
    );
  }

  // useEffect: Ventana de 3 segundos desde que inicia la ronda
  useEffect(() => {
    setPuedeCambiarLetra(false);
    setErrorLetra(null);
    if (ronda && ronda.estado === "escribiendo") {
      setPuedeCambiarLetra(true);
      const timer = setTimeout(
        () => setPuedeCambiarLetra(false),
        GAME_CONFIG.LETTER_CHANGE_WINDOW_MS,
      );
      return () => clearTimeout(timer);
    }
  }, [ronda?.id, ronda?.estado]);

  // useEffect: Reset listo y respuestas cuando cambia la ronda
  useEffect(() => {
    setListo(false);
    setRespuestas(["", "", "", "", ""]);
  }, [ronda?.id]);

  // useEffect: Obtener sala, ronda y jugadores
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
        .select("*")
        .eq("sala_id", salaId)
        .order("numero_ronda", { ascending: false })
        .limit(1)
        .single<Ronda>();

      if (!rondaData) {
        setError("Ronda no encontrada");
        setLoading(false);
        return;
      }
      setRonda(rondaData);

      // Si la ronda ya está puntuando y soy organizador, redirigir
      if (rondaData.estado === "puntuando") {
        const { data: jugadorData } = await supabase
          .from("jugadores")
          .select("es_organizador")
          .eq("id", jugadorId)
          .single();
        if (jugadorData?.es_organizador) {
          router.replace(
            `/puntuar/${salaId}/${rondaData.id}?jugadorId=${jugadorId}`,
          );
          return;
        }
        // Si no es organizador, continuar normal (mostrará mensaje de espera)
      }

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
  }, [salaId, supabase, jugadorId, router]);

  // useEffect: Realtime subscripciones
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
          setRonda((prev) =>
            prev
              ? {
                  ...prev,
                  ...payload.new,
                  estado: payload.new.estado as RondaEstado,
                }
              : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jugadoresSub);
      supabase.removeChannel(rondaSub);
    };
  }, [salaId, ronda?.id, router, supabase]);

  // useEffect: Redirección a puntuar/resultados cuando la ronda pasa a puntuando
  useEffect(() => {
    if (!ronda || ronda.estado !== "puntuando" || !jugadorId) return;
    const yo = jugadores.find((j) => j.id === jugadorId);
    if (yo?.es_organizador) {
      router.replace(`/puntuar/${salaId}/${ronda.id}?jugadorId=${jugadorId}`);
    } else {
      router.replace(
        `/resultados/${salaId}/${ronda.id}?jugadorId=${jugadorId}`,
      );
    }
  }, [ronda?.estado, jugadores, jugadorId, salaId, router]);

  // Handler para cambiar la letra
  async function handleCambiarLetra() {
    const yo = jugadores.find((j) => j.id === jugadorId);
    if (!yo?.id || !ronda?.id || !sala?.id) return;
    setCambiandoLetra(true);
    setErrorLetra(null);
    try {
      const res = await fetch("/api/cambiar-letra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaId: sala.id,
          rondaId: ronda.id,
          jugadorId: yo.id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorLetra(data.error || "No se pudo cambiar la letra");
      }
    } catch {
      setErrorLetra("Error de red");
    } finally {
      setCambiandoLetra(false);
    }
  }

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
    if (!yo?.id) {
      setError("No se encontró tu sesión");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await terminarRonda({ rondaId: ronda!.id, jugadorId: yo.id });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error("Error desconocido");
      setError(error.message);
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return <LoadingSpinner size="fullscreen" message="Cargando juego..." />;
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
    // Redirección a resultados se maneja en useEffect. Mostrar mensaje de espera.
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Esperando redirección a resultados…
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
          <div className="flex items-center gap-2">
            <div className="text-5xl font-mono tracking-widest bg-yellow-100 rounded px-6 py-4 select-all">
              {ronda.letra}
            </div>
            {esOrganizador && puedeCambiarLetra && (
              <button
                type="button"
                className="ml-2 bg-yellow-500 text-white font-semibold px-3 py-2 rounded hover:bg-yellow-600 transition text-base disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCambiarLetra}
                disabled={cambiandoLetra}
                aria-label="Cambiar letra"
              >
                {cambiandoLetra ? "Cambiando..." : "Cambiar letra"}
              </button>
            )}
          </div>
          {errorLetra && (
            <div className="text-red-600 text-xs mt-1">{errorLetra}</div>
          )}
          {esOrganizador && puedeCambiarLetra && (
            <div className="text-xs text-gray-500 mt-1">
              Solo disponible los primeros 3 segundos
            </div>
          )}
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
