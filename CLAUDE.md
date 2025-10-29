# CLAUDE.md - Guía Completa para LLMs trabajando con Instructoria

Este archivo proporciona toda la información necesaria para que Claude Code (claude.ai/code) u otros LLMs puedan trabajar eficientemente con este repositorio.

## ⚠️ REGLA IMPORTANTE: NO INICIAR SERVIDOR DE DESARROLLO

**NUNCA ejecutes `npm run dev` automáticamente.** En su lugar:

1. Realiza todos los cambios de código necesarios
2. Verifica tipos con `npx tsc --noEmit`
3. Al finalizar, indica al usuario:
   ```
   ✅ Cambios completados

   Para probar, ejecuta:
   npm run dev

   Luego visita: http://localhost:3000
   ```

**Razón:** Múltiples instancias del servidor causan conflictos de puertos y el usuario debe tener control manual del proceso de desarrollo.

---

## 🎯 Contexto del Proyecto

**Instructoria** es una plataforma educativa que utiliza instructores IA conversacionales (Claude de Anthropic) para crear experiencias de aprendizaje personalizadas. El sistema incluye verificación de comprensión automática, memoria persistente, moderación de contenido y manejo inteligente de preguntas on-topic y off-topic.

### Características Principales
- ✅ Instructores IA especializados por materia (SSO, Tecnología, etc.)
- ✅ Conversación natural con preguntas y repreguntas
- ✅ Verificación de comprensión automática mediante IA
- ✅ Memoria persistente para cada estudiante
- ✅ Moderación de contenido en tiempo real
- ✅ Manejo inteligente de preguntas on-topic y off-topic
- ✅ Guardrails contra contenido inapropiado
- ✅ Tracking de progreso granular por actividad

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (Neon) con Prisma ORM
- **IA:** Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Autenticación:** NextAuth.js con Google OAuth (preparado pero no implementado aún)
- **Imágenes:** MCP Server personalizado que sirve imágenes educativas desde Azure Blob Storage
- **Deployment:** Vercel

## 📁 Estructura Detallada del Proyecto

```
instructoria/
├── 📄 Archivos de Configuración
│   ├── package.json              # Dependencias y scripts
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── next.config.js            # Configuración Next.js
│   ├── tailwind.config.ts        # Configuración TailwindCSS
│   ├── postcss.config.js         # Configuración PostCSS
│   ├── components.json           # Configuración shadcn/ui
│   ├── .env                      # Variables de entorno (NO COMMIT)
│   ├── .env.example              # Ejemplo de variables
│   └── .gitignore                # Archivos ignorados por git
│
├── 🗄️ prisma/
│   ├── schema.prisma             # ⭐ Schema completo de la BD
│   └── seed.ts                   # ⭐ Datos iniciales (SSO + IPERC)
│
├── 🔧 scripts/
│   ├── test-session.ts           # ⭐ Crear sesión de prueba
│   ├── db-clean.ts               # Limpiar base de datos
│   └── check-env.js              # Verificar variables de entorno
│
└── 💻 src/
    ├── 📱 app/                   # Next.js App Router
    │   ├── api/                  # 🌐 API Routes
    │   │   ├── chat/
    │   │   │   └── route.ts      # ⭐ POST /api/chat
    │   │   ├── session/
    │   │   │   ├── start/
    │   │   │   │   └── route.ts  # ⭐ POST /api/session/start
    │   │   │   └── [sessionId]/
    │   │   │       └── info/
    │   │   │           └── route.ts  # GET /api/sessions/[id]/info
    │   │   ├── topics/
    │   │   │   └── route.ts      # ⭐ GET /api/topics
    │   │   └── audit/
    │   │       └── page-exit/
    │   │           └── route.ts  # POST /api/audit/page-exit
    │   │
    │   ├── learn/
    │   │   └── [sessionId]/
    │   │       └── page.tsx      # ⭐ Página del Chat
    │   │
    │   ├── topics/
    │   │   └── page.tsx          # Página de selección de temas
    │   │
    │   ├── layout.tsx            # Layout principal
    │   ├── page.tsx              # ⭐ Landing page
    │   └── globals.css           # Estilos globales
    │
    ├── 🎨 components/
    │   ├── learning/             # Componentes del chat
    │   │   ├── chat-interface.tsx
    │   │   ├── chat-messages.tsx
    │   │   ├── image-gallery-panel.tsx
    │   │   ├── instructor-avatar.tsx
    │   │   ├── learning-layout.tsx
    │   │   ├── learning-sidebar.tsx
    │   │   ├── MessageWithImageRefs.tsx
    │   │   ├── progress-modal.tsx
    │   │   └── ProgressSection.tsx
    │   └── ui/                   # Componentes shadcn/ui
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── toast.tsx
    │       └── ...
    │
    ├── 🔌 lib/
    │   ├── prisma.ts             # ⭐ Cliente de Prisma
    │   ├── anthropic.ts          # ⭐ Cliente de Anthropic
    │   ├── type-helpers.ts       # ⭐ Parsers de JSON a tipos TypeScript
    │   ├── session-cache.ts      # Cache en memoria para topic context
    │   ├── message-summarizer.ts # Utilidades de resumen
    │   └── utils.ts              # Utilidades generales (cn)
    │
    ├── ⚙️ services/
    │   ├── chat.ts               # ⭐ Servicio principal de chat
    │   ├── moderation.ts         # ⭐ Moderación de contenido
    │   ├── intent-classification.ts  # ⭐ Clasificación de intención
    │   ├── verification.ts       # ⭐ Verificación de comprensión
    │   ├── prompt-builder.ts     # ⭐ Constructor de prompts
    │   ├── progress.ts           # Actualización de progreso
    │   └── mcp-client.ts         # Cliente para MCP Server de imágenes
    │
    ├── 🪝 hooks/
    │   ├── use-image-gallery.ts           # Hook para galería de imágenes
    │   ├── use-soft-page-exit-tracking.ts # Tracking de salida de página
    │   ├── use-toast.ts                   # Hook para notificaciones
    │   └── use-voice-recognition.ts       # Web Speech API
    │
    └── 📐 types/
        └── topic-content.ts      # ⭐ Tipos de estructura de temas
```

