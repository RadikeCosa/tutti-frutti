"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Crea un cliente Supabase para uso en el navegador.
 *
 * - Usa tipos generados Database.
 * - Solo para Client Components.
 * - Usado para realtime e interacción mínima desde el cliente.
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
