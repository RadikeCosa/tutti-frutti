import { createClient } from "@/lib/supabase";
import { randomCode } from "@/app/actions";
import { redirect } from "next/navigation";

export async function iniciarJuego(prevState: any, formData: FormData) {
  "use server";
  const salaId = formData.get("salaId") as string;
  const categorias = JSON.parse(
    formData.get("categorias") as string,
  ) as string[];
  if (!salaId || !categorias || categorias.length !== 5)
    throw new Error("Datos inválidos");
  const supabase = await createClient();
  // Validar jugadores
  const { count } = await supabase
    .from("jugadores")
    .select("id", { count: "exact", head: true })
    .eq("sala_id", salaId);
  if (!count || count < 2) throw new Error("Se requieren al menos 2 jugadores");
  // Actualizar sala
  const { error: salaError } = await supabase
    .from("salas")
    .update({ categorias, estado: "jugando" })
    .eq("id", salaId);
  if (salaError) throw new Error("No se pudo iniciar el juego");
  // Crear ronda
  const letra = randomCode().charAt(0); // Letra random
  const { error: rondaError } = await supabase
    .from("rondas")
    .insert([{ sala_id: salaId, letra }]);
  if (rondaError) throw new Error("No se pudo crear la ronda");
  // No redireccionar, el realtime lo hará
}
