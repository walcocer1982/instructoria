# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SOPHI** (Sistema Pedagógico Híbrido Inteligente) is an AI-powered educational platform built with Next.js 14 that uses LLM agents to create interactive learning experiences. The system uses a Socratic method approach with multiple specialized AI agents that guide students through structured pedagogical moments.

## Commands

### Development
```bash
npm run dev          # Start development server (default port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
# Run individual agent tests
node test-planner.mjs      # Test Planner agent
node test-tutor.mjs        # Test Tutor agent
node test-checker.mjs      # Test Checker agent
node test-auth.mjs         # Test authentication
node test-chat-interaction.mjs  # Test full chat flow
node test-api-routes.mjs   # Test API routes
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Add your OpenAI API key: `OPENAI_API_KEY=sk-...`
3. Run `npm install`

## Architecture

### 🎯 Orchestrator Architecture v3.0.0 (Simplified Roles - October 2025)

The system uses **1 Orchestrator Agent** that coordinates **3 specialized LLM agents with clear, non-overlapping responsibilities**:

```
┌─────────────────────────────────────────────────────────────┐
│              🎯 ORCHESTRATOR AGENT                          │
│       (lib/agents/orchestrator.ts - 650 lines)              │
│                                                              │
│  API Pública:                                                │
│  • initializeSession()                                       │
│  • processStudentResponse()  ← SIMPLIFICADO v3.0            │
│  • handleChatMessage()                                       │
│                                                              │
│  Flujo:                                                      │
│  1. Checker clasifica tipo de mensaje                       │
│  2. Rutea a Evaluator (respuestas) o Tutor (preguntas)     │
│  3. Muestra resultado al estudiante                         │
└─────────────────────────────────────────────────────────────┘
       ↓                    ↓                    ↓
┌─────────────┐    ┌─────────────┐    ┌────────────────┐
│  CHECKER    │    │ EVALUATOR   │    │    TUTOR       │
│ (clasifica) │    │  (evalúa +  │    │  (explica)     │
│             │    │  feedback)  │    │                │
│ 162 líneas  │    │ 286 líneas  │    │  182 líneas    │
└─────────────┘    └─────────────┘    └────────────────┘
       ↓                    ↓                    ↓
