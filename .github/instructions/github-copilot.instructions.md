---
applyTo: "**"
---

# GitHub Copilot Instructions - Tutti Frutti

## General Rules

- Do not change the project stack.
- Do not introduce new frameworks or UI libraries.
- Prefer existing patterns over new abstractions.
- Follow the folder structure strictly.
- Avoid unnecessary dependencies.
- Write simple and readable code over clever code.

---

## Project Context

Multiplayer online game similar to Tutti-Frutti (Stop/Basta):

- Players join via invitation link.
- Players write words for 5 customizable categories.
- Organizer manually scores answers.
- Played in rounds with random letters.

---

## Tech Stack (Do Not Change)

- **Framework:** Next.js 16 – App Router only
- **Language:** TypeScript strict mode
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + Realtime)
- **Deployment:** Vercel

Do not suggest alternative stacks.

---

## Code Rules

### TypeScript

- Always use explicit types.
- Avoid `any`.
- Prefer `readonly` where possible.
- Prefer union types over enums.
- Use interfaces for component props.
- Use generated Supabase types for DB data.
- Never use `as` without strong justification.

---

### Next.js

- Use **App Router only**.
- Do not use Pages Router.
- Do not mix App Router and Pages Router.
- Server Components by default.
- Client Components only when necessary (`'use client'`).
- Use Server Actions for mutations.
- Avoid `use server` inside client files.

---

### Components

- Functional components only.
- Destructure props.
- Use descriptive PascalCase names.
- One main component per file.
- Avoid anonymous default exports.
- Default export only for pages or main components.

---

### Supabase

- Always use generated types.
- Realtime subscriptions for shared state.
- Row Level Security must always be enabled.
- Never expose service role keys to the client.
- Never bypass RLS from frontend.
- Optimize queries with specific `select`.

---

### Styling

- Tailwind utility-first approach.
- Avoid inline `style={}`.
- Mobile-first responsive design.
- Prefer CSS variables from `globals.css`.

---

## Folder Structure

app/
(routes)/
page.tsx
layout.tsx
actions/
\*.ts
components/
ui/
game/
lib/
supabase/
types/
utils/

- Do not create new top-level folders without reason.

---

## Naming Conventions

- Files: kebab-case.tsx
- Components: PascalCase
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

---

## State and Logic

- `useState` for local UI state.
- Supabase Realtime for shared state.
- Avoid excessive prop drilling.
- Use Server Actions for mutations.
- Avoid global state libraries unless strictly necessary.

---

## Priorities

1. **Simplicity** – clarity over cleverness.
2. **Performance** – minimize re-renders, use Suspense.
3. **UX** – loading states, errors, visual feedback.
4. **Realtime** – smooth synchronization.
5. **Accessibility** – semantic HTML.

---

## Game-Specific Patterns

### Room States

```ts
type SalaEstado =
  | "lobby"
  | "escribiendo"
  | "puntuando"
  | "resultado_ronda"
  | "finalizada";
Realtime Subscriptions
Subscribe inside useEffect.

Always cleanup on unmount.

Handle reconnections.

Use optimistic updates when appropriate.

Roles
Organizer: start game, score, finish.

Player: write answers, view results.

Validations
Room code: 6 alphanumeric characters.

Categories: required before starting.

Answers: may be empty.

Do Not
❌ Do not use any.

❌ Do not mix routers.

❌ Do not use Context API for shared game state.

❌ Do not create complex custom hooks prematurely.

❌ Do not over-optimize before measuring.

❌ Do not use heavy UI libraries.

❌ Do not fetch from client when Server Actions are better.

❌ Do not hardcode DB values.

❌ Do not duplicate validations in client and server.

Do
✅ Validate user inputs.

✅ Handle loading and error states.

✅ Use descriptive logs in development.

✅ Comment only when logic is not obvious.

✅ Extract complex logic to utilities.

✅ Think mobile-first.

✅ Respect RLS and permissions.

Supabase Schema (Reference)
Main tables:

salas

jugadores

rondas

respuestas

Mental Checklist Before Generating Code
Does this need to be a Client Component?

Does this data need Realtime?

Is validation required?

What happens if the connection fails?

Does it work on mobile?

Does it respect RLS and permissions?
```
