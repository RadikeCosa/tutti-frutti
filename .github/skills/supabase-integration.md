# Skill: Supabase Integration - Tutti Frutti

## Setup

### Cliente Supabase

```typescript
// lib/supabase/client.ts patrón
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
```

### Variables de Entorno

Ya configuradas en `.env.local` y Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Schema de Tablas

### salas

```sql
id: uuid (primary key, default: gen_random_uuid())
codigo: varchar(6) (unique, not null)
organizador_id: uuid (references jugadores.id)
categorias: text[] (array de 5 strings)
estado: varchar (check: 'lobby' | 'escribiendo' | 'puntuando' | 'resultado_ronda' | 'finalizada')
created_at: timestamp (default: now())
```

**Índices necesarios:**

- `codigo` (unique)
- `estado` (para queries de salas activas)

### jugadores

```sql
id: uuid (primary key, default: gen_random_uuid())
sala_id: uuid (references salas.id, on delete cascade)
nombre: varchar(50) (not null)
es_organizador: boolean (default: false)
listo: boolean (default: false)
created_at: timestamp (default: now())
```

**Índices necesarios:**

- `sala_id` (muchas queries filtran por sala)
- Composite: `(sala_id, es_organizador)` para encontrar organizador rápido

### rondas

```sql
id: uuid (primary key, default: gen_random_uuid())
sala_id: uuid (references salas.id, on delete cascade)
numero: integer (not null)
letra: char(1) (not null)
estado: varchar (check: 'escribiendo' | 'puntuando' | 'completada')
created_at: timestamp (default: now())
```

**Índices necesarios:**

- Composite: `(sala_id, numero)` (unique)
- `sala_id` para queries de rondas por sala

### respuestas

```sql
id: uuid (primary key, default: gen_random_uuid())
ronda_id: uuid (references rondas.id, on delete cascade)
jugador_id: uuid (references jugadores.id, on delete cascade)
categoria_index: integer (check: between 0 and 4)
texto: text (nullable, puede estar vacío)
puntos: integer (default: 0)
created_at: timestamp (default: now())
```

**Índices necesarios:**

- Composite: `(ronda_id, jugador_id, categoria_index)` (unique)
- `ronda_id` para queries de respuestas por ronda

## Row Level Security (RLS)

### Políticas Requeridas

**salas:**

- SELECT: Público (cualquiera puede ver salas por código)
- INSERT: Público (cualquiera puede crear sala)
- UPDATE: Solo organizador de esa sala
- DELETE: Solo organizador de esa sala

**jugadores:**

- SELECT: Cualquiera que esté en la misma sala
- INSERT: Público (para unirse)
- UPDATE: Solo el propio jugador (para marcar "listo")
- DELETE: Organizador de la sala O el propio jugador

**rondas:**

- SELECT: Cualquiera en la sala
- INSERT/UPDATE: Solo organizador
- DELETE: Solo organizador

**respuestas:**

- SELECT: Cualquiera en la sala PERO solo después de que ronda esté en "puntuando"
- INSERT: Solo el jugador dueño de la respuesta
- UPDATE: Solo organizador (para asignar puntos)
- DELETE: Solo el jugador dueño O organizador

## Realtime Configuration

### Canales a habilitar

```sql
-- En Supabase Dashboard > Settings > Realtime
Habilitar realtime en:
- salas (cambios de estado)
- jugadores (nuevos jugadores, estado "listo")
- respuestas (puntos asignados) <- SOLO durante puntuación
```

### Patrón de Subscription

```typescript
// Ejemplo: escuchar jugadores de una sala
useEffect(() => {
  const channel = supabase
    .channel(`sala-${salaId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jugadores",
        filter: `sala_id=eq.${salaId}`,
      },
      (payload) => {
        // Manejar cambio
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [salaId]);
```

## Queries Comunes

### Crear sala

```typescript
const { data, error } = await supabase
  .from("salas")
  .insert({
    codigo: generarCodigo(),
    estado: "lobby",
  })
  .select()
  .single();
```

### Crear organizador

```typescript
const { data, error } = await supabase
  .from("jugadores")
  .insert({
    sala_id: salaId,
    nombre: nombre,
    es_organizador: true,
  })
  .select()
  .single();
```

### Unirse a sala

```typescript
// 1. Validar código
const { data: sala } = await supabase
  .from("salas")
  .select("id, estado")
  .eq("codigo", codigo)
  .single();

// 2. Validar que esté en lobby
if (sala.estado !== "lobby") throw new Error("Partida ya comenzó");

