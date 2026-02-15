import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Crea un cliente Supabase para uso exclusivo en el servidor.
 * - Usa el tipo generado Database.
 * - Seguro para Server Components, Server Actions y Route Handlers.
 * - Request-scoped (usa cookies de la request actual).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op: set solo disponible en Route Handlers o Server Actions
      },
      remove() {
        // No-op: remove solo disponible en Route Handlers o Server Actions
      },
    },
  });
}
