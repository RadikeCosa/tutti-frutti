# 📄 Plan de Desarrollo — Tutti Frutti Multiplayer (Roadmap Técnico)

## 🎯 Objetivo del Proyecto

Construir un juego multiplayer realtime tipo Tutti-Frutti con:

sincronización en tiempo real

estado consistente del juego

arquitectura mantenible

UX clara y rápida

seguridad con RLS

## 🧱 Stack (No Cambiar)

Framework: Next.js App Router

Database + Realtime: Supabase

Styling: Tailwind CSS

Deploy: Vercel

### 🚀 Fase 0 — Setup del Proyecto

#### Objetivo: Base Funcional

Base funcional con infraestructura correcta.

#### Tareas

Crear proyecto Next.js.

Configurar Tailwind.

Configurar Supabase.

Generar tipos con Supabase CLI.

Crear:

lib/supabase/client.ts
lib/supabase/server.ts

Configurar variables de entorno.

Configurar ESLint + TypeScript strict.

#### Done cuando

✅ App corre localmente
✅ Conexión Supabase funciona
✅ Tipos generados
✅ Deploy en Vercel ok

### 🗄️ Fase 1 — Modelo de Datos (CRÍTICO)

#### Objetivo: Schema Consistente

Schema consistente con reglas del juego.

Tablas

salas

jugadores

rondas

respuestas

Tareas

Definir schema SQL.

Definir relaciones.

Crear índices.

Implementar RLS.

Definir ownership rules.

Seed básico.

Done cuando

✅ Se puede crear sala manualmente
✅ RLS bloquea accesos indebidos
✅ Relaciones funcionan

### 🔐 Fase 2 — Autenticación y Sesión

(simple, no overengineering)

#### Objetivo: Identidad Básica

Identidad básica de jugador.

Opciones MVP

anonymous session

guest name

Tareas

join session

persist player identity

asociar jugador a sala

#### Done cuando

✅ Usuario tiene identidad persistente
✅ Puede entrar a sala

### 🏠 Fase 3 — Crear y Unirse a Sala

#### Objetivo: Flujo Mínimo

Flujo mínimo del juego.

Features

crear sala

generar room code

unirse por código

crear organizer

lista de jugadores

Tareas

Server Actions para:

create room

join room

Validación room code.

UI lobby básica.

#### Done cuando

✅ 2 usuarios pueden entrar a misma sala

### ⚡ Fase 4 — Realtime Base

#### Objetivo: Sincronización

Sincronización de sala.

Eventos

player join/leave

room updates

Tareas

canal realtime por sala

subscribe/unsubscribe

reconnection handling

resync inicial

#### Done cuando

✅ Jugadores ven cambios sin refresh

### 🎮 Fase 5 — Estado del Juego (State Machine)

#### Objetivo: State Machine

Implementar machine de estados.

Estados

lobby

escribiendo

puntuando

resultado_ronda

finalizada

Tareas

transición de estados

validación organizer-only

locking de estados

persistencia

Done cuando

✅ Estados no pueden romperse
✅ Transiciones seguras

### 🔤 Fase 6 — Sistema de Rondas

#### Objetivo: Motor del Juego

Motor del juego.

Features

crear ronda

letra aleatoria

categorías configurables

ronda activa única

Done cuando

✅ Sala tiene ronda activa consistente

### ✍️ Fase 7 — Envío de Respuestas

#### Objetivo: Gameplay Principal

Gameplay principal.

Features

formulario respuestas

una respuesta por categoría

validación server

persistencia

locking después de envío

#### Done cuando

✅ Respuestas guardadas correctamente

### 📊 Fase 8 — Scoring (Organizer)

#### Objetivo: Sistema de Puntaje

Sistema de puntaje.

Features

organizer puntúa

score por categoría

total por ronda

acumulado por jugador

Done cuando

✅ Ranking correcto

### 🧮 Fase 9 — Resultados y Ranking

#### Objetivo: Feedback Visual

Feedback del juego.

Features

resultados ronda

ranking general

historial

Done cuando

✅ Usuarios ven resultados sincronizados

### 🧱 Fase 10 — Robustez y Edge Cases

#### Objetivo: Sistema Estable

Sistema estable.

Casos

reconexión

jugador abandona

timeout ronda

duplicados

conflictos realtime

Done cuando

✅ Sistema no rompe en escenarios reales

### 📱 Fase 11 — UX y Accesibilidad

#### Objetivo: Experiencia de Usuario

Experiencia real de usuario.

Mejoras

loading states

error boundaries

feedback visual

mobile-first

accesibilidad

### 🚀 Fase 12 — Optimización

#### Objetivo: Rendimiento

Performance.

Tareas

optimizar queries

reducir re-renders

mejorar realtime

índices DB

### ⭐ Fase 13 — Features Avanzadas (Opcional)

presence tracking (quién está conectado)

timers de ronda

auto scoring rules

chat de sala

historial partidas

### 🧠 Principios de Desarrollo (Siempre)

Antes de cada feature:

¿Esto rompe RLS?

¿Esto necesita realtime?

¿Debe correr en server?

¿El estado es consistente?

¿Hay race condition?

¿Es el diseño más simple?

### ⭐ Estrategia de trabajo recomendada

Orden real de implementación:

Setup
→ DB schema
→ join room
→ realtime
→ state machine
→ rounds
→ answers
→ scoring
→ resultados
→ robustez

Nunca al revés.
