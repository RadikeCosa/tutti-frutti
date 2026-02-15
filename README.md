# Tutti Frutti — Juego Online

Juego multijugador online inspirado en Tutti Frutti, desarrollado con Next.js 16, TypeScript y Supabase.

## Descripción

Tutti Frutti es un juego de palabras por rondas donde los jugadores deben escribir respuestas para distintas categorías usando una letra aleatoria. Un organizador puntúa las respuestas y el juego sincroniza el estado en tiempo real para todos los participantes.

## Características

- **Multijugador online**: los jugadores se unen mediante un enlace de invitación.
- **Categorías personalizables**: el organizador define las categorías antes de cada ronda.
- **Rondas con letras aleatorias**: cada ronda se juega con una letra diferente.
- **Puntuación manual**: el organizador puntúa las respuestas de los jugadores.
- **Sincronización en tiempo real**: el estado del juego se actualiza instantáneamente para todos.
- **Accesible y responsivo**: interfaz optimizada para dispositivos móviles y accesibilidad.

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Estilos**: Tailwind CSS v4
- **Base de datos**: Supabase (PostgreSQL + Realtime)
- **Despliegue**: Vercel

## Estructura de carpetas

```
app/            # Rutas y páginas principales (App Router)
components/     # Componentes reutilizables
ui/             # Componentes de UI compartidos
game/           # Lógica y vistas del juego
actions/        # Server Actions (mutaciones)
lib/            # Utilidades y helpers
supabase/       # Configuración y tipos de Supabase
types/          # Tipos y definiciones globales
utils/          # Funciones utilitarias
public/         # Recursos estáticos
```

## Principios de desarrollo

- **Server Components por defecto**; Client Components solo para interactividad.
- **Server Actions** para mutaciones y validaciones.
- **Acceso a base de datos solo desde el servidor** (respetando RLS).
- **Sincronización en tiempo real** usando Supabase Realtime.
- **Validación en el servidor**; la validación en cliente es solo para UX.
- **Código simple, legible y mantenible**.
- **Accesibilidad y experiencia de usuario como prioridad**.

## Instalación y desarrollo

1. Clona el repositorio:
   ```
   git clone <url-del-repositorio>
   ```
2. Instala dependencias:
   ```
   pnpm install
   ```
3. Configura las variables de entorno (ver `.env.example`).
4. Inicia el entorno de desarrollo:
   ```
   pnpm dev
   ```

## Supabase

- Usa los tipos generados automáticamente.
- RLS (Row Level Security) siempre activado.
- Nunca expone claves de servicio en el cliente.
- Acceso en cliente solo para sincronización en tiempo real.

## Contribución

- Sigue la estructura y convenciones del proyecto.
- Prefiere componentes pequeños y reutilizables.
- Documenta el código cuando la lógica no sea obvia.
- No cambies el stack ni introduzcas nuevas dependencias sin justificación.

## Licencia

MIT

---

> Desarrollado para fines educativos y recreativos.