## 📋 Convenciones de Nomenclatura

### Regla de Oro: `kebab-case` para archivos, `PascalCase` para componentes

**Seguimos el estándar de shadcn/ui y Next.js moderno:**

```typescript
// ✅ CORRECTO:
// Archivo: instructor-card.tsx
export function InstructorCard({ ... }) {  // PascalCase
  return <div>...</div>
}

// Importación:
import { InstructorCard } from '@/components/learning/instructor-card'
```

```
✅ Archivos de Componentes: kebab-case.tsx
src/components/learning/chat-messages.tsx
src/components/ui/button.tsx

✅ Nombres de Componentes: PascalCase
export function ChatMessages()
export function Button()

✅ Páginas y Rutas: kebab-case
src/app/learn/[sessionId]/page.tsx
src/app/user-profile/page.tsx

✅ Utilities y Libs: kebab-case.ts
src/lib/anthropic.ts
src/lib/type-helpers.ts

✅ Hooks Personalizados: use-nombre.ts
src/hooks/use-image-gallery.ts
src/hooks/use-soft-page-exit-tracking.ts

❌ EVITAR:
PascalCase para archivos: UserProfile.tsx
camelCase para componentes: userProfile.tsx
snake_case: user_profile.tsx
Mezclar convenciones
```

## 🎨 Componentes UI Personalizados

### AvatarInstructor

Componente animado para representar al instructor IA con efecto "particle shimmer" que transmite que la IA está "viva" y pensando.

**Ubicación:** [src/components/learning/avatar-instructor.tsx](src/components/learning/avatar-instructor.tsx)

**Props:**
```typescript
interface AvatarInstructorProps {
  name: string           // Nombre del instructor (se muestra inicial)
  avatar?: string        // URL de imagen (opcional)
  state?: 'idle' | 'thinking' | 'speaking'  // Estado de la animación
  className?: string     // Clases adicionales
}
```

**Estados de Animación:**

1. **`idle`** (Reposo - muy sutil)
   - Usado en: `instructor-card.tsx` (sidebar)
   - Efecto: Glow pulse muy suave, sin partículas
   - Velocidad: 4s por ciclo
   - Propósito: Presencia sutil sin distraer

2. **`thinking`** (Pensando - animación activa)
   - Usado en: `chat-messages.tsx` (typing indicator)
   - Efecto: 4 partículas flotantes rápidas + glow intenso
   - Velocidad: 1.9s - 2.3s por ciclo
   - Propósito: Indicar que la IA está procesando