┌──────────────────────────────────────────────────────────┐
│           LLM Provider (GPT-4o-mini)                     │
└──────────────────────────────────────────────────────────┘
```

**Core Agents (4):**

1. **🎯 Orchestrator** (`lib/agents/orchestrator.ts`) - **v3.0.0**
   - Coordina flujo pedagógico completo
   - Rutea mensajes según clasificación del Checker
   - 3 funciones públicas, ~12 funciones privadas
   - Gestiona estados, transiciones y navegación de momentos

2. **📋 Planner** (`lib/agents/planner.ts`) - Genera estructura de lección:
   - 6 momentos pedagógicos (M0-M5)
   - Sub-momentos opcionales (M2.1, M2.2, etc.) **v2.4.0**
   - Actividades detalladas por momento
   - Recursos visuales sugeridos
   - Criterios de evaluación

3. **🔍 Checker** (`lib/agents/checker.ts`) - **v3.1** - Clasificador y Redireccionador:
   - **CLASIFICA** tipo de mensaje (no evalúa conceptos)
   - Tipos: `answer` | `question_brief` | `question_deep` | `no_se` | `off_topic`
   - Extrae pregunta específica si es `question_*`
   - **GENERA mensaje de redirección** si detecta `off_topic` (NUEVO v3.1)
   - Temperatura: 0.2 (muy consistente)
   - **~170 líneas** (antes v3.0: 162)

4. **📊 Evaluator** (`lib/agents/evaluator.ts`) - **REDISEÑADO v3.0** - Motor Pedagógico:
   - **EVALÚA** respuesta contra evidencias esperadas
   - **GENERA** feedback específico y personalizado
   - **DECIDE** siguiente acción: `praise` | `feedback` | `hint` | `reformulate`
   - **FORMULA** nueva pregunta basada en conceptos faltantes
   - Integra principios "Teach Like a Champion"
   - Adapta flexibilidad según momento pedagógico + perfil estudiante
   - **286 líneas** (antes: 117 de evaluación final)

5. **🎓 Tutor** (`lib/agents/tutor.ts`) - **REDISEÑADO v3.0** - Explicador de Conceptos:
   - **SOLO EXPLICA** conceptos generales (no evalúa ni da feedback)
   - Responde preguntas del estudiante: "¿Qué es X?"
   - Tipos: `brief` (4-6 líneas) | `deep` (8-12 líneas)
   - Redirige al estudiante de vuelta a la actividad
   - **182 líneas** (antes: 229 + 400 en tutorPrompts.ts)

**Módulos de Soporte:**
- ✅ `lib/chatStateMachine.ts` - Estados y transiciones válidas
- ✅ `lib/chatPlaceholders.ts` - Sistema de variables genéricas (deprecated para nuevos usos)

**Archivos Eliminados v3.0:**
- ❌ `lib/agents/tutorPrompts.ts` (400 líneas) - Prompts ahora en cada agente

**Evolución v2.3.0 → v3.0.0:**
- ✅ **Responsabilidades claras**: Checker clasifica → Evaluator evalúa → Tutor explica
- ✅ **-77 líneas** en Orchestrator.processStudentResponse (295 → ~150)
- ✅ **-400 líneas** eliminadas (tutorPrompts.ts)
- ✅ **+169 líneas** en Evaluator (ahora hace evaluación + feedback + preguntas)
- ✅ **-91 líneas** en Checker (solo clasificación)
- ✅ **-47 líneas** en Tutor (solo explicaciones)

**Optimización v3.6.1 (Performance):**
- ⚡ **Llamadas LLM combinadas**: Feedback + Hints en 1 sola llamada (antes: 2 secuenciales)
- ⚡ **~40% más rápido**: De ~3.5s a ~2s en respuesta del Evaluator
- ⚡ **Mismo costo**: Mismos tokens, menos overhead de red
- ⚡ **Más confiable**: 1 punto de falla vs 2

### Pedagogical Moments (M0-M5)

Lessons are structured into 6 moments following the **Gradual Release** model:

- **M0 (Motivación)**: Concrete, experience-based questions
- **M1 (Saberes Previos)**: Activate prior knowledge
- **M2 (Modelado)**: Conceptual teaching
- **M3 (Práctica Guiada)**: Guided practice
- **M4 (Práctica Independiente)**: Independent work
- **M5 (Evaluación)**: Final assessment

**Critical:** Question complexity and evaluation strictness adapt by moment. M0-M1 are very flexible (accept exploratory answers), M4-M5 are strict (require complete answers).

#### Sub-Moments (NUEVO v2.4.0)

Moments can optionally have **sub-moments** (M2.1, M2.2, M2.3) for multi-activity sequences:

**When to use:**
- ✅ M2 with: theory + practical example + demonstration
- ✅ M3 with: simple exercise + complex exercise
- ✅ M4 with: project part A + project part B

**Each sub-moment has:**
- Own activity, evidences, and guiding question
- Optional images (url + description + type)
- Separate progress tracking

**Navigation:** Orchestrator automatically navigates through sub-moments sequentially before advancing to next base moment.

### Chat State Machine

The conversation follows a strict finite state machine (managed by Orchestrator):

```
INTRODUCING → EXPOSING → QUESTIONING → WAITING_RESPONSE → EVALUATING
                                            ↓                    ↓
                                      CLARIFYING          PRAISING/CORRECTING
                                                                   ↓
                                                          HINTING/EXPLAINING
                                                                   ↓
                                                         TRANSITIONING → (next momento)
