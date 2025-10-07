# Propuestas de UI para SOPHI v3.6.0

## 📐 Layout Solicitado

**Distribución:**
- **Izquierda:** Panel de Objetivo + Criterios
- **Centro:** Chat de conversación
- **Derecha:** Momentos + Progreso + Imágenes/Recursos

---

## 🎨 Propuesta 1: "Clean Focus" (Minimalista)

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  🎓 SOPHI        Identificación de Peligros        👤 Juan Pérez ▼   │
│                          HEADER (60px)                                │
├──────────────────┬────────────────────────┬──────────────────────────┤
│  Panel Objetivo  │     Chat Area          │  Momentos & Recursos     │
│   (320px)        │      (flex-1)          │       (360px)            │
│                  │                        │                          │
│  🎯 OBJETIVO     │  💬 Tutor:             │  📍 MOMENTOS             │
│  Identificar     │  ¿Qué peligros ves?    │  ✅ M0 - Motivación      │
│  peligros en     │                        │  ▶️  M1 - Saberes        │
│  trabajos de     │  👤 Estudiante:        │  🔒 M2 - Modelado        │
│  altura          │  Veo altura y...       │  🔒 M3 - Práctica        │
│                  │                        │  🔒 M4 - Autónoma        │
│  ✅ CRITERIOS    │  💬 Tutor:             │  🔒 M5 - Evaluación      │
│  ✓ Identifica 2  │  ¡Muy bien! Ahora...   │                          │
│    peligros      │                        │  📊 PROGRESO GENERAL     │
│  □ Explica       │                        │  ████████░░ 66%          │
│    consecuencia  │                        │  4 de 6 momentos         │
│  □ Menciona      │                        │                          │
│    controles     │                        │  🖼️ IMAGEN ACTUAL        │
│                  │                        │  ┌──────────────────┐    │
│  📈 SCORE        │                        │  │   [Almacén con   │    │
│  ████████░░ 65%  │                        │  │    estanterías]  │    │
│  65/100          │                        │  └──────────────────┘    │
│                  │                        │  📝 Trabajador en altura │
│                  │                        │     sin protección       │
└──────────────────┴────────────────────────┴──────────────────────────┘
```

### Paleta de Colores: "Calm Focus"
```css
--primary-blue: #3B82F6      /* Confianza, enfoque */
--secondary-green: #10B981   /* Crecimiento, logro */
--accent-indigo: #6366F1     /* Creatividad */
--success: #22C55E
--warning: #F59E0B
--error: #EF4444
--bg-main: #FFFFFF
--bg-secondary: #F8FAFC      /* slate-50 */
--text-primary: #1E293B      /* slate-800 */
--text-secondary: #64748B    /* slate-500 */
--border: #E2E8F0            /* slate-200 */
```

### Características Visuales
- **Panel Objetivo:** Fondo blanco, borde izquierdo grueso color primary
- **Criterios:** Checkboxes grandes con animación al marcar
- **Score:** Barra de progreso circular (ring) + porcentaje
- **Momentos:** Cards compactos con iconos de estado
- **Progreso:** Barra horizontal con gradiente (blue → green)
- **Imagen:** Border radius 12px, shadow suave, hover zoom

### Espaciado
- Padding interno: 1.5rem (24px)
- Gap entre secciones: 1rem (16px)
- Border radius: 8px (componentes), 12px (imágenes)

---

## 🎨 Propuesta 2: "Engaging Cards" (Más Visual)

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  🎓 SOPHI        Identificación de Peligros        👤 Juan Pérez ▼   │
│                          HEADER (60px)                                │
├──────────────────┬────────────────────────┬──────────────────────────┤
│  Panel Objetivo  │     Chat Area          │  Momentos & Recursos     │
│   (340px)        │      (flex-1)          │       (380px)            │
│                  │                        │                          │
│ ┌──────────────┐ │  💬 Tutor:             │ ┌────────────────────┐  │
│ │ 🎯 OBJETIVO  │ │  ¿Qué peligros ves?    │ │ 📍 TU PROGRESO     │  │
│ │              │ │                        │ │ ┌───┐ ┌───┐ ┌───┐  │  │
│ │ Identificar  │ │  👤 Estudiante:        │ │ │✅ │ │▶️ │ │🔒│  │  │
│ │ peligros en  │ │  Veo altura y...       │ │ │M0 │ │M1 │ │M2 │  │  │
│ │ trabajos de  │ │                        │ │ └───┘ └───┘ └───┘  │  │
│ │ altura       │ │  💬 Tutor:             │ │ ┌───┐ ┌───┐ ┌───┐  │  │
│ │              │ │  ¡Muy bien! Ahora...   │ │ │🔒│ │🔒│ │🔒│  │  │
│ └──────────────┘ │                        │ │ │M3 │ │M4 │ │M5 │  │  │
│                  │                        │ │ └───┘ └───┘ └───┘  │  │
│ ┌──────────────┐ │                        │ │                    │  │
│ │ ✅ CRITERIOS │ │                        │ │ ████████░░ 66%     │  │
│ │              │ │                        │ │ 4 de 6 completados │  │
│ │ ✅ Identifica│ │                        │ └────────────────────┘  │
│ │    2 peligros│ │                        │                          │
│ │ 🔄 Explica   │ │                        │ ┌────────────────────┐  │
│ │    consecuen.│ │                        │ │ 🖼️ RECURSO ACTUAL  │  │
│ │ ⏳ Menciona  │ │                        │ │ ┌────────────────┐ │  │
│ │    controles │ │                        │ │ │  [Almacén con  │ │  │
│ │              │ │                        │ │ │  estanterías]  │ │  │
│ └──────────────┘ │                        │ │ │                │ │  │
│                  │                        │ │ └────────────────┘ │  │
│ ┌──────────────┐ │                        │ │                    │  │
│ │ 📊 TU SCORE  │ │                        │ │ 📝 Trabajador en   │  │
│ │      65      │ │                        │ │    altura sin EPP  │  │
│ │    ⭐⭐⭐☆☆   │ │                        │ └────────────────────┘  │
│ │   de 100     │ │                        │                          │
│ └──────────────┘ │                        │ ┌────────────────────┐  │
│                  │                        │ │ 💡 CONSEJOS        │  │
└──────────────────┴────────────────────────┴──────────────────────────┘
```

