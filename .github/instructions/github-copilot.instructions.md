---
applyTo: "**"
---

# GitHub Copilot Instructions — Tutti Frutti

## General Rules

- Do not change the project stack.
- Do not introduce new frameworks or UI libraries.
- Prefer existing patterns over new abstractions.
- Follow the folder structure strictly.
- Avoid unnecessary dependencies.
- Write simple and readable code over clever code.
- Ensure all code is well-documented and maintainable.
- Focus on the user experience and accessibility.

---

## Project Context

Multiplayer online game similar to Tutti-Frutti:

- Players join via invitation link.
- Players write words for 5 customizable categories.
- Organizer manually scores answers.
- Played in rounds with random letters.

---

## Tech Stack (Do Not Change)

- Framework: Next.js 16 — App Router only
- Language: TypeScript strict mode
- Styling: Tailwind CSS v4
- Database: Supabase (PostgreSQL + Realtime)
- Deployment: Vercel

Do not suggest alternative stacks.

---

## Architecture Principles

- Server Components by default.
- Client Components only for interactivity.
- Server Actions handle mutations.
- Database access happens on the server whenever possible.
- Realtime is used for shared game state.

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

- Use App Router only.
- Do not use Pages Router.
- Do not mix routers.
- Use Server Components by default.
- Use `'use client'` only when required.
- Use Server Actions for mutations.
- Do not fetch sensitive data in client components.
- Provide `loading.tsx` and `error.tsx` when appropriate.

---

### Components

- Functional components only.
- Destructure props.
- Use descriptive PascalCase names.
- One main component per file.
- Avoid anonymous default exports.
- Default export only for pages or main components.

---

## Architecture and Maintainability

### Single Responsibility Principle (SRP)

- Each component must have a single clear responsibility.
- Separate UI, state logic, and data access.
- Prefer smaller composable components over large components.
- Extract complex logic to utilities or hooks when appropriate.
- Avoid components that handle layout, business logic, and data fetching together.

---

### Component Composition

- Prefer composition over large monolithic components.
- Extract reusable UI patterns.
- Separate container components from presentational components when useful.
- Keep components easy to test and maintain.
- A component should not exceed ~150 lines when possible.
- Extract subcomponents when JSX becomes complex.
- Avoid mixing styling, business logic, and data fetching in the same component.

---

### Styling Organization

- Prefer centralized and reusable styles.
- Avoid duplicating long Tailwind class strings.
- Extract reusable style patterns into:
  - shared UI components
  - utility functions
  - CSS variables
- Keep styling consistent across the application.
- Separate styling concerns from business logic.

---

### Data Fetching

- Prefer server-side data fetching.
- Use Suspense where appropriate.
- Avoid unnecessary client fetching.
- Handle loading and error states explicitly.

---

### Supabase

- Always use generated types.
- Row Level Security must always be enabled.
- Never expose service role keys to the client.
- Never bypass RLS from frontend.
- Optimize queries with specific `select`.

#### Access Pattern

- Server: full database access respecting RLS.
- Client: minimal access for realtime and UI updates.

---

### Realtime

- Use for shared game state synchronization.
- Subscribe inside `useEffect`.
- Always cleanup on unmount.
- Handle reconnections.
- Use optimistic updates when appropriate.
- UI must remain functional if realtime temporarily fails.

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
actions/
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

## Validation Rules

- Always validate on the server.
- Client validation is allowed for UX but not trusted.
- Never trust client input.

---

## Priorities

1. Simplicity — clarity over cleverness.
2. Performance — minimize re-renders.
3. UX — loading states, errors, feedback.
4. Realtime — smooth synchronization.
5. Accessibility — semantic HTML.

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
```

### Player Roles

- Organizer: full control, can start rounds, score answers.
- Player: can join room, submit answers, see results.

### Validations

- Room code: 6 uppercase letters, unique.
- Categories: Required before starting round.
- Answers: Can be empty.

### Do Not

- Do not use any
- Do not mix routers
- Do not use Context API for shared game state
- Do not creat complex custom hooks prematurely
- Do not over optimize before measuring
- Do not use heave UI libraries
- Do not fetch from client when Server Actions are better
- Do not hardcode DB values

### DO

- Validate user inputs
- Handle loading and error states
- Use descriptive log in development
- Commen only when logic is not obvious
- Extract complex logic into utilities
- Think mobile-first
- Respect RLS and permissions

### Supabase Schema (Reference)

Main tables:

- salas
- jugadores
- rondas
- respuestas

### Mental Checklist Before Generating Code

- Does this need to be a Client Component?
- Does this data need Realtime?
- Is validation required?
- What happens if the connection fails?
- Does it work on mobile?
- Does it respect RLS and permissions?
