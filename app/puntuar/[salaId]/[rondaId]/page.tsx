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

interface Jugador {
  readonly id: string;
  readonly es_organizador: boolean;
}

type RespuestasPorCategoria = Record<number, Respuesta[]>;

type PuntosAsignados = Record<string, number>;

export default function PuntuarPage({
  params,
}: {
  params: { salaId: string; rondaId: string };
}) {
  const { salaId, rondaId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
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
    let id = searchParams.get("jugadorId");
    if (id) {
      if (typeof window !== "undefined") localStorage.setItem("jugadorId", id);
      return id;
    }
    if (typeof window !== "undefined") {
      id = localStorage.getItem("jugadorId") || undefined;
    }
    return id;
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserClient();
      try {
        if (!jugadorId) {
          setError("No se encontró el jugadorId.");
          setLoading(false);
          return;
        }
        // Obtener sala
        const { data: salaData, error: salaError } = await supabase
          .from("salas")
          .select("categorias")
          .eq("id", salaId)
          .single();
        if (salaError || !salaData)
          throw salaError || new Error("Sala no encontrada");
        setSala(salaData);
        // Validar organizador
        const { data: jugador, error: jugadorError } = await supabase
          .from("jugadores")
          .select("id, es_organizador")
          .eq("id", jugadorId)
          .eq("sala_id", salaId)
          .single();
        if (jugadorError || !jugador)
          throw jugadorError || new Error("Jugador no encontrado");
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
        if (respError || !respuestas)
          throw respError || new Error("No se pudieron obtener respuestas");
        // Agrupar por categoria_index
        const agrupadas: RespuestasPorCategoria = {};
        for (const r of respuestas) {
          if (!agrupadas[r.categoria_index]) agrupadas[r.categoria_index] = [];
          agrupadas[r.categoria_index].push(r);
        }
        setRespuestasPorCategoria(agrupadas);
      } catch (e: any) {
        setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, rondaId, jugadorId]);

  if (loading) return <div className="p-4 text-center">Cargando...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;
  if (!sala) return null;

  const respuestasActual = respuestasPorCategoria[categoriaActual] || [];
  const categoriaNombre = sala.categorias[categoriaActual] || "";
  const esUltima = categoriaActual === sala.categorias.length - 1;

  const handlePuntosChange = (respuestaId: string, puntos: number) => {
    setPuntosAsignados((prev) => ({ ...prev, [respuestaId]: puntos }));
  };

  const handleSiguiente = async () => {
    setEnviando(true);
    try {
      const puntosArray = respuestasActual.map((resp) => ({
        respuestaId: resp.id,
        puntos: puntosAsignados[resp.id] ?? 0,
      }));
      await asignarPuntos(puntosArray);
      if (!esUltima) {
        setCategoriaActual((prev) => prev + 1);
      } else {
        await finalizarPuntuacion({ salaId, rondaId });
      }
    } catch (e: any) {
      setError(e.message || "Error al asignar puntos");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">
        Categoría {categoriaActual + 1}/5:{" "}
        <span className="text-primary">{categoriaNombre}</span>
      </h2>
      <div className="space-y-4 mb-6">
        {respuestasActual.map((resp) => (
          <div key={resp.id} className="flex items-center gap-2">
            <span className="flex-1">
              {resp.texto || (
                <span className="italic text-gray-400">(vacía)</span>
              )}
            </span>
            <input
              type="number"
              min={0}
              className="w-16 border rounded px-2 py-1"
              value={puntosAsignados[resp.id] ?? 0}
              onChange={(e) =>
                handlePuntosChange(resp.id, Number(e.target.value))
              }
              disabled={enviando}
            />
            <span className="text-xs text-gray-500">puntos</span>
          </div>
        ))}
      </div>
      <button
        className="w-full py-2 rounded bg-primary text-white font-semibold disabled:opacity-60"
        onClick={handleSiguiente}
        disabled={enviando}
      >
        {esUltima ? "Finalizar" : "Siguiente"}
      </button>
    </div>
  );
}