3. **`speaking`** (Hablando - animación intermedia)
   - Usado en: `chat-messages.tsx` (último mensaje del chat)
   - Efecto: 3 partículas flotantes lentas + glow medio
   - Velocidad: 4s - 5s por ciclo
   - Propósito: Presencia activa pero no distractora

**Uso:**
```tsx
import { AvatarInstructor } from '@/components/learning/avatar-instructor'

// En instructor card (sidebar)
<AvatarInstructor
  name="Paloma"
  avatar="/avatars/paloma.png"
  state="idle"
/>

// En typing indicator
<AvatarInstructor
  name="Paloma"
  state="thinking"
/>

// En último mensaje
<AvatarInstructor
  name="Paloma"
  state="speaking"
/>
```

**Animaciones CSS:**
- Definidas en: [src/app/globals.css](src/app/globals.css) (líneas 126-304)
- Keyframes: `particle-float-slow-*` y `particle-float-fast-*`
- Clases: `.particle-slow-1`, `.particle-fast-1`, etc.
- Efectos: Partículas con box-shadow (glow) y fade in/out

**Decisiones de Diseño:**
- ✅ Pure CSS (sin librerías externas)
- ✅ Colores alineados al tema: fuchsia, violet, cyan
- ✅ Performance optimizado (GPU-accelerated transforms)
- ✅ Mantiene inicial del instructor para identificación
- ✅ Estados reflejan el comportamiento real de la IA

## 🏗️ Arquitectura del Sistema

### Jerarquía de Contenido

```
Career (Carrera ej: SSO)
  └── Course (Curso ej: "Fundamentos de SSO")
        └── Topic (Tema ej: "IPERC")
              └── contentJson (JSON estructurado)
                    └── Classes
                          └── Moments (Momentos)
                                └── Activities (Actividades con teaching, verification, guardrails)
```

El contenido educativo está almacenado en `Topic.contentJson` como JSON estructurado. Ver `prisma/seed.ts` para ejemplos de cómo estructurar contenido.

### Flujo de Conversación

El flujo principal del chat sigue estos pasos (implementado en `src/services/chat.ts`):

```
1. Estudiante envía mensaje
         ↓
2. MODERACIÓN (detectar contenido inapropiado)
         ↓
   ¿Es seguro? ──NO──→ Respuesta de guardrail + Log
         ↓ SÍ
3. CLASIFICACIÓN DE INTENCIÓN
   - answer_verification
   - ask_question
   - off_topic
         ↓
4. CONSTRUCCIÓN DE PROMPT
   - Contexto del tema
   - Actividad actual
   - Historial reciente
   - Instrucciones específicas
         ↓
5. LLAMADA A CLAUDE API
         ↓
6. GUARDAR MENSAJES EN BD
         ↓
7. SI ES VERIFICACIÓN:
   - Analizar respuesta
   - Actualizar ActivityProgress
   - Determinar si puede avanzar
         ↓
8. RESPONDER AL ESTUDIANTE
```

### Tracking de Progreso

```
User
  └── CourseEnrollment
        └── TopicEnrollment
              └── LearningSession (sesión actual)
                    ├── Messages[] (historial completo)
                    └── ActivityProgress[] (evidencias y verificaciones)
```

### Sistema de Memoria

El instructor IA mantiene múltiples niveles de contexto:

1. **Perfil del estudiante**: nombre, progreso, actividades completadas
2. **Ubicación actual**: tema, momento, actividad
3. **Historial conversacional**: últimos 10-20 mensajes
4. **Evidencias recolectadas**: intentos y análisis por actividad
5. **Metadatos de actividad**: teaching, verification, guardrails

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo (localhost:3000)
npm run build            # Build de producción (incluye prisma generate)
npm start                # Iniciar servidor de producción
npm run lint             # Ejecutar ESLint

# Base de Datos (Prisma)
npm run db:push          # Sincronizar schema con base de datos
npm run db:studio        # Abrir Prisma Studio (GUI para BD)
npm run db:seed          # Cargar datos de ejemplo (seed.ts)
npm run db:clean         # Limpiar sesiones y mensajes

# Testing
npm run test:session     # Probar creación de sesión de aprendizaje

