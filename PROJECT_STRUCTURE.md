# 📁 Estructura del Proyecto Instructoria

```
instructoria/
│
├── 📄 Archivos de Configuración
│   ├── package.json              # Dependencias y scripts
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── next.config.js            # Configuración Next.js
│   ├── tailwind.config.ts        # Configuración TailwindCSS
│   ├── postcss.config.js         # Configuración PostCSS
│   ├── .env                      # Variables de entorno (NO COMMIT)
│   ├── .env.example              # Ejemplo de variables
│   └── .gitignore                # Archivos ignorados por git
│
├── 📚 Documentación
│   ├── README.md                      # Documentación principal
│   ├── QUICK_START.md                 # Guía de inicio rápido
│   ├── ARCHITECTURE.md                # Arquitectura técnica
│   ├── IMPLEMENTATION_SUMMARY.md      # Resumen de implementación
│   ├── PROJECT_STRUCTURE.md           # Este archivo
│   └── fuente_informacion.md          # JSON original de IPERC
│
├── 🗄️ prisma/                    # Base de Datos
│   ├── schema.prisma             # ⭐ Schema completo de la BD
│   └── seed.ts                   # ⭐ Datos iniciales (SSO + IPERC)
│
├── 🔧 scripts/                   # Utilidades
│   └── test-session.ts           # ⭐ Crear sesión de prueba
│
└── 💻 src/                       # Código Fuente
    │
    ├── 📱 app/                   # Next.js App Router
    │   │
    │   ├── api/                  # 🌐 API Routes
    │   │   ├── chat/
    │   │   │   └── route.ts      # ⭐ POST /api/chat
    │   │   ├── session/
    │   │   │   └── start/
    │   │   │       └── route.ts  # ⭐ POST /api/session/start
    │   │   └── topics/
    │   │       └── route.ts      # ⭐ GET /api/topics
    │   │
    │   ├── learn/
    │   │   └── [sessionId]/
    │   │       └── page.tsx      # ⭐ Página del Chat
    │   │
    │   ├── layout.tsx            # Layout principal
    │   ├── page.tsx              # ⭐ Landing page
    │   └── globals.css           # Estilos globales
    │
    ├── 🔌 lib/                   # Clientes externos
    │   ├── prisma.ts             # ⭐ Cliente de Prisma
    │   └── anthropic.ts          # ⭐ Cliente de Anthropic
    │
    ├── ⚙️ services/              # Lógica de Negocio
    │   ├── chat.ts               # ⭐ Servicio principal de chat
    │   ├── moderation.ts         # ⭐ Moderación de contenido
    │   ├── intent-classification.ts  # ⭐ Clasificación de intención
    │   ├── verification.ts       # ⭐ Verificación de comprensión
    │   └── prompt-builder.ts     # ⭐ Constructor de prompts
    │
    └── 📐 types/                 # Tipos TypeScript
        └── topic-content.ts      # ⭐ Tipos de estructura de temas
```

---

## 🎯 Archivos Clave

### 1. Base de Datos

**`prisma/schema.prisma`** - Schema completo
```prisma
- User, Career, Course, Topic
- AIInstructor
- Enrollments (Career, Course, Topic)
- LearningSession, Message
- ActivityProgress
- SecurityIncident
```

**`prisma/seed.ts`** - Datos iniciales
```typescript
- Carrera SSO
- Instructor IA de SSO
- Curso "Fundamentos de SSO"
- Tema "IPERC" con contenido completo
- Usuario de prueba
```

---

### 2. API Routes

**`src/app/api/session/start/route.ts`**
```typescript
POST /api/session/start
- Crea CourseEnrollment
- Crea TopicEnrollment
- Crea LearningSession
- Retorna sessionId y welcomeMessage
```

**`src/app/api/chat/route.ts`**
```typescript
POST /api/chat
- Recibe: { sessionId, message }
- Procesa con servicio de chat
- Retorna: respuesta del instructor + metadata
```

**`src/app/api/topics/route.ts`**
```typescript
GET /api/topics?courseId=xxx&type=CAREER
- Lista temas disponibles
- Filtra por curso o tipo
```

---

### 3. Servicios (Business Logic)

**`src/services/chat.ts`** - Orquestador principal
```typescript
processStudentMessage(message, sessionId) {
  1. Cargar contexto
  2. Moderar contenido
  3. Clasificar intención
  4. Construir prompt dinámico
  5. Llamar a Claude API
  6. Guardar mensajes
  7. Verificar comprensión si aplica
  8. Retornar respuesta
}
```

**`src/services/moderation.ts`** - Moderación
```typescript
moderateContent(message) {
  - Detecta: sexual_content, violence, illegal, etc.
  - Usa Claude para análisis
  - Retorna: { is_safe, violations, severity }
}
```

**`src/services/intent-classification.ts`** - Clasificación
```typescript
classifyIntent(message, activity, context) {
  - Determina: answer_verification | ask_question | off_topic
  - Analiza relevancia al tema
  - Retorna estrategia de respuesta
}
```

**`src/services/verification.ts`** - Verificación
```typescript
analyzeStudentResponse(activity, message, history) {
  - Compara respuesta vs criterios de éxito
  - Calcula completitud (0-100%)
  - Determina nivel de comprensión
  - Retorna: { ready_to_advance, key_insights, etc. }
}
```

