# Sistema de Diseño - Tutti Frutti 🎨

## Tailwind CSS v4

## 📋 Índice

- [Introducción](#introducción)
- [Instalación](#instalación)
- [Tokens de Diseño](#tokens-de-diseño)
- [Uso Básico](#uso-básico)
- [Cambios en v4](#cambios-en-v4)
- [Componentes](#componentes)
- [Mejores Prácticas](#mejores-prácticas)

## 🎯 Introducción

Este sistema de diseño está optimizado para **Tailwind CSS v4** y proporciona tokens consistentes y reutilizables para tu aplicación de Tutti Frutti.

### ✨ Características

- ✅ **CSS-first:** Configuración directamente en CSS (no necesitas JavaScript)
- ✅ Paleta de colores vibrante y coherente
- ✅ Sistema de espaciado uniforme
- ✅ Tipografía escalable
- ✅ Componentes predefinidos
- ✅ Tema oscuro incluido
- ✅ Animaciones suaves

## 🚀 Instalación

### 1. Instala las dependencias

```bash
npm install tailwindcss @tailwindcss/postcss
```

**Importante en v4:**

- NO necesitas `autoprefixer` (ya está incluido)
- El paquete cambió a `@tailwindcss/postcss`

### 2. Copia los archivos

Coloca estos archivos en tu proyecto:

```
├── globals.css              # ⭐ PRINCIPAL - Estilos y tokens
├── postcss.config.js        # Configuración de PostCSS
└── tailwind.config.js       # ⚠️ OPCIONAL (no necesario en v4)
```

### 3. Configura PostCSS

Asegúrate de que tu `postcss.config.js` usa el plugin correcto:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 4. Importa globals.css

En tu archivo principal (ej: `_app.js`, `layout.js`, o `main.jsx`):

```javascript
import "./globals.css";
```

### 5. ¡Listo! 🎉

Ya puedes usar todos los tokens y componentes en tu aplicación.

## 🆕 Cambios Importantes en Tailwind v4

### Sintaxis de Imports

❌ **Antes (v3):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

✅ **Ahora (v4):**

```css
@import "tailwindcss";
```

### Configuración

❌ **Antes (v3):** Configuración en `tailwind.config.js` con JavaScript

✅ **Ahora (v4):** Configuración en CSS con la directiva `@theme`

```css
@theme {
  --color-primary: #9333ea;
  --font-display: "Poppins", sans-serif;
  --spacing-xl: 2rem;
}
```

### PostCSS

❌ **Antes (v3):**

```javascript
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

✅ **Ahora (v4):**

```javascript
{
  plugins: {
    '@tailwindcss/postcss': {},
  }
}
```

### No Necesitas tailwind.config.js

En v4, la configuración vive en tu CSS. El archivo `tailwind.config.js` es **opcional** y solo necesario para casos avanzados.

## 🎨 Tokens de Diseño

### Colores

Los colores se definen en `@theme` y generan automáticamente las clases de utilidad:

```css
@theme {
  --color-primary: #9333ea;
  --color-secondary: #fb923c;
}
```

Esto crea las clases:

- `bg-primary`, `text-primary`, `border-primary`
- `bg-secondary`, `text-secondary`, `border-secondary`

#### Uso en HTML

```jsx
<button className="bg-primary text-white hover:bg-primary-hover">
  Iniciar Juego
</button>

<div className="bg-surface border border-border">
  Card
</div>
```

### Espaciado

```jsx
<div className="p-md">        {/* padding: 1rem */}
<div className="m-lg">        {/* margin: 1.5rem */}
<div className="gap-sm">      {/* gap: 0.5rem */}

// Tokens disponibles: xs, sm, md, lg, xl, 2xl, 3xl
```

### Border Radius

```jsx
<div className="rounded-card">    {/* 1rem */}
<div className="rounded-button">  {/* 0.75rem */}
<div className="rounded-input">   {/* 0.5rem */}
<div className="rounded-lg">      {/* 0.75rem */}
```

### Tipografía

```jsx
// Tamaños
<h1 className="text-4xl font-display font-bold">Título</h1>
<p className="text-base">Texto normal</p>
<span className="text-sm text-text-secondary">Pequeño</span>

// Familias
<h2 className="font-display">Títulos (Poppins)</h2>
<p className="font-sans">Texto (Inter)</p>
<code className="font-mono">Código</code>
```

## 💻 Uso Básico

### Ejemplo 1: Botón

```jsx
<button className="btn btn-primary px-6 py-3">Iniciar Juego</button>
```

### Ejemplo 2: Card de Categoría

```jsx
<div className="card hover:shadow-lg transition-all">
  <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
    Nombre de Persona
  </h3>
  <input className="input" placeholder="Tu respuesta..." />
</div>
```

### Ejemplo 3: Badge de Estado

```jsx
<span className="badge badge-success">✓ Correcto</span>
<span className="badge badge-warning">⏱️ 30s</span>
<span className="badge badge-error">✗ Error</span>
```

## 🧩 Componentes Predefinidos

Todos estos componentes están listos para usar sin configuración adicional:

### Botones

```jsx
<button className="btn btn-primary">Primario</button>
<button className="btn btn-secondary">Secundario</button>
<button className="btn btn-outline">Outline</button>
```

### Cards

```jsx
<div className="card">Contenido</div>
<div className="card-elevated">Card con más sombra</div>
```

### Inputs

```jsx
<input className="input" placeholder="Escribe aquí..." />
```

### Badges

```jsx
<span className="badge badge-success">Éxito</span>
<span className="badge badge-warning">Advertencia</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-info">Info</span>
```

## 🎭 Animaciones

### Clases de Animación

```jsx
<div className="animate-fade-in">Aparece suavemente</div>
<div className="animate-slide-up">Sube desde abajo</div>
<div className="animate-scale-in">Crece desde el centro</div>
```

### Variables de Transición

```jsx
<button className="transition-all duration-[var(--transition-fast)]">
  Rápido (150ms)
</button>

<button className="transition-all duration-[var(--transition-base)]">
  Normal (200ms)
</button>
```

## 🌓 Tema Oscuro

Para activar el tema oscuro, agrega la clase `dark` al elemento `<html>`:

```jsx
// En tu componente principal
<html className="dark">
  <body>{/* Todo se adapta automáticamente */}</body>
</html>
```

O dinámicamente con JavaScript:

```javascript
// Toggle dark mode
document.documentElement.classList.toggle("dark");
```

## ✨ Mejores Prácticas

### 1. Usa los Tokens Definidos

❌ **Evita:**

```jsx
<div className="bg-purple-600 rounded-[12px] p-4">
```

✅ **Mejor:**

```jsx
<div className="bg-primary rounded-lg p-md">
```

### 2. Aprovecha los Componentes Predefinidos

❌ **Evita repetir estilos:**

```jsx
<button className="inline-flex items-center justify-center rounded-lg bg-primary text-white ...">
```

✅ **Usa las clases de componentes:**

```jsx
<button className="btn btn-primary px-6 py-3">
```

### 3. Variables CSS para Valores Dinámicos

```jsx
// Si necesitas acceder desde JavaScript
const borderRadius = getComputedStyle(document.documentElement)
  .getPropertyValue('--radius-card');

// Para estilos inline
<div style={{ borderRadius: 'var(--radius-card)' }}>
```

### 4. Colores de Categorías

Usa los colores de acento para diferenciar categorías:

```jsx
const categoryColors = {
  'Nombre': 'accent-1',    // verde
  'Ciudad': 'accent-2',    // azul
  'Animal': 'accent-3',    // rosa
  'Fruta': 'accent-4',     // amarillo
};

<div className={`bg-${categoryColors['Nombre']}`}>
```

## 🎯 Casos de Uso

### Pantalla de Juego Completa

```jsx
function GameScreen() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border p-lg sticky top-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-primary">
            Tutti Frutti
          </h1>
          <span className="badge badge-info">Letra: A</span>
        </div>
      </header>

      {/* Grid de Categorías */}
      <main className="container mx-auto p-lg">
        <div className="grid grid-cols-2 gap-md">
          <div className="card">
            <h3 className="font-semibold mb-sm">Nombre</h3>
            <input className="input" placeholder="Ej: Ana" />
          </div>
          {/* Más categorías... */}
        </div>

        <button className="btn btn-primary w-full mt-lg py-3">
          ¡Tutti Frutti!
        </button>
      </main>
    </div>
  );
}
```

### Modal de Resultado

```jsx
function ResultModal({ score, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-[var(--radius-modal)] shadow-xl max-w-md w-full p-xl animate-scale-in">
        <h2 className="font-display text-3xl font-bold mb-md">
          ¡Puntuación! 🎉
        </h2>

        <div className="bg-primary/10 rounded-lg p-lg text-center mb-lg">
          <p className="text-5xl font-bold text-primary">{score}</p>
        </div>

        <button onClick={onClose} className="btn btn-primary w-full">
          Continuar
        </button>
      </div>
    </div>
  );
}
```

## 🔧 Personalización Avanzada

### Agregar Nuevos Colores

Edita `globals.css`:

```css
@theme {
  /* Agrega tu nuevo color */
  --color-custom: #ff6b6b;
}
```

Automáticamente tendrás disponible: `bg-custom`, `text-custom`, etc.

### Agregar Nuevas Animaciones

```css
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-custom {
  animation: bounce 1s infinite;
}
```

## 📚 Recursos Adicionales

- [Documentación oficial de Tailwind v4](https://tailwindcss.com/docs)
- [Guía de migración v3 → v4](https://tailwindcss.com/docs/upgrade-guide)
- [Directiva @theme](https://tailwindcss.com/docs/theme)

## ⚠️ Problemas Comunes

### Error: "@tailwind base is no longer available"

✅ **Solución:** Cambiar a `@import "tailwindcss"` en lugar de `@tailwind base/components/utilities`

### Los colores no funcionan

✅ **Solución:** Asegúrate de que están definidos en `@theme`, no solo en `:root`

### tailwind.config.js no se reconoce

✅ **Solución:** En v4 no lo necesitas. Mueve la configuración a CSS con `@theme`

---

¡Ahora estás listo para crear una interfaz hermosa y consistente para tu Tutti Frutti con Tailwind v4! 🎨✨
