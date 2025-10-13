# 🏗️ Arquitectura de Instructoria

Documentación técnica de la arquitectura del sistema.

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Datos](#estructura-de-datos)
4. [Flujo de Conversación](#flujo-de-conversación)
5. [Sistema de Memoria](#sistema-de-memoria)
6. [Seguridad y Guardrails](#seguridad-y-guardrails)
7. [API Endpoints](#api-endpoints)

---

## 🎯 Visión General

Instructoria es una plataforma educativa que utiliza IA conversacional (Claude de Anthropic) para crear experiencias de aprendizaje personalizadas.

### Características Principales

- ✅ **Instructores IA especializados** por materia (SSO, Tecnología, etc.)
- ✅ **Conversación natural** con preguntas y repreguntas
- ✅ **Verificación de comprensión** automática mediante IA
- ✅ **Memoria persistente** para cada estudiante
- ✅ **Moderación de contenido** en tiempo real
- ✅ **Manejo inteligente** de preguntas on-topic y off-topic
- ✅ **Guardrails** contra contenido inapropiado
- ✅ **Tracking de progreso** granular por actividad

---

## 🛠️ Stack Tecnológico

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                       │
│  Next.js 14 + React + TypeScript + Tailwind    │
└─────────────────────────────────────────────────┘
                       ↕
┌─────────────────────────────────────────────────┐
│                  API LAYER                      │
│         Next.js API Routes (REST)               │
└─────────────────────────────────────────────────┘
                       ↕
┌─────────────────────────────────────────────────┐
│               BUSINESS LOGIC                    │
│    Services: Chat, Moderation, Verification    │
└─────────────────────────────────────────────────┘
                       ↕
┌──────────────────┬──────────────────────────────┐
│   DATABASE       │       AI SERVICE             │
│ PostgreSQL/Neon  │   Anthropic Claude API       │
│    (Prisma)      │   (Sonnet 4.5)               │
└──────────────────┴──────────────────────────────┘
```

### Componentes

- **Frontend:** Next.js 14, React, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **IA:** Anthropic Claude API (Sonnet 4.5)
- **Auth:** NextAuth.js (preparado para Google OAuth)

---

## 📊 Estructura de Datos

### Jerarquía de Contenido

```
Career (Carrera)
  └── Course (Curso)
        └── Topic (Tema) ← IPERC está aquí
              └── contentJson
                    └── Moment (Momento)
                          └── Activity (Actividad)
```

### Modelos Principales

#### 1. Career (Carrera)
```prisma
model Career {
  id            String
  name          String    // "Seguridad y Salud Ocupacional"
  slug          String    // "sso"
  type          CAREER | TRANSVERSAL
  courses       Course[]
}
```

#### 2. Course (Curso)
```prisma
model Course {
  id          String
  title       String
  type        CourseType  // CAREER o TRANSVERSAL
  careerId    String?     // null si es transversal
  topics      Topic[]
}
```

#### 3. Topic (Tema - Contiene el JSON)
```prisma
model Topic {
  id              String
  title           String
  courseId        String
  instructorId    String
  contentJson     Json    // ⭐ Aquí está toda la estructura
  enrollments     TopicEnrollment[]
}
```

#### 4. AIInstructor (Instructor IA)
```prisma
model AIInstructor {
  id              String
  name            String
  specialty       String
  systemPromptBase String
  modelId         String    // "claude-sonnet-4-5-20250929"
  topics          Topic[]
}
```

### Tracking de Progreso

```
User
  └── CourseEnrollment
        └── TopicEnrollment
              └── LearningSession (sesión actual)
                    ├── Messages[] (historial)
                    └── ActivityProgress[] (evidencias)
```

---

## 🔄 Flujo de Conversación

### Diagrama de Flujo

```
1. Estudiante envía mensaje
         ↓
2. MODERACIÓN (detectar contenido inapropiado)
         ↓
   ¿Es seguro? ──NO──→ Respuesta de guardrail + Log
         ↓ SÍ
3. CLASIFICACIÓN DE INTENCIÓN
   - ¿Es respuesta a verificación?
   - ¿Es pregunta sobre el tema?
   - ¿Es off-topic?
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

### Código del Flujo Principal

```typescript
// src/services/chat.ts

async function processStudentMessage(message, sessionId) {
  // 1. Cargar contexto
  const session = await loadSession(sessionId)

  // 2. Moderación
  const moderation = await moderateContent(message)
  if (!moderation.is_safe) {
    return guardrailResponse()
  }

  // 3. Clasificar intención
  const intent = await classifyIntent(message, activity, context)

  // 4. Construir prompt
  const systemPrompt = buildSystemPrompt(context)

  // 5. Llamar a Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    system: systemPrompt,
    messages: conversationHistory
  })

  // 6. Guardar mensajes
  await saveMessages(message, response)

  // 7. Si es verificación, analizar
  if (intent === 'answer_verification') {
    const verification = await analyzeStudentResponse(...)
    await updateActivityProgress(verification)
  }

  // 8. Retornar respuesta
  return { message: response, canAdvance: verification.ready_to_advance }
}
```

---

## 🧠 Sistema de Memoria

### Niveles de Memoria

El instructor IA mantiene múltiples niveles de contexto:

```typescript
CONTEXTO = {
  // Nivel 1: Perfil del estudiante
  student: {
    name: "Juan Pérez",
    progress: 45%,
    completedActivities: [...],
  },

  // Nivel 2: Ubicación actual
  current: {
    topic: "IPERC",
    moment: "Evaluación de Riesgos",
    activity: "activity_005"
  },

  // Nivel 3: Historial conversacional (últimos 10-20 mensajes)
  messages: [
    { role: 'assistant', content: '...' },
    { role: 'user', content: '...' }
  ],

  // Nivel 4: Evidencias recolectadas
  evidence: [
    { activityId: 'activity_001', passed: true, attempts: 2 },
    { activityId: 'activity_002', passed: true, attempts: 1 }
  ],

  // Nivel 5: Metadatos de la actividad actual
  activityConfig: {
    teaching: {...},
    verification: {...},
    guardrails: {...}
  }
}
```

### Persistencia

- **Messages:** Tabla en BD, almacena TODO el historial
- **ActivityProgress:** Guarda intentos, análisis y evidencias por actividad
- **LearningSession:** Mantiene el estado actual (qué momento, qué actividad)
- **Resúmenes:** Generados periódicamente por IA para comprimir contexto largo

---

## 🛡️ Seguridad y Guardrails

### Capas de Seguridad

```
1. MODERACIÓN DE ENTRADA
   ↓ Detecta: sexual_content, violence, illegal_activities, etc.

2. CLASIFICACIÓN DE INTENCIÓN
   ↓ Identifica: on-topic, off-topic, small_talk

3. PROMPT ENGINEERING
   ↓ Instruye al modelo sobre límites y comportamiento

4. GUARDRAILS EN RESPUESTA
   ↓ Valida que la respuesta sea apropiada

5. LOGGING DE INCIDENTES
   ↓ Registra violaciones para revisión
```

### Tipos de Contenido Prohibido

```typescript
prohibited_topics = [
  'sexual_content',      // Contenido sexual explícito
  'violence',            // Violencia o amenazas
  'illegal_activities',  // Actividades ilegales
  'personal_attacks',    // Insultos o ataques
  'hate_speech',         // Discurso de odio
  'spam'                 // Spam o promoción
]
```

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

---

## 🌐 API Endpoints

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

Envía mensaje del estudiante y recibe respuesta del instructor.

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

### GET /api/topics

Lista los temas disponibles.

**Query params:**
- `courseId` (opcional): Filtrar por curso
- `type` (opcional): `CAREER` o `TRANSVERSAL`

**Response:**
```json
{
  "topics": [
    {
      "id": "topic_xxx",
      "title": "IPERC",
      "description": "...",
      "course": { "title": "Fundamentos de SSO" },
      "instructor": { "name": "Prof. Claude" }
    }
  ]
}
```

---

## 🔍 Verificación de Comprensión

### Proceso de Verificación

```typescript
// 1. Estudiante responde pregunta de verificación
message = "Un peligro es algo que ya existe y puede causar daño"

// 2. Análisis mediante IA
verification = await analyzeStudentResponse(activity, message, history)

// Resultado:
{
  criteria_met: [0, 1, 2],           // Todos los criterios cumplidos
  completeness_percentage: 100,
  understanding_level: "applied",     // Puede aplicar el concepto
  ready_to_advance: true             // ✅ Puede avanzar
}

// 3. Actualizar progreso
await updateActivityProgress({
  status: 'COMPLETED',
  passedCriteria: true,
  evidenceData: {
    attempts: [{
      studentResponse: message,
      analysis: verification,
      timestamp: now
    }]
  }
})
```

### Niveles de Comprensión

1. **memorized**: Solo recuerda la definición
2. **understood**: Entiende el concepto
3. **applied**: Puede aplicarlo con ejemplos propios
4. **analyzed**: Puede analizar casos complejos

---

## 📈 Próximas Mejoras

### En Desarrollo

- [ ] Autenticación con Google OAuth
- [ ] Dashboard del estudiante
- [ ] Sistema de certificados
- [ ] Análisis de progreso con gráficos
- [ ] Exportar conversaciones a PDF

### Futuro

- [ ] Más especialidades (Tecnología, Negocios)
- [ ] Evaluaciones automáticas con IA
- [ ] Recomendaciones personalizadas
- [ ] Gamificación (badges, puntos)
- [ ] Modo colaborativo (grupos)

---

## 🤝 Contribuir

Para contribuir al proyecto:

1. Lee la documentación completa
2. Revisa la estructura de código
3. Crea tests para nuevas funcionalidades
4. Mantén el estilo de código consistente
5. Documenta los cambios

**Áreas que necesitan ayuda:**

- 🎨 Mejoras de UI/UX
- 🧪 Tests automatizados
- 📊 Analytics y métricas
- 🌍 Internacionalización (i18n)
- 📱 App móvil (React Native)

---

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Neon Docs](https://neon.tech/docs/introduction)

---

¿Preguntas? Revisa el [README.md](./README.md) o abre un issue en GitHub.