### Paleta de Colores: "Deep Learning"
```css
--primary-deep: #1E40AF      /* Azul oscuro - Profesionalismo */
--secondary-teal: #14B8A6    /* Turquesa - Progreso */
--accent-violet: #8B5CF6     /* Violeta - Creatividad */
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--bg-main: #FFFFFF
--bg-secondary: #F1F5F9      /* slate-100 */
--bg-cards: #FFFFFF
--text-primary: #0F172A      /* slate-900 */
--text-secondary: #475569    /* slate-600 */
--border: #CBD5E1            /* slate-300 */
```

### Características Visuales
- **Cards con Shadow:** Todas las secciones son cards elevados (shadow-md)
- **Iconos de Estado:**
  - ✅ Verde (completado)
  - 🔄 Amarillo (en progreso)
  - ⏳ Gris (pendiente)
- **Score con Estrellas:** Visual rating + número
- **Momentos Grid:** Layout de cuadrícula 3x2
- **Imagen:** Card con descripción integrada abajo
- **Sección Consejos:** Tips pedagógicos contextuales

### Animaciones
- Cards: Hover → levantación suave (translateY -2px)
- Criterios: Check → animación de onda
- Progreso: Barra con gradiente animado
- Momentos: Pulso en momento activo

---

## 📊 Comparación de Propuestas

