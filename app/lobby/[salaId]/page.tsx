"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import type { Database, SalaEstado } from "@/types/supabase";

interface LobbyPageProps {
  params: { salaId: string };
}

function randomLetter() {
  const letters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const salaId = params.salaId;
  const router = useRouter();
  const supabase = useRef(createBrowserClient<Database>());

  const [sala, setSala] = useState<{
    id: string;
    codigo_invitacion: string;
    categorias: string[];
    estado: SalaEstado;
    organizador_id: string;
  } | null>(null);
  const [jugadores, setJugadores] = useState<
    Array<{
      id: string;
      nombre: string;
      es_organizador: boolean;
    }>
  >([]);
  const [categorias, setCategorias] = useState<string[]>(["", "", "", "", ""]);
  const [isOrganizador, setIsOrganizador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // Obtener sala y jugadores al montar
  useEffect(() => {
    let ignore = false;
    async function fetchSalaYJugadores() {
      setLoading(true);
      const { data: salaData } = await supabase.current
        .from("salas")
        .select("id, codigo_invitacion, categorias, estado, organizador_id")
        .eq("id", salaId)
        .single();
      if (!salaData) {
        setError("Sala no encontrada");
        setLoading(false);
        return;
      }
      setSala(salaData);
      setCategorias(
        salaData.categorias?.length === 5
          ? salaData.categorias
          : ["", "", "", "", ""],
      );
      // Obtener jugadores
      const { data: jugadoresData } = await supabase.current
        .from("jugadores")
        .select("id, nombre, es_organizador, sala_id")
        .eq("sala_id", salaId);
      setJugadores(jugadoresData || []);
      // ¿Soy organizador? (por cookie localStorage)
      const miId = localStorage.getItem("jugadorId");
      setIsOrganizador(!!miId && miId === salaData.organizador_id);
      setLoading(false);
    }
    fetchSalaYJugadores();
    return () => {
      ignore = true;
    };
  }, [salaId]);

  // Realtime subscripciones
  useEffect(() => {
    if (!salaId) return;
    const jugadoresSub = supabase.current
      .channel(`jugadores-sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jugadores",
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          supabase.current
            .from("jugadores")
            .select("id, nombre, es_organizador, sala_id")
            .eq("sala_id", salaId)
            .then(({ data }) => setJugadores(data || []));
        },
      )
      .subscribe();
    const salaSub = supabase.current
      .channel(`sala-${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "salas",
          filter: `id=eq.${salaId}`,
        },
        (payload) => {
          const newSala = payload.new as any;
          setSala((prev) => (prev ? { ...prev, ...newSala } : newSala));
          if (newSala.estado === "jugando") {
            router.replace(`/juego/${salaId}`);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.current.removeChannel(jugadoresSub);
      supabase.current.removeChannel(salaSub);
    };
  }, [salaId, router]);

  // Handler categorías
  function handleCategoriaChange(idx: number, value: string) {
    setCategorias((prev) => prev.map((cat, i) => (i === idx ? value : cat)));
  }

  // Handler iniciar juego
  async function handleIniciarJuego() {
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
    // Llamar server action
    try {
      const res = await fetch("/lobby/" + salaId + "/actions", {
        method: "POST",
        body: JSON.stringify({ categorias }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al iniciar juego");
    } catch (e: any) {
      setError(e.message);
    }
    setIniciando(false);
  }

  if (loading) {
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
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
        </div>
      </main>
    );
  }
  if (!sala) return null;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-medium">Código de invitación</div>
          <div className="text-3xl font-mono tracking-widest bg-gray-100 rounded px-4 py-2 select-all mb-2">
            {sala.codigo_invitacion}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Jugadores</div>
          <ul className="bg-gray-50 rounded p-4 flex flex-col gap-2">
            {jugadores.map((j) => (
              <li key={j.id} className="flex items-center gap-2">
                <span>{j.nombre}</span>
                {j.es_organizador && (
                  <span className="text-xs bg-blue-200 text-blue-800 rounded px-2 py-0.5 ml-2">
                    Organizador
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {isOrganizador && (
          <form
            className="flex flex-col gap-4 bg-white rounded-lg shadow p-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleIniciarJuego();
            }}
          >
            <div className="font-semibold mb-2">Categorías</div>
            {categorias.map((cat, idx) => (
              <input
                key={idx}
                type="text"
                value={cat}
                onChange={(e) => handleCategoriaChange(idx, e.target.value)}
                maxLength={20}
                required
                className="border border-gray-300 rounded px-3 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`Categoría ${idx + 1}`}
              />
            ))}
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={iniciando || categorias.some((c) => !c.trim())}
            >
              Iniciar Juego
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
