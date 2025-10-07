# Propuesta UI Final - SOPHI v3.6.0

## 📐 Layout Definitivo

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎓 SOPHI         Identificación de Peligros y Evaluación de Riesgos    │
│                              HEADER (60px)                  👤 Juan ▼   │
├───────────────────────┬──────────────────────────┬─────────────────────┤
│   Panel Objetivo      │      Chat Area           │   Panel Recursos    │
│   & Criterios         │      (flex-1)            │   & Imagen          │
│   (360px)             │                          │   (340px)           │
│                       │                          │                     │
│ ┌───────────────────┐ │  💬 Tutor AI:            │ ┌─────────────────┐ │
│ │ 🎯 OBJETIVO       │ │  Imagina un día de       │ │                 │ │
│ │                   │ │  trabajo en el almacén   │ │   [IMAGEN]      │ │
│ │ Identificar       │ │  de suministros...       │ │                 │ │
│ │ peligros en el    │ │                          │ │  Almacén con    │ │
│ │ trabajo y evaluar │ │  ¿Qué dos peligros       │ │  estanterías    │ │
│ │ riesgos para      │ │  identificas en la       │ │  altas y        │ │
│ │ trabajar de forma │ │  situación de Pedro?     │ │  trabajador     │ │
│ │ segura            │ │                          │ │                 │ │
│ │                   │ │                          │ │                 │ │
│ └───────────────────┘ │  👤 Estudiante:          │ └─────────────────┘ │
│                       │  Veo que hay altura      │                     │
│ ┌───────────────────┐ │  y estantería            │ 📝 Descripción:     │
│ │ 📊 PROGRESO       │ │                          │ Trabajador a 5m     │
│ │ ████████░░ 66%    │ │  💬 Tutor AI:            │ de altura sin       │
│ │ 4 de 6 momentos   │ │  ¡Bien! Identificaste    │ línea de vida,      │
│ │                   │ │  la altura y la          │ levantando caja     │
│ │ [Click para ver]  │ │  estantería como         │ de 20 kg            │
│ └───────────────────┘ │  peligros...             │                     │
│                       │                          │                     │
│ ✅ CRITERIOS DE       │                          │                     │
│    EVALUACIÓN         │                          │                     │
│                       │                          │                     │
│ ✓ Identifica al menos │                          │                     │
│   2 peligros de la    │                          │                     │
│   situación           │                          │                     │
│                       │                          │                     │
│ □ Menciona una razón  │                          │                     │
│   por la cual es      │                          │                     │
│   peligroso           │                          │                     │
│                       │                          │                     │
│ □ Reconoce que la     │                          │                     │
│   importancia de la   │                          │                     │
│   seguridad           │                          │                     │
│                       │                          │                     │
│                       │                          │                     │
└───────────────────────┴──────────────────────────┴─────────────────────┘
```

## 🔽 Panel de Progreso EXPANDIDO (al hacer click)

```
┌───────────────────────────────────────────────────────────────────────┐
│   Panel Objetivo      │      Chat Area           │   Panel Recursos    │
│                       │                          │                     │
│ ┌───────────────────┐ │                          │                     │
│ │ 🎯 OBJETIVO       │ │                          │                     │
│ │ Identificar...    │ │                          │                     │
│ └───────────────────┘ │                          │                     │
│                       │                          │                     │
│ ┌───────────────────┐ │                          │                     │
│ │ 📊 PROGRESO       │ │                          │                     │
│ │ ████████░░ 66%    │ │                          │                     │
│ │ 4 de 6 momentos   │ │                          │                     │
│ │                   │ │                          │                     │
│ │ ✅ M0 · Motivación│ │                          │                     │
│ │    5 min          │ │                          │                     │
│ │                   │ │                          │                     │
│ │ ✅ M1 · Saberes   │ │                          │                     │
│ │    5 min          │ │                          │                     │
│ │                   │ │                          │                     │
│ │ ▶️  M2 · Modelado │ │                          │                     │
│ │    15 min         │ │                          │                     │
│ │                   │ │                          │                     │
│ │ 🔒 M3 · Práctica  │ │                          │                     │
│ │    Guiada 10 min  │ │                          │                     │
│ │                   │ │                          │                     │
│ │ 🔒 M4 · Práctica  │ │                          │                     │
│ │    Solo 10 min    │ │                          │                     │
│ │                   │ │                          │                     │
│ │ 🔒 M5 · Evaluación│ │                          │                     │
│ │    5 min          │ │                          │                     │
│ │                   │ │                          │                     │
│ │ [Click para ocultar]                           │                     │
│ └───────────────────┘ │                          │                     │
│                       │                          │                     │
│ ✅ CRITERIOS          │                          │                     │
│ ✓ Identifica 2...    │                          │                     │
│ □ Menciona razón...  │                          │                     │
└───────────────────────┴──────────────────────────┴─────────────────────┘
```

---

## 🎨 Paleta de Colores: "Calm Focus"

```css
/* Colores Principales */
--primary-blue: #3B82F6;        /* blue-500 - Confianza, enfoque */
--secondary-green: #10B981;     /* emerald-500 - Crecimiento, logro */
--accent-indigo: #6366F1;       /* indigo-500 - Creatividad */