# TypeScript
npx tsc --noEmit        # Verificar tipos sin compilar
```

## 🔑 Variables de Entorno Requeridas

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Anthropic API Key
ANTHROPIC_API_KEY="sk-ant-..."

# NextAuth (opcional, no implementado aún)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# MCP Server (opcional, usa default si no está definido)
MCP_SERVER_URL="http://instructoria-mcp.eastus.azurecontainer.io:8080"

# Testing & Development
# Mock streaming endpoint (no consume tokens de Claude)
NEXT_PUBLIC_STREAM_MOCK_TEST="false"
# Delay entre chunks del mock (en ms) - default: 60
MOCK_CHUNK_DELAY="60"

# Security & UX
# Permitir paste en chat input (false por defecto para fomentar respuestas genuinas)
NEXT_PUBLIC_ALLOW_PASTE_INPUT="false"
```

## 🎭 Mock Mode para Testing (Sin Consumir Tokens)

Para testing de UX (skeleton, throttle, auto-focus) sin consumir tokens de Claude:

**Activación:**
```bash
# En tu archivo .env
NEXT_PUBLIC_STREAM_MOCK_TEST="true"
```

**Características:**
- ✅ Streaming simulado de ~100 palabras con formato educativo
- ✅ Delay configurable entre chunks (variable `MOCK_CHUNK_DELAY`)
- ✅ NO consume tokens de la API de Anthropic
- ✅ NO guarda mensajes en la base de datos
- ✅ Útil para probar mejoras UX sin costo
- ✅ Contenido claramente marcado como "MOCK MODE"

**Endpoint:** `/api/chat/stream-mock`

**Uso:**
```bash
# 1. Activar mock mode
echo 'NEXT_PUBLIC_STREAM_MOCK_TEST="true"' >> .env

# 2. (Opcional) Ajustar velocidad del streaming
echo 'MOCK_CHUNK_DELAY="80"' >> .env  # Más lento

# 3. Reiniciar servidor
npm run dev

# 4. Usar chat normalmente - verás 🎭 MOCK MODE en las respuestas
```

**Desactivación:**
```bash
# Cambiar a false o comentar la variable
NEXT_PUBLIC_STREAM_MOCK_TEST="false"
```

## 🐛 Sistema Centralizado de Debug Logs

El proyecto usa un sistema centralizado de logging (`src/lib/debug-utils.ts`) para mantener la consola limpia en producción y activar logs detallados solo cuando se necesitan.

### Activación de Debug Logs

```bash
# En tu archivo .env
NEXT_PUBLIC_DEBUG_LOGS="true"
```

### Funciones Disponibles

```typescript
import { debugLog, debugSuccess, debugError, debugWarn, debugGroup, debugGroupEnd, debugSeparator } from '@/lib/debug-utils'

// Log estándar (solo se muestra si DEBUG_LOGS=true)
debugLog('NAMESPACE', 'Mensaje', { data })

// Log de éxito
debugSuccess('NAMESPACE', 'Operación completada', { result })

// Log de error (SIEMPRE se muestra, incluso si DEBUG_LOGS=false)
debugError('NAMESPACE', 'Error en operación', error)

// Log de advertencia
debugWarn('NAMESPACE', 'Advertencia', { details })

// Grupos colapsables
debugGroup('NAMESPACE', 'Título del grupo')
debugLog('NAMESPACE', 'Item 1')
debugLog('NAMESPACE', 'Item 2')
debugGroupEnd()

// Separador visual
debugSeparator('NAMESPACE')
```

### Namespaces Usados

- `VERIFICATION`: Análisis de comprensión del estudiante
- `PROGRESS`: Cálculo y actualización de progreso
- `STREAM`: Flujo de streaming de Claude
- `API`: Endpoints de la API
- `UI`: Componentes de interfaz
- `SECURITY`: Validaciones de seguridad
- `SESSION`: Gestión de sesiones
- `PRISMA`: Queries de base de datos

### Ejemplo de Logs en Producción

**Con `NEXT_PUBLIC_DEBUG_LOGS="false"` (default):**
```
✅ Consola limpia
❌ Solo errores visibles (debugError)
```