```

**Moment Navigation:**
- Use `getNextMoment(currentMoment)` from `lib/chatStateMachine.ts` to get next moment ID
- State transitions are handled directly by Orchestrator via `updateSession()`
- Orchestrator manages all pedagogical flow logic

### Variable Replacement System

**CRITICAL PATTERN:** The system uses generic English placeholders that get replaced with actual lesson content:

1. **Planner generates** questions with placeholders: `[PROCESS]`, `[MAIN_CONCEPT]`, `[ELEMENT]`
2. **Orchestrator** replaces them using `replaceConceptPlaceholders(text, lesson)` before showing to student
3. Replacement extracts concepts from `lesson.objetivo` and `lesson.criterios_evaluacion`

**Functions:**
- `replaceConceptPlaceholders(text, lesson)` - in `lib/chatPlaceholders.ts` (DEPRECATED, use only for Planner questions)
- `filterImagesByMoment(images, momentId)` - in `lib/llm.ts` (moved from chatPlaceholders)

**Important:** Do NOT use `replaceConceptPlaceholders()` on Tutor-generated text (it already uses specific terms)

**Why:** Keeps Planner topic-agnostic while showing students real content.

### Tutor Agent Actions

The Tutor agent has multiple actions controlled by the `action` parameter:

- `question` - Generate Socratic question with 3 hint levels
- `praise` - Congratulate correct answer (uses Teach Like a Champion principles)
- `provide_feedback` - Give pedagogical feedback for partial/incorrect (NEVER use Checker's raw `reasoning`)
- `hint` - Provide graduated hints (levels 1-3) adapted to error type
- `explain` - Brief explanation when student asks definition
- `scaffold` - "No Opt Out" strategy when student says "I don't know"

**Prompt Construction:** Each action has dedicated prompt builder in `lib/agents/tutorPrompts.ts`

### Feedback Principles (Teach Like a Champion)

All feedback MUST follow 3 components (defined in tutorPrompts.ts lines 109-203):

1. **ESPECÍFICO** - Recognize what's correct first
2. **ACCIONABLE** - Guide with questions, not direct answers
3. **POSITIVO** - Maintain motivation, never discourage

**Anti-patterns:**
- ❌ "Tu respuesta es incorrecta" (negative, not actionable)
- ❌ "Falta mencionar X" (not specific, not motivating)
- ✅ "¡Bien! Identificaste X. Ahora, ¿qué más necesitamos considerar?" (all 3 components)

### Data Storage (MVP)

Currently uses **JSON files** in `data/` directory:

```
data/
├── users/{userId}.json        # User accounts
├── lessons/{lessonId}.json    # Lesson definitions
└── sessions/{sessionId}.json  # Student sessions
```

**Access patterns:**
- `lib/lessons.ts` - CRUD for lessons
- `lib/sessions.ts` - CRUD for sessions, chat history management
- `lib/auth.ts` - User authentication

**Future:** Migrate to PostgreSQL with Prisma (Fase 2+)

### LLM Client Wrapper

`lib/llm.ts` provides a typed wrapper around OpenAI SDK:

```typescript
const llm = getLLMClient();

// Structured output with Zod validation
const result = await llm.chatStructured<OutputType>(
  messages,
  jsonSchema,  // from zodToJsonSchema()
  { model: 'gpt-4o-mini', temperature: 0.8 }
);
```

**Default model:** `gpt-4o-mini` (cost-effective, fast, sufficient quality)

### Image Handling

**Critical:** Images are filtered by pedagogical moment using `filterImagesByMoment()` (chatController.ts:58-99)

Rules:
- M0: Only `contexto` images
- M1: `contexto`, `diagrama`
- M2: `ejemplo`, `recurso`, `diagrama`
- M3: `ejemplo`, `recurso`
- M4: `recurso`
- M5: No images

Images have `momento_id` or `tipo` properties for filtering.

## Activity Type Detection (v3.5.7 - LLM-based)

**CRITICAL:** The system uses LLM to detect what the teacher wants in each activity.

### 3 Types of Activities (Detected Automatically)

Every momento/sub-momento activity is analyzed by LLM and classified as:

1. **📖 NARRATIVE** - System TELLS a story
   - Teacher writes: "Cuenta una situación...", "Narra un caso...", "Presenta una historia..."
   - System generates: Vivid narrative with characters + question
   - Example: "Cuenta un caso peligroso real que pasa en el trabajo"
   → System: "Imagina a Juan en el almacén, a 5 metros sin arnés..."

2. **🎓 EXPLANATION** - System TEACHES a concept
   - Teacher writes: "Explica la diferencia entre...", "Define...", "Enseña el concepto de..."
   - System generates: Didactic explanation (3-5 sentences) + verification question
   - Example: "Explica la diferencia entre peligro y riesgo"
   → System: "Un peligro es... mientras que el riesgo es... La diferencia clave es..."

3. **❓ QUESTION** - System ASKS student to answer
   - Teacher writes: "Identifica...", "Analiza...", "Menciona...", "Compara tú..."
   - System generates: Socratic question only (student must respond)
   - Example: "Identifica los elementos del IPERC"
   → System: "¿Cuáles son los tres elementos principales del IPERC?"

### How It Works

**Location:** `lib/agents/orchestrator.ts`

**Function:** `detectActivityType(actividad)` - Lines 352-410
- Called by `sendContextAndQuestion()` for EVERY momento/sub-momento
- Uses LLM (gpt-4o-mini, temp=0.3) to interpret teacher's intention
- Returns: `'narrative' | 'explanation' | 'question'` + reasoning

**Functions called based on type:**
- `narrative` → `generateContextoYPregunta()` (existing)
- `explanation` → `generateExplanation()` (NEW v3.5.7)
- `question` → `generateDirectQuestion()` (v3.5.7)

**Works for:**
- ✅ All base moments (M0-M5)
- ✅ All sub-momentos (M2.1, M2.2, M3.1, etc.)
- ✅ Any subject (not hardcoded to "security")

**Logging:**
Console shows detection for debugging:
```
📝 [ACTIVIDAD] "Explica la diferencia entre peligro y riesgo"
   Tipo detectado: 🎓 EXPLICACIÓN
   Razonamiento LLM: "El verbo 'Explica' indica que el sistema debe enseñar"
   → Generando explicación educativa con LLM...
