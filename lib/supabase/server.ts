import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Crea un cliente Supabase para uso exclusivo en el servidor.
 *
 * @returns Cliente Supabase tipado con Database
 * @throws Error si faltan las variables de entorno
 *
 * Características:
 * - Request-scoped: usa cookies de la request actual
 * - Seguro para Server Components, Server Actions y Route Handlers
 * - Manejo completo de cookies (get, set, remove)
 * - Tipos generados automáticamente
 *
 * @example
 * // En un Server Component
 * const supabase = await createServerSupabaseClient();
 * const { data } = await supabase.from('users').select();
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

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

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Puede fallar en Server Components (solo lectura)
          // Funciona en Server Actions y Route Handlers
          console.error("Error setting cookies:", error);
        }
      },
    },
  });
}

/**
 * Crea un cliente Supabase para Route Handlers con manejo completo de cookies.
 * Usa esta versión en API routes donde necesitas modificar cookies.
 *
 * @example
 * // app/api/auth/route.ts
 * export async function POST(request: Request) {
 *   const supabase = await createRouteHandlerClient();
 *   // ...
 * }
 */
export async function createRouteHandlerClient() {
  return createServerSupabaseClient();
}

/**
 * Cliente para Server Actions con manejo de cookies completo.
 *
 * @example
 * // app/actions.ts
 * 'use server'
 * export async function updateProfile(formData: FormData) {
 *   const supabase = await createServerActionClient();
 *   // ...
 * }
 */
export async function createServerActionClient() {
  return createServerSupabaseClient();
}
