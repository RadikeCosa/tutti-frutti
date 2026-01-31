"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import "./ranking-animations.css";

interface RankingEntry {
  jugadorId: string;
  nombre: string;
  puntajeTotal: number;
  posicion: number;
}

interface RankingPageProps {
  params: Promise<{ salaId: string }>;
}

export default function RankingPage({ params }: RankingPageProps) {
  const { salaId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener jugadorId (opcional, solo para visualización)
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
    async function fetchRanking() {
      setLoading(true);
      setError(null);
      try {
        // Obtener jugadores
        const { data: jugadores, error: jugadoresError } = await supabase
          .from("jugadores")
          .select("id, nombre")
          .eq("sala_id", salaId);

        if (jugadoresError || !jugadores) {
          throw jugadoresError || new Error("No se pudieron obtener jugadores");
        }

        // Obtener rondas
        const { data: rondas, error: rondasError } = await supabase
          .from("rondas")
          .select("id")
          .eq("sala_id", salaId);

        if (rondasError || !rondas) {
          throw rondasError || new Error("No se pudieron obtener rondas");
        }

        const rondaIds = rondas.map((r) => r.id);

        // Obtener respuestas de todas las rondas
        let todasRespuestas: Array<{ jugador_id: string; puntos: number }> = [];
        if (rondaIds.length > 0) {
          const { data: respuestas, error: respError } = await supabase
            .from("respuestas")
            .select("jugador_id, puntos")
            .in("ronda_id", rondaIds);

          if (respError) throw respError;
          todasRespuestas = respuestas || [];
        }

        // Sumar puntos por jugador
        const puntajes: Record<string, number> = {};
        for (const jugador of jugadores) {
          puntajes[jugador.id] = 0;
        }
        for (const r of todasRespuestas) {
          if (puntajes[r.jugador_id] !== undefined) {
            puntajes[r.jugador_id] += r.puntos ?? 0;
          }
        }

        // Construir ranking y ordenar
        const rankingList: RankingEntry[] = jugadores
          .map((j) => ({
            jugadorId: j.id,
            nombre: j.nombre,
            puntajeTotal: puntajes[j.id] ?? 0,
            posicion: 0, // se asigna después
          }))
          .sort((a, b) => b.puntajeTotal - a.puntajeTotal);

        // Asignar posiciones (1, 2, 3, ...)
        rankingList.forEach((entry, idx) => {
          entry.posicion = idx + 1;
        });

        setRanking(rankingList);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error("Error inesperado");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRanking();
  }, [salaId, supabase]);

  // Podio visual
  const podio = ranking.slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        🏆 Ranking Final 🏆
      </h1>

      {loading ? (
        <div className="text-center text-lg">Cargando...</div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-red-600 font-semibold">
          {error}
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No hay jugadores en esta sala.
        </div>
      ) : (
        <>
          {/* Podio */}
          <section className="w-full max-w-2xl flex justify-center items-end gap-2 md:gap-6 mb-10">
            {/* Segundo lugar */}
            <div className="flex-1 flex flex-col items-center">
              {podio[1] && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-3xl md:text-4xl font-bold border-4 border-gray-300 mb-2">
                    🥈
                  </div>
                  <div className="text-lg md:text-xl font-semibold">
                    {podio[1].nombre}
                  </div>
                  <div className="text-gray-700 font-bold">
                    {podio[1].puntajeTotal} pts
                  </div>
                  <div className="mt-1 text-sm text-gray-500">2°</div>
                </div>
              )}
            </div>
            {/* Primer lugar */}
            <div className="flex-1 flex flex-col items-center">
              {podio[0] && (
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-4xl md:text-5xl font-extrabold border-4 border-yellow-300 mb-2 shadow-lg">
                    🥇
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {podio[0].nombre}
                  </div>
                  <div className="text-yellow-800 font-extrabold">
                    {podio[0].puntajeTotal} pts
                  </div>
                  <div className="mt-1 text-base text-yellow-700">1°</div>
                </div>
              )}
            </div>
            {/* Tercer lugar */}
            <div className="flex-1 flex flex-col items-center">
              {podio[2] && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-2xl md:text-3xl font-bold border-4 border-orange-300 mb-2">
                    🥉
                  </div>
                  <div className="text-base md:text-lg font-semibold">
                    {podio[2].nombre}
                  </div>
                  <div className="text-orange-800 font-bold">
                    {podio[2].puntajeTotal} pts
                  </div>
                  <div className="mt-1 text-sm text-orange-700">3°</div>
                </div>
              )}
            </div>
          </section>

          {/* Tabla de ranking */}
          <section className="w-full max-w-2xl bg-white rounded-lg shadow overflow-hidden mb-8">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-4 py-3 text-center font-semibold w-20">
                    Posición
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
                {ranking.map((entry, idx) => {
                  let rowClass = "";
                  if (idx === 0) rowClass = "bg-yellow-100 text-yellow-800";
                  else if (idx === 1) rowClass = "bg-gray-200 text-gray-800";
                  else if (idx === 2)
                    rowClass = "bg-orange-100 text-orange-800";
                  return (
                    <tr
                      key={entry.jugadorId}
                      className={`hover:bg-gray-50 ${rowClass}`}
                    >
                      <td className="border-b px-4 py-3 text-center font-bold text-lg">
                        {entry.posicion}
                      </td>
                      <td className="border-b px-4 py-3 font-semibold">
                        {entry.nombre}
                      </td>
                      <td className="border-b px-4 py-3 text-center font-bold text-lg">
                        {entry.puntajeTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Botón volver */}
          <button
            className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => router.push("/")}
          >
            Volver al Inicio
          </button>
        </>
      )}
    </main>
  );
}
