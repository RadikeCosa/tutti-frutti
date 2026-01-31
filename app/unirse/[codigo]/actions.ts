import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export async function unirseConNombre(formData: FormData) {
  "use server";
  const nombre = (formData.get("nombre") as string)?.trim();
  const codigo = (formData.get("codigo") as string)?.toUpperCase();
  if (!nombre || nombre.length > 20) throw new Error("Nombre inválido");
  if (!codigo || codigo.length !== 6) throw new Error("Código inválido");
  const supabase = await createClient();
  // Buscar sala
  const { data: sala } = await supabase
    .from("salas")
    .select("id, estado")
    .eq("codigo_invitacion", codigo)
    .single();
  if (!sala) throw new Error("Sala no encontrada");
  if (sala.estado !== "lobby") throw new Error("Partida en curso");
  // Insertar jugador
  const { error: jugadorError } = await supabase
    .from("jugadores")
    .insert([{ sala_id: sala.id, nombre }]);
  if (jugadorError) throw new Error("No se pudo unir");
  redirect(`/lobby/${sala.id}`);
}