/* Estados */
--success: #22C55E;             /* green-500 */
--warning: #F59E0B;             /* amber-500 */
--error: #EF4444;               /* red-500 */

/* Fondos */
--bg-main: #FFFFFF;
--bg-secondary: #F8FAFC;        /* slate-50 */
--bg-panel: #FAFAFA;            /* gray-50 */

/* Textos */
--text-primary: #1E293B;        /* slate-800 */
--text-secondary: #64748B;      /* slate-500 */
--text-muted: #94A3B8;          /* slate-400 */

/* Bordes */
--border-light: #E2E8F0;        /* slate-200 */
--border-medium: #CBD5E1;       /* slate-300 */
```

---

## 🧩 Componentes Principales

### 1. Panel Objetivo (Izquierda)

#### **ObjectiveCard**
```typescript
interface ObjectiveCardProps {
  objective: string;
}

// Características:
- Borde izquierdo grueso (4px) color primary-blue
- Padding generoso (1.5rem)
- Fondo bg-panel
- Texto grande (text-lg) con line-height relajado
- Icono 🎯 grande (text-2xl)
```

#### **ProgressBar (Colapsable)**
```typescript
interface ProgressBarProps {
  momentos: Momento[];
  currentMomento: string;
  onToggle: () => void;
  isExpanded: boolean;
}

// Estados:
- Colapsado: Muestra solo barra + texto "4 de 6 momentos" + "Click para ver"
- Expandido: Muestra lista completa de momentos con iconos de estado

// Interacción:
- Click en cualquier parte → toggle expand/collapse
- Transición suave (300ms ease-in-out)
- Altura animada (max-height)
```

#### **CriteriaChecklist**
```typescript
interface CriteriaChecklistProps {
  criterios: string[];
  criteriosCumplidos: string[];
}

// Características:
- Checkboxes grandes (w-5 h-5)
- Animación al marcar (scale + fade)
- Color verde para cumplidos
- Color gris para pendientes
- Texto wrap en múltiples líneas
```

---

### 2. Panel Chat (Centro)

#### **ChatMessage**
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  messageType?: string;
}

// Estilos:
- User: bg-primary-blue, text-white, self-end
- Assistant: bg-white, border, self-start
- Border-radius: 12px
- Max-width: 70%
- Shadow suave
- Markdown rendering
```

---

### 3. Panel Recursos (Derecha)

#### **ImageViewer**
```typescript
interface ImageViewerProps {
  image: {
    url: string;
    descripcion: string;
  };
  onImageClick: () => void;
}

// Layout:
┌─────────────────┐
│                 │
│   [IMAGEN]      │  ← Ocupa 60% altura del panel
│                 │
└─────────────────┘
📝 Descripción      ← Ocupa 40% restante
Texto de la
descripción aquí

// Características:
- Imagen: aspect-ratio 4:3, object-fit cover
- Hover: cursor pointer + brightness(1.05)
- Click: Abre modal fullscreen
- Descripción: padding 1rem, text-sm, line-height relaxed
```

---

## 📏 Dimensiones y Espaciado

### Anchos de Paneles
```css
.panel-objetivo {
  width: 360px;
  min-width: 360px;
}

.panel-chat {
  flex: 1;
  min-width: 400px;
}

.panel-recursos {
  width: 340px;
  min-width: 340px;
}
```

### Espaciado Interno
```css
.panel-padding {
  padding: 1.5rem; /* 24px */
}

.section-gap {
  gap: 1rem; /* 16px */
}

.component-gap {
  gap: 0.75rem; /* 12px */
}
```

### Border Radius
```css
.card-radius {
  border-radius: 8px;
}

.image-radius {
  border-radius: 12px;
}

.message-radius {
  border-radius: 12px;
}
```

---

## 🎭 Estados Visuales

### Criterios
```css
/* Cumplido */
.criterio-cumplido {
  color: var(--success);
  text-decoration: line-through;
  opacity: 0.8;
}

/* Pendiente */
.criterio-pendiente {
  color: var(--text-secondary);
}

/* En progreso (opcional) */
.criterio-progreso {
  color: var(--warning);
  font-weight: 500;
}
```

### Momentos
```css
/* Completado */
.momento-completado {
  background: #DCFCE7; /* green-100 */
  border-left: 4px solid var(--success);
}

/* Activo */
.momento-activo {
  background: #DBEAFE; /* blue-100 */
  border-left: 4px solid var(--primary-blue);
}

/* Bloqueado */
.momento-bloqueado {
  background: #F1F5F9; /* slate-100 */
  opacity: 0.6;
  border-left: 4px solid var(--border-medium);
}
```

---

## 🔄 Interacciones

