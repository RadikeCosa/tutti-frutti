"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Eliminar una sugerencia de categoría por id
export async function eliminarCategoriaSugerida(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: "ID inválido" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_sugeridas")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

function randomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function randomLetter(): string {
  const letters = "ABCDEFGHIJLMNOPQRSTUVXYZ"; // Sin K, W, Ñ
  return letters.charAt(Math.floor(Math.random() * letters.length));
}

export async function crearSala(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre || nombre.length < 2 || nombre.length > 20) {
    throw new Error("Nombre inválido");
  }
  const supabase = await createClient();
  const codigo_invitacion = randomCode();

  // Crear sala con organizador_id temporal (UUID nulo válido)
  const UUID_NULO = "00000000-0000-0000-0000-000000000000";
  let sala;
  try {
    const { data, error } = await supabase
      .from("salas")
      .insert([
        {
          codigo_invitacion,
          organizador_id: UUID_NULO,
          categorias: [],
          estado: "lobby",
        },
      ])
      .select()
      .single();
    if (error || !data) throw error || new Error("No se pudo crear la sala");
    sala = data;
  } catch (e) {
    console.error("Error al crear sala:", e);
    throw new Error("No se pudo crear la sala");
  }

  // Crear organizador con sala_id y nombre personalizado
  let jugador;
  try {
    const { data, error } = await supabase
      .from("jugadores")
      .insert([
        {
          sala_id: sala.id,
          nombre,
          es_organizador: true,
        },
      ])
      .select()
      .single();
    if (error || !data)
      throw error || new Error("No se pudo crear el organizador");
    jugador = data;
  } catch (e) {
    console.error("Error al crear organizador:", e);
    throw new Error("No se pudo crear el organizador");
  }

  // Actualizar sala con el id real del organizador
  try {
    const { error } = await supabase
      .from("salas")
      .update({ organizador_id: jugador.id })
      .eq("id", sala.id);
    if (error) throw error;
  } catch (e) {
    console.error("Error al asociar organizador a la sala:", e);
    throw new Error("No se pudo asociar el organizador a la sala");
  }

  redirect(`/lobby/${sala.id}?jugadorId=${jugador.id}`);
}

export async function unirseSala(formData: FormData) {
  const codigo = (formData.get("codigo") as string)?.toUpperCase();

  if (!codigo || codigo.length !== 6) {
    throw new Error("Código inválido");
  }

  const supabase = await createClient();
  const { data: sala } = await supabase
    .from("salas")
    .select("id")
    .eq("codigo_invitacion", codigo)
    .single();

  if (!sala) throw new Error("Sala no encontrada");

  redirect(`/unirse/${codigo}`);
}

export async function unirseConNombre(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  const codigo = (formData.get("codigo") as string)?.toUpperCase();

  if (!nombre || nombre.length > 20) throw new Error("Nombre inválido");
  if (!codigo || codigo.length !== 6) throw new Error("Código inválido");

  const supabase = await createClient();

  const { data: sala } = await supabase
    .from("salas")
    .select("id, estado")
    .eq("codigo_invitacion", codigo)
    .single();

  if (!sala) throw new Error("Sala no encontrada");
  if (sala.estado !== "lobby") throw new Error("Partida en curso");

  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .insert([{ sala_id: sala.id, nombre }])
    .select()
    .single();

  if (jugadorError || !jugador) throw new Error("No se pudo unir");

  redirect(`/lobby/${sala.id}?jugadorId=${jugador.id}`);
}

export async function iniciarJuego(formData: FormData) {
  const salaId = formData.get("salaId") as string;
  const categoriasStr = formData.get("categorias") as string;

  if (!salaId || !categoriasStr) throw new Error("Datos inválidos");

  const categorias = JSON.parse(categoriasStr) as string[];

  if (categorias.length !== 5 || categorias.some((c) => !c.trim())) {
    throw new Error("Completa las 5 categorías");
  }

  const supabase = await createClient();

  // Validar jugadores
  const { count } = await supabase
    .from("jugadores")
    .select("id", { count: "exact", head: true })
    .eq("sala_id", salaId);

  if (!count || count < 2) {
    throw new Error("Se requieren al menos 2 jugadores");
  }

  // Actualizar sala
  const { error: salaError } = await supabase
    .from("salas")
    .update({ categorias, estado: "jugando" })
    .eq("id", salaId);

  if (salaError) throw new Error("No se pudo iniciar el juego");

  // Crear primera ronda
  const letra = randomLetter();
  const { error: rondaError } = await supabase.from("rondas").insert([
    {
      sala_id: salaId,
      numero_ronda: 1,
      letra,
      estado: "escribiendo",
    },
  ]);

  if (rondaError) throw new Error("No se pudo crear la ronda");
}

