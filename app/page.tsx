// app/page.tsx
import { crearSala, unirseSala } from "./actions";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-4">
        <h1 className="text-5xl font-bold text-center mb-8">Tutti Frutti</h1>
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Formulario Crear Sala */}
          <form
            action={crearSala}
            className="flex flex-col gap-4 bg-white rounded-lg shadow p-6"
          >
            <label htmlFor="nombre-organizador" className="font-medium">
              Tu nombre
            </label>
            <input
              id="nombre-organizador"
              name="nombre"
              type="text"
              minLength={2}
              maxLength={20}
              required
              className="border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nombre del organizador"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            >
              Crear Sala
            </button>
          </form>

          {/* Formulario Unirse a Sala */}
          <form
            action={unirseSala}
            className="flex flex-col gap-4 bg-white rounded-lg shadow p-6"
          >
            <label htmlFor="codigo" className="font-medium">
              Código de invitación
            </label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              pattern="[A-Za-z0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              className="border border-gray-300 rounded px-3 py-2 text-lg tracking-widest uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ABC123"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition"
            >
              Unirse
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
