"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Crea un cliente Supabase singleton para uso en el navegador.
 *
 * @returns Cliente Supabase tipado con Database
 * @throws Error si faltan las variables de entorno
 *
 * Características:
 * - Singleton: reutiliza la misma instancia
 * - Tipos generados automáticamente
 * - Solo para Client Components
 * - Ideal para realtime, auth y mutaciones desde el cliente
 */
export function createBrowserSupabaseClient() {
  // Retornar instancia existente si ya fue creada
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno",
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en las variables de entorno",
    );
  }

  // Crear y cachear el cliente
  client = createBrowserClient<Database>(supabaseUrl, supabaseKey);

  return client;
}

/**
 * Hook helper para usar en componentes de React
 * @example
 * const supabase = useBrowserSupabase();
 */
export function useBrowserSupabase() {
  return createBrowserSupabaseClient();
}