// Guardar respuestas y marcar jugador como listo
interface GuardarRespuestasInput {
  salaId: string;
  rondaId: string;
  jugadorId: string;
  respuestas: string[];
  categorias: string[];
}

export async function guardarRespuestas({
  salaId,
  rondaId,
  jugadorId,
  respuestas,
  categorias,
}: GuardarRespuestasInput) {
  const supabase = await createClient();

  // Upsert respuestas (una por categoría)
  const upserts = categorias.map((_, idx) => ({
    ronda_id: rondaId,
    jugador_id: jugadorId,
    categoria_index: idx,
    texto: respuestas[idx] || "",
  }));

  const { error: upsertError } = await supabase
    .from("respuestas")
    .upsert(upserts, {
      onConflict: "ronda_id,jugador_id,categoria_index",
    });

  if (upsertError) {
    console.error("Error al guardar respuestas:", upsertError);
    throw new Error("No se pudieron guardar las respuestas");
  }

  // Marcar jugador como listo
  const { error: listoError } = await supabase
    .from("jugadores")
    .update({ listo: true })
    .eq("id", jugadorId)
    .eq("sala_id", salaId);

  if (listoError) {
    console.error("Error al marcar listo:", listoError);
    throw new Error("No se pudo marcar como listo");
  }
}

// Terminar ronda (solo organizador)
interface TerminarRondaInput {
  readonly rondaId: string;
  readonly jugadorId: string;
}

export async function terminarRonda({
  rondaId,
  jugadorId,
}: TerminarRondaInput) {
  const supabase = await createClient();
  // Validar que el jugador es organizador
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .select("es_organizador, sala_id")
    .eq("id", jugadorId)
    .single();
  if (jugadorError || !jugador) {
    throw new Error("Jugador no encontrado");
  }
  if (!jugador.es_organizador) {
    throw new Error("Solo el organizador puede realizar esta acción");
  }
  const { error } = await supabase
    .from("rondas")
    .update({ estado: "puntuando" })
    .eq("id", rondaId);
  if (error) {
    console.error("Error al terminar ronda:", error);
    throw new Error("No se pudo terminar la ronda");
  }
}

// --- Server Actions para puntuación ---
interface AsignarPuntosInput {
  readonly respuestaId: string;
  readonly puntos: number;
  readonly jugadorId: string;
}

export async function asignarPuntos(puntajes: AsignarPuntosInput[]) {
  const supabase = await createClient();
  // Validar que el jugador es organizador (solo una vez)
  if (!puntajes.length) return;
  const { jugadorId } = puntajes[0];
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .select("es_organizador, sala_id")
    .eq("id", jugadorId)
    .single();
  if (jugadorError || !jugador) {
    throw new Error("Jugador no encontrado");
  }
  if (!jugador.es_organizador) {
    throw new Error("Solo el organizador puede realizar esta acción");
  }
  for (const { respuestaId, puntos } of puntajes) {
    const { error } = await supabase
      .from("respuestas")
      .update({ puntos })
      .eq("id", respuestaId);
    if (error) {
      console.error("Error al asignar puntos:", error);
      throw new Error("No se pudo asignar puntos");
    }
  }
  // No redireccionar, solo retornar
}

interface FinalizarPuntuacionInput {
  readonly salaId: string;
  readonly rondaId: string;
  readonly jugadorId: string;
}

export async function finalizarPuntuacion({
  salaId,
  rondaId,
  jugadorId,
}: FinalizarPuntuacionInput) {
  const supabase = await createClient();
  // Validar que el jugador es organizador
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .select("es_organizador, sala_id")
    .eq("id", jugadorId)
    .single();
  if (jugadorError || !jugador) {
    throw new Error("Jugador no encontrado");
  }
  if (!jugador.es_organizador) {
    throw new Error("Solo el organizador puede realizar esta acción");
  }
  // Marcar ronda como completada
  const { error: rondaError } = await supabase
    .from("rondas")
    .update({ estado: "completada" })
    .eq("id", rondaId);
  if (rondaError) {
    console.error("Error al finalizar puntuación (ronda):", rondaError);
    throw new Error("No se pudo finalizar la ronda");
  }
  // Cambiar estado de la sala
  const { error: salaError } = await supabase
    .from("salas")
    .update({ estado: "resultado_ronda" })
    .eq("id", salaId);
  if (salaError) {
    console.error("Error al actualizar sala:", salaError);
    throw new Error("No se pudo actualizar la sala");
  }
  // Marcar todos los jugadores como no listos
  const { error: jugadoresError } = await supabase
    .from("jugadores")
    .update({ listo: false })
    .eq("sala_id", salaId);
  if (jugadoresError) {
    console.error("Error al actualizar jugadores:", jugadoresError);
    throw new Error("No se pudo actualizar jugadores");
  }
  redirect(`/resultados/${salaId}/${rondaId}`);
}