**Con `NEXT_PUBLIC_DEBUG_LOGS="true"`:**
```
[VERIFICATION] 🎯 Criterios de éxito { activityId: '...', minCompleteness: 60 }
[VERIFICATION] 🔍 JSON extraído { ... }
[VERIFICATION] ✅ Resultado parseado { ready_to_advance: true, ... }
[PROGRESS] 📊 Cálculo { topicEnrollmentId: '...', completedCount: 1, ... }
[STREAM] ✅ Activity completed! Updating topic progress...
[STREAM] 📊 Topic progress updated to 20%
```

## 📝 Sistema de Transcripts de Conversaciones (Development Only)

El proyecto incluye un sistema de transcript automático que genera archivos `.md` con el log completo de las conversaciones. **Solo funciona en development** y está controlado por variable de entorno.

### Activación

```bash
# En tu archivo .env
WRITE_LESSON_TXT="1"
```

**IMPORTANTE:**
- ⚠️ Solo funciona si `NODE_ENV !== "production"` (doble seguridad)
- ✅ Ideal para debugging de flujo conversacional
- ✅ Útil para analizar interacciones estudiante-instructor
- ✅ Archivos ignorados por git (carpeta `/tmp/`)

### Ubicación de Archivos

Los transcripts se generan en:
```
/tmp/LESSON_{sessionId}.md
```

Ejemplo:
```
/tmp/LESSON_cmhb0of7a0005qkdv5ujvugke.md
```

### Formato de Transcript

**Estructura del archivo:**

```markdown
# Sesión: cmhb0of7a0005qkdv5ujvugke
Estudiante: Bruno Díaz (bruno@enter.edu.pe)
Tema: IPERC - Identificación de Peligros, Evaluación y Control de Riesgos
Instructor: Prof. Claude
Fecha: 2025-01-28 15:30
---

**LLM:**
¡Hola! Soy Prof. Claude - Instructor de SSO, tu instructor especializado en Seguridad y Salud Ocupacional.

Bienvenido al tema: "IPERC - Identificación de Peligros, Evaluación y Control de Riesgos"

Este tema forma parte del curso "Fundamentos de Seguridad y Salud Ocupacional" de la carrera de Seguridad y Salud Ocupacional.

Duración estimada: 69 minutos.

Aprende la metodología IPERC según normativa peruana

Estoy aquí para guiarte paso a paso en este aprendizaje. Puedes hacer preguntas en cualquier momento y avanzaremos juntos a tu ritmo.

¿Estás listo para comenzar?
> 15:30
---
**USER:**
si
> 15:31
---
**LLM:**
Perfecto. Vamos a comenzar explicando los conceptos fundamentales de IPERC.

IPERC significa Identificación de Peligros, Evaluación y Control de Riesgos. Es una metodología sistemática establecida en la Ley 29783 de Seguridad y Salud en el Trabajo en Perú, diseñada para prevenir accidentes y enfermedades laborales.

La clave está en entender dos conceptos cruciales: PELIGRO y RIESGO. Un PELIGRO es la fuente o situación con potencial de causar daño. Es algo que ya existe en el ambiente de trabajo. Ejemplos:

- Un piso mojado
- Un cable eléctrico pelado
- Una máquina sin protección

El RIESGO, en cambio, es la probabilidad de que ese peligro cause un daño específico, es decir, la posibilidad de que alguien se lesione por ese piso mojado, se electrocute con el cable o sea atrapado por la máquina.

[...]
> 15:31
---
```

### Características

**Metadata incluida:**
- ✅ ID de sesión
- ✅ Datos del estudiante (nombre y email)
- ✅ Título del tema
- ✅ Nombre del instructor
- ✅ Fecha y hora de inicio

**Formato de mensajes:**
- `**LLM:**` para mensajes del instructor
- `**USER:**` para mensajes del estudiante
- `> HH:mm` timestamp en cada mensaje
- `---` separador entre mensajes

**Escritura:**
- ⚡ **Tiempo real (append)** - Cada mensaje se escribe inmediatamente después de guardarse en BD
- 🔒 **Fail-safe** - Si falla la escritura del transcript, NO afecta el flujo principal
- 📝 **Inicialización automática** - Se crea el archivo con metadata en el primer mensaje de la sesión

### Implementación Técnica

**Archivo:** `src/lib/lesson-transcript.ts`