**`src/services/prompt-builder.ts`** - Constructor
```typescript
buildSystemPrompt(context) {
  - Contexto del tema
  - Actividad actual
  - Instrucciones de teaching
  - Estrategia de repreguntas
  - Manejo de preguntas del estudiante
  - Guardrails
  - Historial reciente
}
```

---

### 4. Frontend

**`src/app/page.tsx`** - Landing page
```tsx
- Hero section
- Características principales
- Especialidades disponibles
- Links a cursos y dashboard
```

**`src/app/learn/[sessionId]/page.tsx`** - Chat
```tsx
- Interfaz de chat en tiempo real
- Carga historial de mensajes
- Envía mensajes a /api/chat
- Muestra indicador de "puede avanzar"
- Loading states y error handling
```

---

### 5. Tipos TypeScript

**`src/types/topic-content.ts`** - Estructura completa
```typescript
interface TopicContent {
  topic: {
    id, title, learning_objective, key_points,
    moments: [
      {
        activities: [
          {
            teaching: { agent_instruction, key_concepts, examples },
            verification: { initial_question, success_criteria, reprompt_strategy },
            student_questions: { scope, out_of_scope_strategy },
            guardrails: { prohibited_topics, response_on_violation }
          }
        ]
      }
    ]
  }
}
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev               # Inicia servidor en localhost:3000

# Base de datos
npm run db:push           # Push schema a la BD
npm run db:studio         # Abre Prisma Studio (GUI)
npm run db:seed           # Carga datos de ejemplo

# Testing
npm run test:session      # Crea sesión de prueba

# Producción
npm run build             # Build para producción
npm run start             # Inicia en modo producción
```

---

## 📦 Dependencias Principales

### Producción
```json
{
  "@anthropic-ai/sdk": "^0.30.1",     // Cliente de Anthropic
  "@prisma/client": "^5.22.0",        // ORM
  "next": "^14.2.0",                  // Framework
  "next-auth": "^4.24.0",             // Autenticación
  "react": "^18.3.0",                 // UI
  "zod": "^3.23.0"                    // Validación
}
```

### Desarrollo
```json
{
  "prisma": "^5.22.0",                // CLI de Prisma
  "tailwindcss": "^3.4.4",            // CSS
  "typescript": "^5.5.0",             // TypeScript
  "tsx": "^4.16.0"                    // Ejecutor de TS
}
```

---

## 🗂️ Estructura de Base de Datos

### Tablas Principales

```
User
  ↓
CourseEnrollment
  ↓
TopicEnrollment
  ↓
LearningSession ────→ Message (historial)
  ↓
ActivityProgress (evidencias)
```

### Relaciones

```
Career (1) ──→ (N) Course
Course (1) ──→ (N) Topic
Topic (1) ──→ (1) AIInstructor
Topic (1) ──→ (N) TopicEnrollment
TopicEnrollment (1) ──→ (N) LearningSession
LearningSession (1) ──→ (N) Message
TopicEnrollment (1) ──→ (N) ActivityProgress
```

---

## 🎨 Flujo de Datos

### 1. Inicio de Sesión
```
User → POST /api/session/start
     → Crea CourseEnrollment, TopicEnrollment, LearningSession
     → Retorna sessionId
     → Redirect a /learn/[sessionId]
```

### 2. Conversación
```
User escribe mensaje
  ↓
POST /api/chat { sessionId, message }
  ↓
processStudentMessage()
  ├─ moderateContent()
  ├─ classifyIntent()
  ├─ buildSystemPrompt()
  ├─ anthropic.messages.create()
  ├─ analyzeStudentResponse() (si es verificación)
  └─ Guardar en BD
  ↓
Retorna respuesta al frontend
  ↓
Frontend muestra mensaje
```

### 3. Progreso
```
ActivityProgress.status = IN_PROGRESS
  ↓
Estudiante cumple criterios
  ↓
analyzeStudentResponse() → ready_to_advance = true
  ↓
ActivityProgress.status = COMPLETED
  ↓
TopicEnrollment.progress += X%
```

---

## 📊 Variables de Entorno

```env
# Requeridas
DATABASE_URL=              # PostgreSQL (Neon)
ANTHROPIC_API_KEY=         # Claude API

# Opcionales
NEXTAUTH_SECRET=           # Para autenticación
NEXTAUTH_URL=              # URL de la app
GOOGLE_CLIENT_ID=          # OAuth Google
GOOGLE_CLIENT_SECRET=      # OAuth Google
```

---

## 🔐 Archivos Sensibles (.gitignore)

```
node_modules/
.next/
.env                       # ⚠️ NUNCA COMMITEAR
*.log
.DS_Store
```

---

## 📝 Documentación Disponible

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Documentación completa del proyecto |
| `QUICK_START.md` | Guía de inicio rápido (5 minutos) |
| `ARCHITECTURE.md` | Arquitectura técnica detallada |
| `IMPLEMENTATION_SUMMARY.md` | Resumen de lo implementado |
| `PROJECT_STRUCTURE.md` | Este archivo |

---

## 🎯 Próximo Paso

1. Lee `QUICK_START.md` para configurar el proyecto
2. Ejecuta `npm run test:session` para crear una sesión
3. Chatea con el instructor IA
4. Explora `ARCHITECTURE.md` para entender el sistema

¡Listo para empezar! 🚀
