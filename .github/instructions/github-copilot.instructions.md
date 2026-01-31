---
applyTo: "**"
---

# GitHub Copilot Instructions - Tutti Frutti

## Contexto del Proyecto

Juego multijugador tipo Tuti-Fruti (Stop/Basta) online donde:

- Los jugadores se unen mediante link de invitación
- Escriben palabras según 5 categorías personalizables
- El organizador puntúa manualmente las respuestas
- Se juega por rondas con letras aleatorias

## Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript estricto
- **Estilos**: Tailwind CSS v4
- **Base de datos**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel

## Reglas de Código

### TypeScript

- Usar tipos explícitos, evitar `any`
- Interfaces para props de componentes
- Types para datos de Supabase
- Nunca usar `as` sin justificación clara

### Next.js

- Usar App Router exclusivamente
- Server Components por defecto
- Client Components solo cuando sea necesario (`'use client'`)
- Server Actions para mutaciones de datos
- Evitar `use server` en archivos client

### Componentes

- Componentes funcionales únicamente
- Props destructuradas
- Nombres descriptivos en PascalCase
- Un componente por archivo (excepto sub-componentes pequeños)
- Exportar como default si es página o componente principal

### Supabase

- Usar cliente de Supabase con tipado generado
- Realtime subscriptions para cambios en tiempo real
- Row Level Security siempre habilitado
- Queries optimizadas con select específico

### Estilos

- Tailwind utility-first approach
- Evitar estilos inline con style={}
- Componentes responsivos mobile-first
- Usar variables CSS de globals.css cuando sea posible

### Estructura de archivos

```
app/
  (routes)/
    page.tsx
    layout.tsx
  actions/
    *.ts (Server Actions)
components/
  ui/
  game/
lib/
  supabase/
  types/
  utils/
```

### Nomenclatura

- Archivos: kebab-case.tsx
- Componentes: PascalCase
- Funciones/variables: camelCase
- Constantes: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

### Estado y Lógica

- useState para estado local UI
- Supabase Realtime para estado compartido
- Evitar prop drilling excesivo
- Server Actions para mutaciones

## Prioridades

1. **Simplicidad**: Código claro sobre código clever
2. **Performance**: Optimizar re-renders, usar Suspense
3. **UX**: Loading states, error handling, feedback visual
4. **Realtime**: Sincronización fluida entre jugadores
5. **Accesibilidad**: Semántica HTML correcta

## Patrones Específicos del Juego

### Estados de la Sala

```typescript
type SalaEstado =
  | "lobby"
  | "escribiendo"
  | "puntuando"
  | "resultado_ronda"
  | "finalizada";
```

### Realtime Subscriptions

- Suscribirse en useEffect con cleanup
- Manejar reconexiones
- Optimistic updates cuando sea apropiado

### Roles

- Organizador: permisos especiales (iniciar, puntuar, finalizar)
- Jugador: solo escribir respuestas y ver resultados

### Validaciones

- Código de sala: 6 caracteres alfanuméricos
- Categorías: obligatorias antes de iniciar
- Respuestas: pueden estar vacías

## No Hacer

❌ No usar Context API (Supabase Realtime maneja estado compartido)
❌ No crear custom hooks complejos prematuramente
❌ No sobre-optimizar antes de medir
❌ No usar librerías de UI pesadas (mantener bundle pequeño)
❌ No hacer fetch desde client cuando Server Actions son mejor opción
❌ No hardcodear valores que deberían venir de DB

## Hacer

✅ Validar inputs del usuario
✅ Manejar estados de carga y error
✅ Logs descriptivos en desarrollo
✅ Comentarios solo cuando la lógica no sea obvia
✅ Extraer lógica compleja a funciones utilities
✅ Pensar mobile-first en diseño

## Supabase Schema (Referencia)

### Tablas principales

- `salas`: id, codigo, organizador_id, categorias[], estado, created_at
- `jugadores`: id, sala_id, nombre, es_organizador, listo, created_at
- `rondas`: id, sala_id, numero, letra, estado, created_at
- `respuestas`: id, ronda_id, jugador_id, categoria_index, texto, puntos

## Testing Mental

Antes de generar código, considerar:

1. ¿Esto necesita ser Client Component?
2. ¿Los datos necesitan Realtime?
3. ¿Hay validación necesaria?
4. ¿Qué pasa si falla la conexión?
5. ¿Funciona en mobile?