**Funciones principales:**
```typescript
// Verifica si está habilitado (WRITE_LESSON_TXT=1 y NODE_ENV !== production)
isTranscriptEnabled(): boolean

// Inicializa archivo con metadata (se llama una vez al inicio de sesión)
initTranscript(sessionId: string, metadata: SessionMetadata): Promise<void>

// Agrega mensaje al transcript (se llama después de cada mensaje guardado en BD)
appendMessage(sessionId: string, role: 'LLM' | 'USER', content: string, timestamp: Date): Promise<void>
```

**Integración en stream/route.ts:**

1. **Inicialización** (línea ~76):
```typescript
// Al detectar primera vez (session.messages.length === 0)
if (session.messages.length === 0) {
  await initTranscript(sessionId, {
    userName: session.user.name,
    email: session.user.email,
    topicTitle: session.topicEnrollment.topic.title,
    instructorName: session.topicEnrollment.topic.instructor.name
  })
}
```

2. **Append de mensajes** (línea ~366, dentro de saveToDatabase):
```typescript
// Después de prisma.message.createMany()
await appendMessage(sessionId, 'USER', studentMessage, userTimestamp)
await appendMessage(sessionId, 'LLM', instructorMessage, assistantTimestamp)
```

### Casos de Uso

**Debugging del flujo conversacional:**
```bash
# 1. Activar transcripts
echo 'WRITE_LESSON_TXT="1"' >> .env

# 2. Iniciar sesión de prueba
npm run test:session

# 3. Conversar con el instructor

# 4. Analizar transcript
cat tmp/LESSON_*.md
```

**Análisis de verificaciones:**
- Ver cuándo el instructor hace preguntas de verificación
- Revisar respuestas del estudiante
- Identificar patrones de "¿Te gustaría profundizar?" vs preguntas directas
- Verificar timestamps y orden de mensajes

**Documentación de interacciones:**
- Ejemplos reales de conversaciones para documentación
- Material de testing para QA
- Análisis de experiencia de usuario

### Limpieza de Transcripts

Los archivos de transcript NO se limpian automáticamente. Para limpiar:

```bash
# Eliminar todos los transcripts
rm -rf tmp/

# Eliminar transcripts específicos
rm tmp/LESSON_cmhb0of7a0005qkdv5ujvugke.md
```

## 💻 Protocolo de Desarrollo

### 1. Antes de Empezar
```bash
# Verificar versión actual
cat package.json | grep version

# Verificar que estamos en un estado limpio
git status
npm run build  # Debe pasar sin errores
```

### 2. Durante el Desarrollo
- Implementar la feature/fix completamente
- Probar manualmente que funciona
- Ejecutar `npm run lint` y `npx tsc --noEmit`
- Actualizar tipos si es necesario

### 3. Protocolo de Commits