### 1. Progress Bar Toggle
```typescript
// Estado inicial: Colapsado
const [isExpanded, setIsExpanded] = useState(false);

// Click handler
<div
  onClick={() => setIsExpanded(!isExpanded)}
  className="cursor-pointer transition-all duration-300"
>
  {/* Contenido */}
</div>

// Animación
<div className={`
  overflow-hidden transition-all duration-300 ease-in-out
  ${isExpanded ? 'max-h-96' : 'max-h-0'}
`}>
  {/* Lista de momentos */}
</div>
```

### 2. Imagen Click → Modal
```typescript
const [modalImage, setModalImage] = useState<Image | null>(null);

// Click en imagen
<img
  onClick={() => setModalImage(image)}
  className="cursor-pointer hover:brightness-105 transition"
/>

// Modal
{modalImage && (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
    <img src={modalImage.url} className="max-w-90vw max-h-90vh" />
    <button onClick={() => setModalImage(null)}>✕</button>
  </div>
)}
```

---

## 📱 Responsive Design

### Desktop (>1024px)
- Layout de 3 columnas como se muestra arriba

### Tablet (768px - 1024px)
```
┌────────────────┬──────────────┐
│  Objetivo +    │  Chat        │
│  Criterios     │              │
│  (300px)       │              │
├────────────────┤              │
│  Recursos +    │              │
│  Imagen        │              │
│  (300px)       │              │
└────────────────┴──────────────┘
```

### Mobile (<768px)
```
┌─────────────────┐
│  Header         │
├─────────────────┤
│  Objetivo       │
│  (colapsable)   │
├─────────────────┤
│  Chat           │
│  (principal)    │
├─────────────────┤
│  Recursos       │
│  (tab drawer)   │
└─────────────────┘
```

---

## 🛠️ Stack Técnico

### Base
- **Framework:** Next.js 14 (ya instalado)
- **Styling:** Tailwind CSS v4 (ya instalado)
- **Icons:** Lucide React (a instalar)
- **Markdown:** react-markdown (ya instalado)

### Opcional
- **Animations:** Framer Motion (suavidad extra)
- **Components:** shadcn/ui (acelera desarrollo)

---

## 📦 Archivos a Crear

```
lib/
  design-system.ts           # Colores, clases reutilizables

components/ui/
  objective-card.tsx         # Card de objetivo
  progress-bar.tsx           # Barra de progreso colapsable
  moment-list.tsx            # Lista de momentos (expandida)
  criteria-checklist.tsx     # Checklist de criterios
  image-viewer.tsx           # Visor de imagen + descripción
  chat-message.tsx           # Mensaje de chat mejorado

app/student/lesson/[lessonId]/
  page.tsx                   # Layout refactorizado (3 columnas)
  components/
    left-panel.tsx          # Panel objetivo + criterios
    right-panel.tsx         # Panel recursos + imagen
```

---

## 🚀 Plan de Implementación

### Fase 1: Setup (30 min)
1. Crear `lib/design-system.ts` con colores
2. Instalar lucide-react: `npm install lucide-react`
3. Configurar Tailwind con colores custom

### Fase 2: Componentes (2 horas)
1. ObjectiveCard
2. ProgressBar (colapsable)
3. CriteriaChecklist
4. ImageViewer
5. ChatMessage (refactor)

### Fase 3: Layout (1 hora)
1. Refactorizar page.tsx con 3 columnas
2. Integrar componentes
3. Conectar con estado de sesión

### Fase 4: Interactividad (30 min)
1. Toggle progress bar
2. Modal de imagen
3. Animaciones de transición

### Fase 5: Responsive (1 hora)
1. Breakpoints Tailwind
2. Layout mobile/tablet
3. Testing en diferentes pantallas

---

## ✅ Checklist de Desarrollo

- [ ] Sistema de diseño con colores
- [ ] Componente ObjectiveCard
- [ ] Componente ProgressBar (colapsable)
- [ ] Componente CriteriaChecklist
- [ ] Componente ImageViewer
- [ ] Refactorizar ChatMessage
- [ ] Layout 3 columnas en page.tsx
- [ ] Integrar tracking de criterios cumplidos
- [ ] Animación toggle progress bar
- [ ] Modal de imagen fullscreen
- [ ] Responsive mobile
- [ ] Responsive tablet
- [ ] Testing completo

---

## 🎯 Resultado Final

**Antes:**
- ❌ Objetivo NO visible
- ❌ Criterios NO mostrados
- ❌ Progreso solo barra general
- ❌ Imagen en chat (pequeña)

**Después:**
- ✅ Objetivo dedicado (panel izquierdo)
- ✅ Criterios con checkmarks automáticos
- ✅ Progreso detallado (colapsable) con lista de momentos
- ✅ Imagen grande (panel derecho) + descripción
- ✅ Layout claro de 3 columnas
- ✅ Paleta educativa (calma + enfoque)

---

**¿Comenzamos con la implementación?** 🚀
