# Supabase Skill — Project Rules

Defines database access rules using :contentReference[oaicite:0]{index=0}.
Always follow these patterns when generating data access code.

---

## Core Principles

- Always use generated Supabase types.
- Never use `select('*')`.
- Never expose service role keys in client code.
- Always respect Row Level Security (RLS).
- Prefer Server Actions for mutations.
- Use Realtime only when shared state is required.
- Database access should happen on the server whenever possible.

---

## Client Architecture

### Server Access (Preferred)

- All mutations must run on the server.
- Create a request-scoped client using cookies.
- Use server clients inside:
  - Server Components
  - Server Actions
  - Route handlers

Server has full DB access respecting RLS.

---

### Client Access (Limited)

- Client components only use Supabase for:
  - Realtime subscriptions
  - Minimal UI interactions
- Never perform privileged mutations in client components.

---

### Client Location

- Supabase client utilities must live in:
  - lib/supabase/
    - client.ts
    - server.ts
- Do not create additional clients elsewhere.

---

## Query Rules

- Select only required columns.
- Use `.single()` when expecting one row.
- Use `.maybeSingle()` when row may not exist.
- Prefer `upsert` for idempotent writes.
- Always filter updates and deletes.
- Never run unfiltered mutations.

---

## Mutation Patterns

### Insert Pattern

- Validate input before insert.
- Insert → `.select().single()`.
- Handle errors explicitly.
- Return typed result.

---

### Update Pattern

- Always filter by `id` or foreign key.
- Update must be scoped to one entity.
- Validate permissions server-side.

---

### Delete Pattern

- Always filter by identifier.
- Never allow bulk delete without explicit justification.

---

## Transactions and Consistency

- Multi-step mutations must be atomic.
- Avoid partial updates.
- State transitions must be consistent.
- Prevent race conditions when updating shared state.

---

## Realtime Rules

Realtime is used only for shared state.

### Channel Strategy

- One channel per room.
- Subscribe inside `useEffect`.
- Always cleanup on unmount.

### Sync Behavior

- Fetch initial state from server.
- Realtime only applies incremental updates.
- Handle reconnection and resync.

### Events

Subscribe to:

- inserts
- updates
- deletes

Avoid listening to unnecessary tables.

---

## Row Level Security (RLS)

### Mental Model

- Frontend never has admin power.
- Client can only access authorized rows.
- Organizer permissions must be validated server-side.
- Never bypass RLS from frontend.

---

## Data Ownership Model

- Each row must have a clear owner.
- Mutations must validate ownership.
- Organizer-only actions must be verified server-side.

---

## Error Handling Policy

- Always check `{ data, error }`.
- Never ignore database errors.
- Throw or return structured errors.
- Log errors in development.
- UI must handle failure states.

---

## Performance

- Batch inserts when possible.
- Use composite indexes for multi-filter queries.
- Avoid unnecessary subscriptions.
- Prefer server aggregation over client loops.
- Avoid N+1 query patterns.

---

## Schema and Naming Rules

- Table names: plural snake_case.
- Column names: snake_case.
- Foreign keys use `_id` suffix.
- Avoid ambiguous column names.

---

## Types

- Generate types using Supabase CLI.
- Never duplicate DB types manually.
- Always use generated types in queries.