```

## Teacher Interface & Lesson Creation Workflow (v3.5.0 - October 2025)

### Lesson Creation Flow

**IMPORTANT:** The system is designed for teachers to have FULL MANUAL CONTROL over lesson content.

#### 1. Teacher Creates/Edits Lesson Manually

**Interface:** `/teacher/lessons/edit/[id]` and `/teacher/lessons/create`

**3 Tabs with shadcn/ui components:**

**Tab "Información Básica":**
- Título
- Objetivo educativo
- Duración estimada (minutos)
- Criterios de evaluación (EvidenceManager component)

**Tab "Imágenes":**
- **Only URL-based** (NO file upload)
- Uses ImageManager component with accordion
- Teacher adds images by pasting URL
- For each image:
  - URL (editable)
  - Descripción (what the image shows)
  - Tipo (contexto/ejemplo/diagrama/recurso)
  - Momento asignado (M0, M1, M2.1, etc.)

**Tab "Estructura":**
- 6 fixed pedagogical moments (M0-M5) - accordion view
- For each moment:
  - Nombre
  - Duración (min)
  - **Actividad** (SIMPLE description written by teacher)
    - Example: "Contar una situación peligrosa real que pasa en el trabajo"
  - **Pregunta guía** (SIMPLE question written by teacher)
    - Example: "¿Qué harías para evitar que esto pase?"
  - **Evidencias** (what student must demonstrate)
    - Uses EvidenceManager component
  - **Sub-momentos** (optional, mainly for M2-M3)
    - Uses SubMomentoManager component
    - Each sub-momento has: id, nombre, min, actividad, pregunta_guia, evidencias

#### 2. What Gets Saved to Database

Lessons are saved **exactly as teacher wrote them** in `data/lessons/{lessonId}.json`:

```json
{
  "momentos": [
    {
      "id": "M0",
      "nombre": "Motivación",
      "actividad": "Contar una situación peligrosa real que pasa en el trabajo",
      "pregunta_guia": "¿Qué harías para evitar que esto pase?",
      "evidencias": ["Identifica 2 peligros", "Menciona razón"],
      // NO "contexto" field - stays simple
    }
  ],
  "imagenes": [
    {
      "url": "https://...",
      "descripcion": "Trabajador en almacén sacando caja de 20 kg a 5 metros sin línea de vida",
      "tipo": "contexto",
      "momento_id": "M0"
    }
  ]
}
```

**Key Point:** Activities and questions are saved **SIMPLE**, NOT enriched by Planner.

#### 3. Runtime: Different Stories for Each Student

When a student starts a session, the **Orchestrator generates dynamic content**:

**Function:** `sendContextAndQuestion()` in `lib/agents/orchestrator.ts:408-483`

**Logic:**
```javascript
if (!plan.contexto && plan.imageDescription) {
  // NO context in lesson → Generate dynamically with LLM
  const generated = await generateContextoYPregunta(
    plan.activity,           // Simple activity from teacher
    plan.imageDescription,   // Image description from teacher
    plan.evidences,          // Evidences from teacher
    plan.guidingQuestion     // Simple question from teacher
  );
  contexto = generated.contexto;   // ✅ RICH NARRATIVE (different each time)
  question = generated.pregunta;   // ✅ ENRICHED QUESTION (different each time)
}
```

**Result:** Each student sees:
- **Different vivid narrative** (contexto) - generated by LLM with temperature 0.7
- **Different enriched question** - based on evidences and simple question
- **Same image** - from teacher's URL

**Example Output for Student 1:**
```
Contexto: "Imagina que llegas al turno de la mañana y ves a tu compañero Juan
subido en una plataforma a 5 metros de altura, estirándose para alcanzar una
caja de 20 kg. Notas que no lleva arnés de seguridad y la plataforma parece
inestable..."

