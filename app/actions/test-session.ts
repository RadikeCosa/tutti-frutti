"use server";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createServerActionClient } from "../../lib/supabase/server";
import type { Database } from "../../lib/supabase/types";

export interface TestSessionResult {
  readonly success: boolean;
  readonly session: Session | null;
  readonly error?: string;
}

export async function testSupabaseSession(): Promise<TestSessionResult> {
  try {
    const supabase: SupabaseClient<Database> = await createServerActionClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        session: null,
        error: error.message,
      };
    }

    return {
      success: true,
      session: data.session,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      session: null,
      error: message,
    };
  }
}
