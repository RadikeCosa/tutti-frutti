import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { unirseConNombre } from "./actions";

interface UnirsePageProps {
  params: { codigo: string };
}

export default async function UnirsePage({ params }: UnirsePageProps) {
  const codigo = params.codigo?.toUpperCase();
  if (!codigo || codigo.length !== 6) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Código inválido</h2>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: sala } = await supabase
    .from("salas")
    .select("id, estado")
    .eq("codigo_invitacion", codigo)
    .single();

  if (!sala) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sala no encontrada</h2>
        </div>
      </main>
    );
  }

  if (sala.estado !== "lobby") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Partida en curso</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-center mb-4">
          Unirse a la sala
        </h1>
        <form
          action={unirseConNombre}
          className="flex flex-col gap-4 bg-white rounded-lg shadow p-6"
        >
          <input type="hidden" name="codigo" value={codigo} />
          <label htmlFor="nombre" className="font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            maxLength={20}
            className="border border-gray-300 rounded px-3 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Tu nombre"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition"
          >
            Unirse a la sala
          </button>
        </form>
      </div>
    </main>
  );
}
