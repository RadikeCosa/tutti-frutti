"use client";

import { useState, useTransition } from "react";
import {
  testSupabaseSession,
  type TestSessionResult,
} from "../app/actions/test-session";

export default function TestConnectionClient() {
  const [result, setResult] = useState<TestSessionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCheck = () => {
    startTransition(async () => {
      const nextResult = await testSupabaseSession();
      setResult(nextResult);
    });
  };

  const sessionStatus = result?.session ? "active" : "none";

  return (
    <section className="mt-6 space-y-2 text-sm">
      <h2 className="text-base font-semibold">Client check</h2>
      <button
        type="button"
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        onClick={handleCheck}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Checking..." : "Check from client"}
      </button>
      {result ? (
        <div className="space-y-1">
          <p>Connection: {result.success ? "success" : "failed"}</p>
          <p>Session: {sessionStatus}</p>
          {result.error ? <p>Error: {result.error}</p> : null}
        </div>
      ) : (
        <p>Client: not checked</p>
      )}
    </section>
  );
}