**Formato:**
```bash
type: descripción concisa

- Detalle 1 del cambio
- Detalle 2 del cambio

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `refactor:` Refactorización
- `style:` Cambios de formato
- `docs:` Documentación
- `test:` Pruebas
- `chore:` Mantenimiento
- `perf:` Mejoras de rendimiento

### 4. Versionamiento (Semver)

Seguimos `MAJOR.MINOR.PATCH`:

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, correcciones menores
- **MINOR** (1.0.0 → 1.1.0): Nuevas features sin breaking changes
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes

**Al versionar:**
1. Actualizar `package.json` - versión
2. Actualizar `README.md` - CHANGELOG
3. Commit con formato: `v1.0.1: Descripción concisa`

## 🌟 Servicios Principales

### chat.ts - Flujo Principal
```typescript
async function processStudentMessage(message: string, sessionId: string) {
  // 1. Cargar contexto de la sesión
  // 2. Moderación de contenido
  // 3. Clasificar intención del mensaje
  // 4. Construir system prompt dinámico
  // 5. Llamar a Claude API
  // 6. Guardar mensajes en BD
  // 7. Si es verificación, analizar comprensión
  // 8. Retornar respuesta estructurada
}
```

### prompt-builder.ts - System Prompts
```typescript
function buildSystemPrompt(context: PromptContext) {
  // Construye prompt dinámico con:
  // - Información del instructor
  // - Contexto del tema y actividad actual
  // - Historial de conversación
  // - Instrucciones específicas según momento
  // - Guardrails activos
  // - Imágenes disponibles
}
```

### verification.ts - Análisis de Comprensión
```typescript
function analyzeStudentResponse(activity, message, history) {
  // Retorna:
  // - criteria_met: number[]
  // - completeness_percentage: 0-100
  // - understanding_level: "memorized" | "understood" | "applied" | "analyzed"
  // - ready_to_advance: boolean
  // - feedback_for_instructor: string
}
```

### moderation.ts - Moderación de Contenido
```typescript
function moderateContent(message: string, context: ModerationContext) {
  // Detecta:
  // - sexual_content
  // - violence
  // - illegal_activities
  // - personal_attacks
  // - hate_speech
  // - spam
  // Retorna: { is_safe: boolean, violations: string[], severity: string }
}
```

## 🛡️ Sistema de Seguridad

### Capas de Seguridad
1. **Moderación de entrada**: Detecta contenido sexual, violencia, actividades ilegales, etc.
2. **Clasificación de intención**: Identifica on-topic, off-topic, small_talk
3. **Prompt engineering**: Instruye al modelo sobre límites y comportamiento
4. **Guardrails en respuesta**: Valida que la respuesta sea apropiada
5. **Logging de incidentes**: Registra violaciones en tabla SecurityIncident

### Respuesta ante Violaciones
```typescript
if (contenido_inapropiado) {
  // 1. Respuesta estándar al estudiante
  responder("No puedo ayudarte con ese tema...")

  // 2. Registrar incidente
  await prisma.securityIncident.create({
    sessionId,
    incidentType: 'content_violation',
    severity: 'high',
    details: { message, violations }
  })

  // 3. Escalar si es reincidente
  if (incidents.count >= 3) {
    notifyAdministrator()
  }
}
```

## 📐 Tipos TypeScript Importantes

```typescript
// topic-content.ts
interface TopicContent {
  topic: TopicInfo
  classes: Class[]
}

interface Activity {
  id: string
  type: 'explanation' | 'question' | 'practice'
  teaching: TeachingConfig
  verification: VerificationConfig
  student_questions: StudentQuestionHandling
  guardrails: Guardrail[]
  suggested_image_ids?: string[]
}

interface VerificationConfig {
  question: string
  criteria: string[]
  target_length?: 'short' | 'medium' | 'long'
  hints?: string[]
}

// Type helpers para Prisma JSON
import { parseTopicContent, parseEvidenceData, createEvidenceData } from '@/lib/type-helpers'
```

## 🚀 API Endpoints

### POST /api/session/start
Inicia una nueva sesión de aprendizaje.

**Request:**
```json
{
  "userId": "user_xxx",
  "topicId": "topic_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_xxx",
  "topic": { "id": "...", "title": "IPERC" },
  "instructor": { "name": "Prof. Claude", "specialty": "SSO" },
  "welcomeMessage": "¡Hola! Soy..."
}
```

### POST /api/chat
Procesa mensaje del estudiante y retorna respuesta del instructor IA.

**Request:**
```json
{
  "sessionId": "session_xxx",
  "message": "¿Qué es un peligro?"
}
```

**Response:**
```json
{
  "message": "Un peligro es...",
  "type": "question_response",
  "canAdvance": false,
  "verification": null,
  "intent": { "intent": "ask_question", "is_on_topic": true }
}
```

**Tipos de respuesta:**
- `normal`: Respuesta estándar
- `guardrail`: Contenido bloqueado
- `verification_response`: Respuesta a pregunta de verificación
- `question_response`: Respuesta a pregunta del estudiante

## 🎨 Crear Nuevo Contenido Educativo

Para agregar un nuevo tema:

1. Define el contenido en JSON siguiendo la estructura en `prisma/seed.ts`:
```typescript
const topicContent = {
  topic: {
    title: "Mi Tema",
    description: "...",
    duration_minutes: 45
  },
  classes: [{
    id: "class_001",
    title: "Introducción",
    moments: [{
      id: "moment_001",
      title: "Conceptos básicos",
      activities: [{
        id: "activity_001",
        type: "explanation",
        teaching: {
          main_topic: "...",
          key_points: ["..."],
          approach: "conversational"
        },
        verification: {
          question: "...",
          criteria: ["..."],
        },
        student_questions: {
          approach: "answer_then_redirect",
          max_tangent_responses: 2
        },
        guardrails: [{
          trigger: "inappropriate_content",
          response: "..."
        }]
      }]
    }]
  }]
}
```

2. Crea el tema usando Prisma:
```typescript
await prisma.topic.create({
  data: {
    title: "Mi Tema",
    contentJson: topicContent,
    courseId: "...",
    instructorId: "..."
  }
})
```

3. Opcionalmente, carga imágenes usando el MCP Server o almacénalas en `Topic.images`

## 🐛 Troubleshooting Común

### TypeScript - Tipos de Prisma JSON
```typescript
// ❌ NO hagas esto:
const content = topic.contentJson as TopicContent

