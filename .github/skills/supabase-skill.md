# Supabase Skill – Project Rules

## General Rules

- Always use generated Supabase types.
- Never use `select('*')`.
- Never expose service role keys in client code.
- Always respect Row Level Security (RLS).
- Prefer Server Actions for mutations.
- Use Realtime only when shared state is required.

---

## Client Creation

- Server Components → `createServerComponentClient`
- Client Components → `createClientComponentClient`
- Client must live in `lib/supabase/client.ts`

---

## Query Rules

- Select only required columns.
- Use `.single()` when expecting one row.
- Use `.maybeSingle()` when row may not exist.
- Prefer `upsert` for idempotent writes.
- Always filter updates and deletes with `eq`.

---

## Insert Pattern

- Insert → `.select().single()`
- Validate data before insert.
- Handle `error` explicitly.

---

## Update Pattern

- Always filter by `id` or foreign key.
- Never run unfiltered updates.

---

## Realtime Rules

- One channel per room.
- Subscribe inside `useEffect`.
- Always cleanup on unmount.
- Handle reconnection scenarios.

---

## RLS Mental Model

- Frontend never has admin power.
- User can only mutate own data.
- Organizer roles must be validated server-side.

---

## Performance

- Batch inserts when possible.
- Use composite indexes for multi-filter queries.
- Avoid unnecessary subscriptions.
- Prefer server aggregation over client loops.

---

## Types

- Generate types using Supabase CLI.
- Never duplicate DB types manually.