// --- Server Actions para resultados ---
interface NuevaRondaInput {
  readonly salaId: string;
  readonly jugadorId: string;
}

export async function nuevaRonda({ salaId, jugadorId }: NuevaRondaInput) {
  const supabase = await createClient();
  // Validar que el jugador es organizador
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .select("es_organizador, sala_id")
    .eq("id", jugadorId)
    .single();
  if (jugadorError || !jugador) {
    throw new Error("Jugador no encontrado");
  }
  if (!jugador.es_organizador) {
    throw new Error("Solo el organizador puede realizar esta acción");
  }
  // Obtener última ronda
  const { data: ultima, error: ultimaError } = await supabase
    .from("rondas")
    .select("numero_ronda")
    .eq("sala_id", salaId)
    .order("numero_ronda", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ultimaError) {
    console.error("Error al obtener última ronda:", ultimaError);
    throw new Error("No se pudo obtener la última ronda");
  }
  const numeroRonda = (ultima?.numero_ronda ?? 0) + 1;
  const letra = randomLetter();
  // Crear nueva ronda
  const { error: rondaError } = await supabase.from("rondas").insert([
    {
      sala_id: salaId,
      numero_ronda: numeroRonda,
      letra,
      estado: "escribiendo",
    },
  ]);
  if (rondaError) {
    console.error("Error al crear nueva ronda:", rondaError);
    throw new Error("No se pudo crear la nueva ronda");
  }
  // Actualizar sala
  const { error: salaError } = await supabase
    .from("salas")
    .update({ estado: "jugando" })
    .eq("id", salaId);
  if (salaError) {
    console.error("Error al actualizar sala:", salaError);
    throw new Error("No se pudo actualizar la sala");
  }
  // Marcar todos los jugadores como no listos
  const { error: jugadoresError } = await supabase
    .from("jugadores")
    .update({ listo: false })
    .eq("sala_id", salaId);
  if (jugadoresError) {
    console.error("Error al actualizar jugadores:", jugadoresError);
    throw new Error("No se pudo actualizar jugadores");
  }
  redirect(`/juego/${salaId}`);
}

interface FinalizarJuegoInput {
  readonly salaId: string;
  readonly jugadorId: string;
}

export async function finalizarJuego({
  salaId,
  jugadorId,
}: FinalizarJuegoInput) {
  const supabase = await createClient();
  // Validar que el jugador es organizador
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .select("es_organizador, sala_id")
    .eq("id", jugadorId)
    .single();
  if (jugadorError || !jugador) {
    throw new Error("Jugador no encontrado");
  }
  if (!jugador.es_organizador) {
    throw new Error("Solo el organizador puede realizar esta acción");
  }
  const { error } = await supabase
    .from("salas")
    .update({ estado: "finalizada" })
    .eq("id", salaId);
  if (error) {
    console.error("Error al finalizar juego:", error);
    throw new Error("No se pudo finalizar el juego");
  }
  redirect(`/ranking/${salaId}`);
}

// Guardar una sugerencia de categoría para el admin
export async function guardarCategoriaSugerida(
  nombre: string,
): Promise<{ success: boolean; error?: string }> {
  if (!nombre.trim()) {
    return { success: false, error: "Datos inválidos" };
  }
  const supabase = await createClient();
  // Usar UUID dummy para creador_id si no hay auth
  const creador_id = "00000000-0000-0000-0000-000000000000";
  const { error } = await supabase
    .from("categorias_sugeridas")
    .insert([{ nombre: nombre.trim(), creador_id }]);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Obtener sugerencias de categorías para el admin
// Obtener todas las sugerencias de categorías (global)
export async function obtenerCategoriasSugeridas(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_sugeridas")
    .select("nombre")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row: { nombre: string }) => row.nombre);
}
