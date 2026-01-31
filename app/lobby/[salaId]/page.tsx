// app/lobby/[salaId]/page.tsx
"use client";
import { use, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { iniciarJuego } from "@/app/actions";
import type { SalaEstado } from "@/types/supabase";
import "./lobby-animations.css";

type JugadorData = { id: string; nombre: string; es_organizador: boolean };

interface LobbyPageProps {
  params: Promise<{ salaId: string }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { salaId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserClient(), []);

  // Obtener jugadorId de searchParams o localStorage (sin useEffect)
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

  const [sala, setSala] = useState<{
    id: string;
    codigo_invitacion: string;
    categorias: string[];
    estado: SalaEstado;
    organizador_id: string;
  } | null>(null);

  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [categorias, setCategorias] = useState<string[]>(["", "", "", "", ""]);
  const [isOrganizador, setIsOrganizador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // Obtener sala y jugadores al montar
  useEffect(() => {
    if (!jugadorId) return;

    async function fetchSalaYJugadores() {
      setLoading(true);

      const { data: salaData } = await supabase
        .from("salas")
        .select("id, codigo_invitacion, categorias, estado, organizador_id")
        .eq("id", salaId)
        .single();

      if (!salaData) {
        // Redirigir a home con mensaje si la sala no existe
        router.replace(`/?error=SalaNoEncontrada`);
        return;
      }

      setSala(salaData);
      setCategorias(
        salaData.categorias?.length === 5
          ? salaData.categorias
          : ["", "", "", "", ""],
      );

      // Obtener jugadores
      const { data: jugadoresData } = await supabase
        .from("jugadores")
        .select("id, nombre, es_organizador")
        .eq("sala_id", salaId)
        .order("created_at", { ascending: true });

      setJugadores(jugadoresData || []);

      // Verificar si soy organizador
      const yo = (jugadoresData || []).find(
        (j: JugadorData) => j.id === jugadorId,
      );
      setIsOrganizador(!!yo?.es_organizador);

      setLoading(false);
    }

    fetchSalaYJugadores();
  }, [salaId, jugadorId, supabase]);

  // Realtime subscripciones
  useEffect(() => {
    if (!salaId) return;

    const jugadoresSub = supabase
      .channel(`jugadores-sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jugadores",
          filter: `sala_id=eq.${salaId}`,
        },
        async () => {
          const { data } = await supabase
            .from("jugadores")
            .select("id, nombre, es_organizador")
            .eq("sala_id", salaId)
            .order("created_at", { ascending: true });
          setJugadores(data || []);
        },
      )
      .subscribe();

    const salaSub = supabase
      .channel(`sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "salas",
          filter: `id=eq.${salaId}`,
        },
        (payload: { new: unknown }) => {
          type SalaUpdate = { estado: SalaEstado; [key: string]: unknown };
          const newSala = payload.new as SalaUpdate;
          setSala((prev) => {
            if (!prev) return prev;
            return { ...prev, ...newSala };
          });

          if (newSala.estado === "jugando") {
            router.push(`/juego/${salaId}?jugadorId=${jugadorId}`);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jugadoresSub);
      supabase.removeChannel(salaSub);
    };
  }, [salaId, router, supabase, jugadorId]);

  function handleCategoriaChange(idx: number, value: string) {
    setCategorias((prev) => prev.map((cat, i) => (i === idx ? value : cat)));
  }

  async function handleIniciarJuego(e: React.FormEvent) {
    e.preventDefault();
    setIniciando(true);
    setError(null);

    if (jugadores.length < 2) {
      setError("Se requieren al menos 2 jugadores");
      setIniciando(false);
      return;
    }

    if (categorias.some((c) => !c.trim())) {
      setError("Completa las 5 categorías");
      setIniciando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("salaId", salaId);
      formData.append("categorias", JSON.stringify(categorias));

      await iniciarJuego(formData);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error("Error desconocido");
      setError(error.message || "Error al iniciar juego");
      setIniciando(false);
    }
  }

  if (loading || !jugadorId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">Cargando...</div>
      </main>
    );
  }

  if (!sala) return null;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-medium">Código de invitación</div>
          <div className="text-3xl font-mono tracking-widest bg-gray-100 rounded px-4 py-2 select-all">
            {sala.codigo_invitacion}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold mb-3">
            Jugadores ({jugadores.length})
          </div>
          <ul className="flex flex-col gap-2 transition-all duration-500">
            {jugadores.map((j) => (
              <li
                key={j.id}
                className="flex items-center gap-2 bg-white rounded transition-all duration-300 shadow-sm animate-fadein"
                style={{
                  animationDelay: `${jugadores.findIndex((jg) => jg.id === j.id) * 60}ms`,
                }}
              >
                <span>{j.nombre}</span>
                {j.es_organizador && (
                  <span className="text-xs bg-blue-200 text-blue-800 rounded px-2 py-0.5">
                    Organizador
                  </span>
                )}
              </li>
            ))}
          </ul>
          // Animación fadein para la lista de jugadores import
          "./lobby-animations.css";
        </div>

        {isOrganizador && (
          <form
            className="flex flex-col gap-4 bg-white rounded-lg shadow p-6"
            onSubmit={handleIniciarJuego}
          >
            <div className="font-semibold mb-2">Configurar categorías</div>
            {categorias.map((cat, idx) => (
              <input
                key={idx}
                type="text"
                value={cat}
                onChange={(e) => handleCategoriaChange(idx, e.target.value)}
                maxLength={30}
                required
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`Categoría ${idx + 1}`}
              />
            ))}

            {error && sala && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={iniciando || categorias.some((c) => !c.trim())}
            >
              {iniciando ? "Iniciando..." : "Iniciar Juego"}
            </button>
          </form>
        )}

        {!isOrganizador && (
          <div className="text-center text-gray-600">
            Esperando que el organizador inicie el juego...
          </div>
        )}
      </div>
    </main>
  );
}