Pregunta: "¿Qué dos peligros específicos identificas en la situación de Juan
y por qué es peligroso trabajar en estas condiciones sin protección?"
```

**Example Output for Student 2 (DIFFERENT):**
```
Contexto: "Es un día normal en el almacén cuando observas a Pedro, un trabajador
de 32 años, alcanzando una caja pesada desde lo alto de una escalera sin
seguridad. La caja pesa 20 kg y está a 5 metros del suelo..."

Pregunta: "Observando esta escena, ¿cuáles son los peligros principales que
identificas y qué consecuencias podría tener esta situación peligrosa?"
```

#### 4. Sub-Momentos Also Get Dynamic Stories

**Same logic applies to sub-momentos** (M2.1, M2.2, M3.1, etc.):
- Teacher writes simple activity/question
- Saved simple in database
- Orchestrator generates different narrative per student at runtime

**Function:** `loadSubMoment()` in `lib/agents/planUtils.ts:179-209`

#### 5. Current Planner Role (NOT an enricher)

**What Planner DOES:**
- Generates complete lesson structure from scratch
- Used via "Regenerar Estructura con IA" button
- **REPLACES** existing content (teacher loses edits)

**What Planner DOES NOT DO:**
- ❌ Does NOT enrich teacher's simple activities
- ❌ Does NOT save "contexto" field to database
- ❌ Does NOT preserve teacher's manual edits when regenerating

**This is intentional:** Teachers have full control, stories are generated dynamically.

### Key Design Decisions

1. **Teacher writes simple** → Saved simple → **Student sees rich** (generated at runtime)
2. **Each student gets different narrative** → Uses LLM temperature 0.7
3. **Teacher can edit everything** → Full control via UI components
4. **Images only from URL** → No file upload needed
5. **Sub-momentos are optional** → Teacher decides when to use them
6. **Planner generates from scratch** → Not an enricher, replaces content

### Components for Lesson Management

**Reusable Components (shadcn/ui based):**
- `EvidenceManager` - Add/edit/delete evidencias array
- `ImageManager` - Add images from URL, edit metadata, accordion view
- `SubMomentoManager` - Create/edit sub-momentos with nested evidencias
- `TeacherLayout` - Shared layout with navigation

**Location:** `components/lessons/` and `components/teacher/`

## Critical Standards

### 1. Variable Naming Convention

**MANDATORY:** Generic variables in prompts MUST be in ENGLISH, text can be Spanish:

✅ Correct:
```typescript
"Explica cómo funciona [PROCESS] en [MAIN_CONCEPT]"  // Spanish text, English variables
```

❌ Wrong:
```typescript
"Explica cómo funciona [PROCESO] en [CONCEPTO_PRINCIPAL]"  // Spanish variables
```

**Approved variables:** `[MAIN_CONCEPT]`, `[PROCESS]`, `[THEORY]`, `[ELEMENT]`, `[PRINCIPLE]`, `[METHOD]`, `[COMPONENT]`

See: `VARIABLE_STANDARD.md` and `lib/promptConstants.ts:10-74`

### 2. Never Expose Checker Reasoning to Students

The Checker agent returns `evaluation.reasoning` - this is **internal technical analysis** only.

❌ NEVER show to student:
```typescript
// DON'T DO THIS
content: checkerResponse.evaluation.reasoning
```

✅ Always use Tutor agent:
```typescript
// DO THIS
const tutorResponse = await runTutorAgent({
  action: 'provide_feedback',
  evaluation_data: {
    level: checkerResponse.evaluation.level,
    concepts_identified: checkerResponse.evaluation.concepts_identified,
    missing_concepts: checkerResponse.evaluation.missing_concepts
  }
});
```

See: chatController.ts:626-688 for correct pattern

### 3. Zod Schema Pattern

Every agent follows this pattern:

1. Define Input/Output schemas with Zod
2. Infer TypeScript types: `type InputType = z.infer<typeof Schema>`
3. Validate input: `Schema.parse(input)`
4. Convert to JSON Schema for OpenAI: `zodToJsonSchema(Schema, { target: 'openAi' })`
5. Validate LLM output: `Schema.parse(result)`

Example: `lib/agents/tutor.ts:8-103`

### 4. Session State Updates

When updating session state, use helper functions from `lib/sessions.ts`:

```typescript
await addChatMessage(sessionId, {
  role: 'assistant',
  content: message,
  message_type: 'QUESTIONING',
  metadata: { ... }
});