// 3. Crear jugador
const { data: jugador } = await supabase
  .from("jugadores")
  .insert({
    sala_id: sala.id,
    nombre: nombre,
  })
  .select()
  .single();
```

### Obtener jugadores de sala

```typescript
const { data: jugadores } = await supabase
  .from("jugadores")
  .select("id, nombre, es_organizador, listo")
  .eq("sala_id", salaId)
  .order("created_at", { ascending: true });
```

### Actualizar categorías

```typescript
const { error } = await supabase
  .from("salas")
  .update({ categorias: [cat1, cat2, cat3, cat4, cat5] })
  .eq("id", salaId);
```

### Iniciar juego / crear ronda

```typescript
// 1. Actualizar estado sala
await supabase.from("salas").update({ estado: "escribiendo" }).eq("id", salaId);

// 2. Crear primera ronda
const { data: ronda } = await supabase
  .from("rondas")
  .insert({
    sala_id: salaId,
    numero: 1,
    letra: generarLetra(),
    estado: "escribiendo",
  })
  .select()
  .single();
```

### Guardar respuestas

```typescript
// Insertar todas de una vez (upsert por si el jugador reenvía)
const respuestas = categorias.map((_, index) => ({
  ronda_id: rondaId,
  jugador_id: jugadorId,
  categoria_index: index,
  texto: valores[index] || "",
}));

await supabase.from("respuestas").upsert(respuestas, {
  onConflict: "ronda_id,jugador_id,categoria_index",
});
```

### Marcar jugador listo

```typescript
await supabase.from("jugadores").update({ listo: true }).eq("id", jugadorId);
```

### Obtener respuestas para puntuar (por categoría)

```typescript
const { data: respuestas } = await supabase
  .from("respuestas")
  .select("id, texto, puntos")
  .eq("ronda_id", rondaId)
  .eq("categoria_index", categoriaIndex)
  .order("id", { ascending: true }); // Orden consistente pero anónimo
```

### Asignar puntos

```typescript
await supabase
  .from("respuestas")
  .update({ puntos: puntaje })
  .eq("id", respuestaId);
```

### Obtener resultados de ronda

```typescript
const { data } = await supabase
  .from("respuestas")
  .select(
    `
    jugador_id,
    categoria_index,
    texto,
    puntos,
    jugadores (nombre)
  `,
  )
  .eq("ronda_id", rondaId)
  .order("jugador_id");
```

### Calcular ranking acumulado

```typescript
const { data } = await supabase
  .from("respuestas")
  .select(
    `
    jugador_id,
    puntos,
    jugadores (nombre)
  `,
  )
  .in("ronda_id", rondaIds); // Todas las rondas de la sala

// Luego agrupar y sumar en cliente
```

## Migraciones

### Orden de creación

1. Crear tabla `salas`
2. Crear tabla `jugadores` (con FK a salas)
3. Actualizar `salas` agregando FK a `jugadores(id)` para organizador
4. Crear tabla `rondas` (con FK a salas)
5. Crear tabla `respuestas` (con FK a rondas y jugadores)
6. Crear índices
7. Habilitar RLS en todas
8. Crear políticas RLS
9. Habilitar Realtime

## Error Handling

### Errores Comunes

- **Código duplicado**: Regenerar hasta obtener único
- **Sala no existe**: Mostrar error claro
- **Partida ya empezó**: No permitir unirse
- **Jugador no es organizador**: Bloquear acciones
- **Realtime desconectado**: Mostrar banner de reconexión

### Retry Logic

```typescript
// Para operaciones críticas
let intentos = 0;
while (intentos < 3) {
  try {
    const result = await operacionSupabase();
    return result;
  } catch (error) {
    intentos++;
    if (intentos === 3) throw error;
    await sleep(1000 * intentos);
  }
}
```

## Performance Tips

1. **Select específico**: Nunca `select('*')`, siempre columnas necesarias
2. **Batch inserts**: Insertar múltiples respuestas de una vez
3. **Subscription única**: Un canal por sala, no por tabla
4. **Índices compuestos**: Para queries con múltiples filtros
5. **Cascade deletes**: Al borrar sala, todo se limpia automáticamente

## Tipos TypeScript

Generar tipos desde Supabase:

```bash
npx supabase gen types typescript --project-id [PROJECT_ID] > lib/supabase/types.ts
```

Usar en código:

```typescript
import type { Database } from "@/lib/supabase/types";

type Sala = Database["public"]["Tables"]["salas"]["Row"];
type InsertSala = Database["public"]["Tables"]["salas"]["Insert"];
```