| Característica | Propuesta 1: Clean Focus | Propuesta 2: Engaging Cards |
|----------------|--------------------------|----------------------------|
| **Estilo** | Minimalista, profesional | Visual, gamificado |
| **Espaciado** | Compacto (320/360px) | Generoso (340/380px) |
| **Paleta** | Calm Focus (Azul + Verde) | Deep Learning (Azul oscuro + Turquesa) |
| **Cards** | Solo en imagen | Todas las secciones |
| **Progreso** | Barra circular + texto | Grid visual + barra + estrellas |
| **Iconos** | Emojis simples (✅▶️🔒) | Emojis + estados de color |
| **Mejor para** | Adultos, corporativo | Jóvenes adultos, más engagement |
| **Complejidad** | Baja | Media |

---

## 🔧 Componentes a Crear (Ambas Propuestas)

### Comunes
```typescript
// components/ui/objective-panel.tsx
- ObjectiveCard: Muestra objetivo principal
- CriteriaChecklist: Lista de criterios con checkboxes animados
- ScoreDisplay: Visualización de puntaje

// components/ui/moment-progress.tsx
- MomentList/Grid: Lista o grid de momentos
- ProgressBar: Barra de progreso general
- MomentCard: Card individual de momento

// components/ui/resource-viewer.tsx
- ImageCard: Imagen con descripción
- ResourcePanel: Panel de recursos/imágenes
```

### Específicos Propuesta 1
```typescript
- CircularScore: Ring progress para score
- CompactMomentList: Lista vertical compacta
```

### Específicos Propuesta 2
```typescript
- StarRating: Rating con estrellas
- MomentGrid: Grid 3x2 de momentos
- TipsCard: Card de consejos contextuales
```

---

## 🎯 Implementación Recomendada

### Tech Stack
- **Base:** Tailwind CSS v4 (ya instalado)
- **Componentes:** shadcn/ui (opcional, para aceleración)
- **Iconos:** Lucide React (consistencia)
- **Animaciones:** Tailwind transitions (nativo)

### Orden de Desarrollo
1. ✅ **Sistema de diseño** (`lib/design-system.ts`)
   - Exportar colores de paleta elegida
   - Exportar clases Tailwind reutilizables

2. ✅ **Componentes base** (`components/ui/`)
   - ObjectivePanel
   - CriteriaChecklist
   - ResourceViewer
   - MomentProgress

3. ✅ **Layout principal** (`app/student/lesson/[lessonId]/page.tsx`)
   - Integrar componentes
   - Conectar con estado de sesión
   - Manejar responsive (mobile: stack vertical)

4. ✅ **Interactividad**
   - Animaciones de transición
   - Checkmarks automáticos al cumplir criterio
   - Modal de imagen mejorado

---

## 📱 Responsive Design

### Mobile (<768px)
```
┌─────────────────────┐
│  Header (compacto)  │
├─────────────────────┤
│  Panel Objetivo     │
│  (colapsable)       │
├─────────────────────┤
│  Chat Area          │
│  (principal)        │
├─────────────────────┤
│  Momentos + Recursos│
│  (tabs)             │
└─────────────────────┘
```

### Tablet (768px - 1024px)
```
┌────────────────┬───────────────┐
│  Objetivo +    │  Chat Area    │
│  Criterios     │               │
│  (280px)       │               │
├────────────────┤               │
│  Momentos +    │               │
│  Recursos      │               │
│  (280px)       │               │
└────────────────┴───────────────┘
```

---

## 🚀 Próximos Pasos

**Por favor confirma:**
1. **¿Qué propuesta prefieres?**
   - A) Propuesta 1: Clean Focus (minimalista)
   - B) Propuesta 2: Engaging Cards (visual)

2. **¿Implementación?**
   - A) Con shadcn/ui (componentes pre-hechos)
   - B) Solo Tailwind CSS (más control)

Una vez confirmes, comenzaré con:
1. Sistema de diseño
2. Componentes base
3. Integración en layout actual