await updateSession(sessionId, {
  current_state: 'WAITING_RESPONSE',
  current_question: questionId
});
```

Never manipulate session JSON directly.

## API Routes

All agents are exposed via `/api/agents/{agentName}`:

- POST `/api/agents/planner` - Generate lesson structure
- POST `/api/agents/tutor` - Generate questions/feedback/hints
- POST `/api/agents/checker` - Evaluate student responses
- POST `/api/chat` - Main chat endpoint (orchestrates agents)
- POST `/api/sessions` - Create/manage student sessions

## Common Patterns

### Adding a New Tutor Action

1. Add action to enum in `lib/agents/tutor.ts:55-62`
2. Create prompt builder in `lib/agents/tutorPrompts.ts`
3. Add case in switch statement in `tutor.ts:127-154`
4. Update output schema if needed
5. Use in chatController.ts with appropriate evaluation_data

### Handling Student Questions

When student asks a definition (detected by Checker as `needs_clarification`):

1. Checker returns `level: 'needs_clarification'`
2. State → `EXPLAINING_BRIEF`
3. Tutor called with `action: 'explain'`
4. After explanation, generate new adjusted question

See: chatController.ts:526-536 and 773-836

### Adding New Error Types

Error types guide hint strategy in `lib/agents/checker.ts`:

- `conceptual` - Misunderstanding core concept
- `procedural` - Wrong steps/order
- `incomplete` - Missing information
- `off_topic` - Unrelated response

Tutor adapts hints based on error_type (tutorPrompts.ts:216-243)

## Session Continuity (Important)

This project uses a **snapshot strategy** to handle context limits:

**Key Files:**
- `docs/SESSION_STATE.md` - Current work state (update every 30 min)
- `docs/DECISION_LOG.md` - Technical decisions log
- `docs/TODO_CURRENT.md` - Persistent TODO list
- `docs/RECOVERY_PLAN.md` - Recovery protocol

**Protocol:**
1. Update SESSION_STATE.md after completing subtasks
2. Make WIP commits every 30-45 min with detailed messages
3. Log important decisions in DECISION_LOG.md
4. Before complex tasks (>1hr), create detailed snapshot

See: `docs/DECISIONES_TECNICAS.md:377-685` for complete strategy

## Troubleshooting

### Placeholder Not Replaced
- Check `replaceConceptPlaceholders()` is called on Planner questions only (NOT Tutor messages)
- Verify lesson has proper `objetivo` and `criterios_evaluacion`
- Check placeholder name matches approved English variables

### Wrong State Transition
- State transitions are managed by Orchestrator via `updateSession()`
- Use `getNextMoment()` to navigate between pedagogical moments
- All flow logic is in `lib/agents/orchestrator.ts`

### Agent Output Invalid
- Check Zod schema matches OpenAI response_format
- Use `strict: true` in JSON schema conversion
- Verify all required fields are present in output schema

### Images Not Showing
- Check image has `momento_id` or `tipo` property
- Verify `filterImagesByMoment()` rules in `lib/llm.ts` match current momento
- Rules: M0=contexto only, M1=contexto+diagrama, M2=ejemplo+recurso+diagrama, M3=ejemplo+recurso, M4=recurso, M5=none
- Confirm image URL is valid and accessible

## Documentation

- `README.md` - Quick start and overview
- `VARIABLE_STANDARD.md` - Variable naming rules
- `docs/DECISIONES_TECNICAS.md` - All technical decisions
- `docs/FASE_0_APRENDIZAJES.md` - Phase 0 learnings
- `docs/FASE_1_AUTENTICACION.md` - Authentication system
- `CHANGELOG.md` - Version history

## Testing Lessons

Test lessons available in `data/lessons/`:
- `lesson_test_001.json` - IPERC safety process lesson
- `lesson_ats_001.json` - ATS work analysis lesson

Use test scripts to validate changes without UI.
