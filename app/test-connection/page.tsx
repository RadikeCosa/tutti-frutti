import TestConnectionClient from "../../components/test-connection-client";
import { testSupabaseSession } from "../actions/test-session";

export default async function TestConnectionPage() {
  const result = await testSupabaseSession();
  const sessionStatus = result.session ? "active" : "none";

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Supabase Connection</h1>
      <section className="mt-4 space-y-2 text-sm">
        <h2 className="text-base font-semibold">Server check</h2>
        <p>Connection: {result.success ? "success" : "failed"}</p>
        <p>Session: {sessionStatus}</p>
        {result.error ? <p>Error: {result.error}</p> : null}
      </section>
      <TestConnectionClient />
    </main>
  );
}
