import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient(): SupabaseClient {
  return createBrowserSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