// ✅ HAZ esto:
import { parseTopicContent } from '@/lib/type-helpers'
const content = parseTopicContent(topic.contentJson)
```

### Prisma Client no generado
```bash
npx prisma generate
```

### Puerto 3000 ocupado
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID [numero] /F
```

### El instructor no responde bien
- Verifica `systemPromptBase` del instructor
- Revisa logs en la consola
- Ajusta `temperature` y `maxTokens` si es necesario

### Build de Vercel falla
- Verificar `postinstall` script ejecuta `prisma generate`
- Verificar binaryTargets incluye `debian-openssl-3.0.x`
- Marcar páginas dinámicas con `export const dynamic = 'force-dynamic'`

## 🔄 Flujo de Testing

1. **Crear sesión de prueba:**
```bash
npm run test:session
# Abre el link generado
```

2. **Verificar en Prisma Studio:**
```bash
npm run db:studio
# Revisar tablas: LearningSession, Message, ActivityProgress
```

3. **Casos de prueba:**
- ✅ Respuesta correcta → avanza
- ✅ Respuesta incorrecta → da pistas
- ✅ Pregunta on-topic → responde
- ✅ Pregunta off-topic → redirige
- ✅ Contenido inapropiado → bloquea

## 📦 Configuración de Prisma

El schema usa PostgreSQL con las siguientes características:
- `binaryTargets = ["native", "debian-openssl-3.0.x"]` para soporte Vercel
- `prisma generate` se ejecuta automáticamente en `postinstall` y `build`
- Seed con datos de ejemplo: Carrera SSO, Curso "Fundamentos de SSO", Tema "IPERC"

## 🚀 Deployment (Vercel)

El proyecto está configurado para Vercel:
- `build` script ejecuta `prisma generate` antes de `next build`
- `postinstall` también ejecuta `prisma generate`
- Configuración en `next.config.js` incluye soporte para imágenes de Azure
- Páginas dinámicas marcadas con `export const dynamic = 'force-dynamic'`

### Variables de entorno en Vercel:
```
DATABASE_URL
ANTHROPIC_API_KEY
NEXTAUTH_SECRET
MCP_SERVER_URL (opcional)
```

## 🌐 Sistema de Imágenes (MCP Server)

El proyecto usa un MCP Server personalizado (opcional):
- Endpoint: `MCP_SERVER_URL` (por defecto: http://instructoria-mcp.eastus.azurecontainer.io:8080)
- Las imágenes se cargan por tema usando `get_images_by_topic`
- Cliente en `src/services/mcp-client.ts`
- Las imágenes se cachean en `Topic.images` (JSON)
- Si el MCP Server no está disponible, el sistema continúa sin imágenes

## 📊 Optimizaciones de Performance

- **Cache en memoria** para topic context (`session-cache.ts`)
- **Ejecución en paralelo**: moderación + clasificación con Promise.all
- **Type Safety**: Todo el contenido JSON se parsea con Zod schemas
- **Path Aliases**: `@/*` para referenciar archivos en `src/`
- **Lazy loading** de componentes pesados
- **Debounce** en input del chat

## ⚠️ Consideraciones Importantes

1. **System Prompts**: Son dinámicos, se construyen en `prompt-builder.ts` con contexto actual
2. **Optimización de Performance**: Cache en memoria y ejecución paralela de servicios
3. **Type Safety**: Todo JSON de Prisma debe parsearse con helpers de `type-helpers.ts`
4. **Path Aliases**: Usa `@/*` para imports desde `src/`
5. **Claude API**: Modelo por defecto es `claude-sonnet-4-5-20250929`
6. **Moderación Context-aware**: Se adapta automáticamente al tema del curso
7. **Verificación Flexible**: Evalúa comprensión, no formato perfecto (umbral 70%)

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Neon Docs](https://neon.tech/docs/introduction)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/docs)