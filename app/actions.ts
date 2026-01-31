"use server";
import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";



function randomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

  const supabase = await createClient();
  const codigo_invitacion = randomCode();
  // Crear sala con datos mínimos (organizador_id temporal, se actualiza luego)
  const { data: sala, error: salaError } = await supabase
    .from("salas")
    .insert([
      {
        codigo_invitacion,
        organizador_id: "", // temporal, se actualiza luego
        categorias: [],
        estado: "lobby"
      }
    ])
    .select()
    .single();
  if (salaError || !sala) throw new Error("No se pudo crear la sala");
  // Crear organizador con sala_id
  const { data: jugador, error: jugadorError } = await supabase
    .from("jugadores")
    .insert([
      {
        sala_id: sala.id,
        nombre: "Organizador",
        es_organizador: true
      }
    ])
    .select()
    .single();
  if (jugadorError || !jugador) throw new Error("No se pudo crear el organizador");
  // Actualizar sala con el id del organizador
  const { error: updateSalaError } = await supabase
    .from("salas")
    .update({ organizador_id: jugador.id })
    .eq("id", sala.id);
  if (updateSalaError) throw new Error("No se pudo asociar el organizador a la sala");
  redirect(`/lobby/${sala.id}`);
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
