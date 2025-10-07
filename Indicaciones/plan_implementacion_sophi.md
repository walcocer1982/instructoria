# Plan de Implementación - SOPHI
## Sistema de Enseñanza Virtual con Agentes LLM

---

## 📋 Información del Proyecto

**Nombre:** SOPHI (Sistema Pedagógico Híbrido Inteligente)
**Arquitectura:** Monolito Next.js 14.2.5 (App Router)
**Stack:** TypeScript + React + OpenAI SDK + Zod
**Base de Datos:** JSON files (MVP) → PostgreSQL (producción)

---

## 🎯 Enfoque de Implementación

### Estrategia Seleccionada: **Opción B (Agentes Primero) + Historia por Historia**

**Justificación:**
1. El sistema multiagente es el core del proyecto
2. Validación temprana de comunicación entre agentes
3. Experimentación con OpenAI SDK sin complejidad del sistema completo
4. Pruebas aisladas de esquemas Zod y structured outputs

---

## 🏗️ Fases de Implementación

### **FASE 0: Fundación de Agentes (Historia 0)**
**Objetivo:** Sistema multiagente funcional con lección mínima viable

#### Historia 0.1: Setup del Proyecto
- [ ] Inicializar proyecto Next.js 14.2.5
- [ ] Instalar dependencias (zod, openai SDK)
- [ ] Configurar TypeScript (tsconfig.json)
- [ ] Crear estructura de carpetas base
- [ ] Configurar variables de entorno (.env)

#### Historia 0.2: Capa LLM Base
- [ ] Implementar `lib/llm.ts` (cliente OpenAI)
- [ ] Probar conexión con API de OpenAI
- [ ] Implementar función `mixTextAndImages` (URLs públicas)
- [ ] Crear tipos base (LLMMessage, LLMClient)

#### Historia 0.3: Sistema de Reglas para Claude
- [ ] Crear `lib/promptConstants.ts`
- [ ] Implementar `SYSTEM_RULES_FOR_CLAUDE`
- [ ] Definir ejemplos de outputs correctos/incorrectos
- [ ] Crear templates de prompts para cada agente

#### Historia 0.4: Agente Planner (Mínimo Viable)
**Comunicación:** Esquema Zod + Structured Outputs

```typescript
// Input Schema (Zod)
const PlannerInputSchema = z.object({
  objective: z.string().min(3),
  images: z.array(ImageRefSchema).optional(),
  constraints: z.array(z.string()).optional()
});

// Output Schema (Zod → JSON Schema)
const PlannerOutputSchema = z.object({
  momentos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    min: z.number(),
    actividad: z.string(),
    evidencias: z.array(z.string())
  }))
});
```

**Tareas:**
- [ ] Crear `lib/agents/planner.ts`
- [ ] Definir schemas Zod (input/output)
- [ ] Implementar llamada OpenAI con `response_format: json_schema`
- [ ] Validar output con Zod.parse()
- [ ] Probar con objetivo genérico: "[CONCEPTO_PRINCIPAL]"

#### Historia 0.5: Agente Tutor (Mínimo Viable)
**Comunicación:** Recibe output de Planner + genera preguntas

```typescript
// Input incluye contexto del Planner
const TutorInputSchema = z.object({
  objective: z.string(),
  momento_id: z.string(),
  planner_output: PlannerOutputSchema,
  chat_history: z.array(ChatMessageSchema).optional()
});

// Output estructurado
const TutorOutputSchema = z.object({
  question: z.string(),
  expected_concepts: z.array(z.string()),
  hint_levels: z.array(z.string())
});
```

**Tareas:**
- [ ] Crear `lib/agents/tutor.ts`
- [ ] Definir schemas Zod
- [ ] Implementar generación de preguntas socráticas
- [ ] Implementar sistema de pistas (3 niveles)
- [ ] Probar con tema random genérico

#### Historia 0.6: Agente Checker (Mínimo Viable)
**Comunicación:** Recibe pregunta + respuesta del estudiante

```typescript
const CheckerInputSchema = z.object({
  objective: z.string(),
  momento_id: z.string(),
  question_context: z.object({
    question_id: z.string(),
    question: z.string(),
    expected_concepts: z.array(z.string())
  }),
  student_answer: z.string(),
  chat_history: z.array(ChatMessageSchema)
});

const CheckerOutputSchema = z.object({
  evaluation: z.object({
    correct: z.boolean(),
    level: z.enum(["correct", "partial", "incorrect"]),
    missing_concepts: z.array(z.string()),
    errors: z.array(z.string()),
    suggested_hint_level: z.number().min(1).max(3)
  })
});
```

**Tareas:**
- [ ] Crear `lib/agents/checker.ts`
- [ ] Definir schemas Zod
- [ ] Implementar lógica de evaluación de respuestas
- [ ] Probar evaluaciones (correcta/parcial/incorrecta)

#### Historia 0.7: API Routes para Agentes
- [ ] Implementar `app/api/agents/[agent]/route.ts`
- [ ] Validación de inputs con Zod
- [ ] Mapeo de agentes a funciones
- [ ] Manejo de errores estructurado
- [ ] Probar endpoints con Postman/curl

#### Historia 0.8: Chat Básico (Prueba de Concepto)
**Lección Mínima Viable:**
```json
{
  "id": "test-001",
  "objetivo": "Comprender [CONCEPTO_PRINCIPAL]",
  "duracion_min": 15,
  "momentos": [
    {
      "id": "M2",
      "nombre": "Modelado",
      "min": 15,
      "actividad": "Explorar [CONCEPTO]",
      "evidencias": ["Responder preguntas"]
    }
  ],
  "imagenes": [
    {
      "url": "https://ejemplo.com/diagrama.png",
      "descripcion": "Diagrama del [CONCEPTO]",
      "tipo": "contexto"
    }
  ]
}
```

**Tareas:**
- [ ] Crear `components/AgentTestChat.tsx`
- [ ] Implementar flujo: Planner → Tutor → Estudiante responde → Checker
- [ ] Mostrar logs de comunicación entre agentes
- [ ] Validar que schemas Zod funcionan correctamente
- [ ] Probar pistas graduales

#### Historia 0.9: Documentación de Aprendizajes
- [ ] Documentar estructuras Zod finales
- [ ] Documentar decisiones sobre OpenAI SDK:
  - ¿Usar `response_format` o function calling?
  - ¿Streaming o respuestas completas?
  - Tokens consumidos por agente
  - Modelo usado (gpt-4o-mini vs gpt-4o)
- [ ] Documentar problemas encontrados y soluciones

---

### **FASE 1: Autenticación y Gestión de Usuarios**

#### Historia 1.1: Modelo de Datos de Usuarios
- [ ] Definir tipo `User` en `types.ts`
- [ ] Crear `data/users.json`
- [ ] Implementar `lib/auth.ts` (funciones CRUD)

#### Historia 1.2: Registro de Usuarios
- [ ] Implementar `POST /api/auth?action=register`
- [ ] Validación con Zod
- [ ] Hash de passwords (bcrypt en producción)
- [ ] Crear session token básico

#### Historia 1.3: Login de Usuarios
- [ ] Implementar `POST /api/auth?action=login`
- [ ] Validación de credenciales
- [ ] Retorno de token + datos de usuario

#### Historia 1.4: UI de Login/Registro
- [ ] Crear `app/login/page.tsx`
- [ ] Formulario de login
- [ ] Formulario de registro
- [ ] Manejo de errores
- [ ] Redirección según rol (profesor/estudiante)

#### Historia 1.5: Middleware de Autenticación
- [ ] Crear `middleware.ts`
- [ ] Proteger rutas según rol
- [ ] Validación de token en headers

---

### **FASE 2: CRUD de Lecciones (Profesor)**

#### Historia 2.1: Modelo de Datos de Lección
- [ ] Definir tipos `Lesson`, `Momento`, `ImageRef`
- [ ] Crear `data/lessons/` directory
- [ ] Función de validación de Lesson

#### Historia 2.2: API de Lecciones
- [ ] `GET /api/lesson` (listar lecciones)
- [ ] `GET /api/lesson?id=xxx` (cargar lección)
- [ ] `POST /api/lesson` (guardar lección)

#### Historia 2.3: Upload de Imágenes
- [ ] Implementar `POST /api/upload`
- [ ] Conversión a base64 data URLs
- [ ] Almacenar en `public/uploads/`
- [ ] Retornar URLs

#### Historia 2.4: UI Creación de Lección (Básica)
- [ ] Crear `app/lesson/page.tsx`
- [ ] Formulario: objetivo, duración, criterios
- [ ] Upload de imágenes con descripción + tipo
- [ ] Previsualización de imágenes cargadas
- [ ] Botón "Generar estructura con agentes"

#### Historia 2.5: Integración con Agentes (Creación)
- [ ] Componente `AgentRunner.tsx`
- [ ] Llamar a agente Planner → Activities → Resources
- [ ] Mostrar progreso de generación
- [ ] Persistir outputs en `lesson.agent_outputs`
- [ ] Guardar lección completa en JSON

#### Historia 2.6: UI Listado de Lecciones
- [ ] Crear `app/lessons/page.tsx`
- [ ] Listar lecciones creadas
- [ ] Botones: Ver, Editar, Eliminar
- [ ] Filtros básicos

#### Historia 2.7: UI Edición de Lección
- [ ] Reutilizar componente de creación
- [ ] Cargar lección existente
- [ ] Actualizar datos
- [ ] Regenerar outputs de agentes si cambia objetivo

---

### **FASE 3: Sistema de Sesiones de Estudiante**

#### Historia 3.1: Modelo de Datos de Sesión
- [ ] Definir tipo `StudentSession`
- [ ] Extender con campos del flujo de chat:
  - `current_state`
  - `current_question`
  - `momento_progress`
- [ ] Crear `data/sessions/` directory

#### Historia 3.2: API de Sesiones
- [ ] `GET /api/session?student_id=x&lesson_id=y`
- [ ] Crear sesión automáticamente si no existe
- [ ] `POST /api/session` (actualizar sesión)
- [ ] Soportar:
  - Agregar mensaje al chat
  - Cambiar momento actual
  - Completar momento
  - Agregar evaluación

#### Historia 3.3: UI Home del Estudiante
- [ ] Crear `app/student/page.tsx`
- [ ] Listar lecciones disponibles (publicadas)
- [ ] Mostrar progreso en lecciones iniciadas
- [ ] Botón "Iniciar" o "Continuar"

#### Historia 3.4: UI Lección del Estudiante (Estructura)
- [ ] Crear `app/student/[lessonId]/page.tsx`
- [ ] Layout: sidebar con momentos M0-M5
- [ ] Indicador de momento actual
- [ ] Área principal para chat
- [ ] Panel de evaluación (oculto hasta M4/M5)

---

### **FASE 4: Chat AI Tutor (El Core)**

#### Historia 4.1: Tipos Extendidos de Chat
- [ ] Actualizar `ChatMessage` con:
  - `message_type`
  - `images` (embebidas)
  - `metadata` (question_id, attempt_count, hint_level, etc.)

#### Historia 4.2: Máquina de Estados del Chat
- [ ] Crear `lib/chatStateMachine.ts`
- [ ] Definir estados: INTRODUCING, EXPOSING, QUESTIONING, etc.
- [ ] Funciones de transición
- [ ] Validación de transiciones válidas

#### Historia 4.3: Mensaje Automático de Bienvenida
- [ ] Al entrar a un momento, generar mensaje INTRODUCING
- [ ] Llamar a agente Planner para obtener intro
- [ ] Agregar a chat_history automáticamente

#### Historia 4.4: Exposición de Contenido con Imágenes
- [ ] Generar mensaje EXPOSING con imágenes filtradas por momento
- [ ] Implementar `filterImagesByMoment` en `lib/llm.ts`
- [ ] Agregar mensaje a chat_history

#### Historia 4.5: Generación de Primera Pregunta
- [ ] Llamar a agente Tutor con contexto del momento
- [ ] Generar pregunta con metadata (question_id, attempt_count=0)
- [ ] Agregar a chat_history

#### Historia 4.6: Flujo Estudiante Responde
- [ ] Componente `StudentChat.tsx`
- [ ] Input de texto para respuesta
- [ ] Enviar mensaje al backend
- [ ] Actualizar sesión (agregar mensaje user)

#### Historia 4.7: Evaluación Automática con Checker
- [ ] Al recibir respuesta del estudiante:
  - Llamar agente Checker
  - Obtener evaluación (correct/partial/incorrect)
- [ ] Determinar siguiente acción:
  - Si correct → PRAISING
  - Si partial/incorrect → CORRECTING

#### Historia 4.8: Feedback Positivo (PRAISING)
- [ ] Generar mensaje de felicitación
- [ ] Marcar pregunta como completada
- [ ] Transición a QUESTIONING (siguiente pregunta)

#### Historia 4.9: Feedback Correctivo (CORRECTING)
- [ ] Generar mensaje de corrección según evaluación
- [ ] Incrementar attempt_count
- [ ] Si attempt < 3 → dar pista (HINTING)
- [ ] Si attempt >= 3 → explicación completa (EXPLAINING)

#### Historia 4.10: Sistema de Pistas Graduales
- [ ] Llamar agente Tutor con hint_level (1, 2, 3)
- [ ] Generar pista según nivel
- [ ] Agregar metadata (hint_level, attempt_count)
- [ ] Mantener estado WAITING_RESPONSE

#### Historia 4.11: Explicación Completa
- [ ] Generar mensaje EXPLAINING con concepto completo
- [ ] Usar imágenes para reforzar explicación
- [ ] Transición a VERIFYING

#### Historia 4.12: Verificación Post-Explicación
- [ ] Generar pregunta QUESTION_RETRY
- [ ] Marcar metadata (is_verification: true)
- [ ] Si respuesta correcta → PRAISING y continuar
- [ ] Si incorrecta → anotar en progreso y continuar

#### Historia 4.13: Transición Entre Preguntas
- [ ] Detectar cuando se completan todas las preguntas del momento
- [ ] Generar mensaje de transición
- [ ] Actualizar `momento_progress`

#### Historia 4.14: Transición Entre Momentos
- [ ] Generar mensaje de felicitación por momento completado
- [ ] Agregar momento_id a `momentos_completed`
- [ ] Mostrar botón "Continuar al siguiente momento"
- [ ] Al hacer clic, cambiar `momento_actual`

#### Historia 4.15: UI del Chat (Completa)
- [ ] Componente `StudentChat.tsx`
- [ ] Mostrar historial de mensajes
- [ ] Renderizar imágenes embebidas
- [ ] Diferenciar visualmente tipos de mensaje
- [ ] Auto-scroll al nuevo mensaje
- [ ] Loading state mientras agente responde

#### Historia 4.16: Persistencia de Estado del Chat
- [ ] Guardar cada mensaje en tiempo real
- [ ] Guardar cambios de estado
- [ ] Guardar progreso por momento
- [ ] Recuperar estado al recargar página

---

### **FASE 5: Evaluación Automatizada**

#### Historia 5.1: Agente Evaluator (Completo)
- [ ] Implementar `lib/agents/evaluator.ts`
- [ ] Generar rúbrica basada en objetivo
- [ ] Schema Zod para output (criterios, niveles)

#### Historia 5.2: API de Evaluación
- [ ] `POST /api/evaluation`
- [ ] Recibir evidencias del estudiante
- [ ] Llamar agente Evaluator
- [ ] Retornar feedback estructurado (score, criterios, sugerencias)

#### Historia 5.3: UI Panel de Evaluación
- [ ] Componente `EvaluationPanel.tsx`
- [ ] Formulario para enviar evidencias
- [ ] Mostrar feedback recibido
- [ ] Visualización de score y criterios

#### Historia 5.4: Persistencia de Evaluaciones
- [ ] Guardar evaluaciones en `StudentSession.evaluations`
- [ ] Timestamp de envío y de feedback
- [ ] Permitir múltiples intentos

#### Historia 5.5: Revisión Manual del Profesor (Opcional)
- [ ] UI para profesor ver evaluaciones de estudiantes
- [ ] Posibilidad de ajustar score
- [ ] Agregar comentarios manuales

---

### **FASE 6: Agentes Complementarios**

#### Historia 6.1: Agente Activities
- [ ] Implementar `lib/agents/activities.ts`
- [ ] Generar actividades por momento
- [ ] Schema Zod para output

#### Historia 6.2: Agente Resources
- [ ] Implementar `lib/agents/resources.ts`
- [ ] Sugerir tipos de recursos visuales
- [ ] Schema Zod para output

#### Historia 6.3: Agente AntiPlagiarism
- [ ] Implementar `lib/agents/antiPlagiarism.ts`
- [ ] Generar variantes de actividades
- [ ] Mecanismos de autenticidad
- [ ] Schema Zod para output

#### Historia 6.4: Integración en Creación de Lección
- [ ] Llamar todos los agentes en paralelo
- [ ] Mostrar progreso
- [ ] Persistir todos los outputs

---

## 🧪 Criterios de Aceptación por Fase

### Fase 0 (Agentes Base)
✅ **Definido como completo cuando:**
- Chat básico funciona con 1 pregunta
- Planner genera estructura M0-M5
- Tutor genera pregunta + pistas
- Checker evalúa respuesta (correct/partial/incorrect)
- Comunicación entre agentes usa Zod schemas
- No hay referencias a temas específicos (fotosíntesis, etc.)

### Fase 1 (Auth)
✅ **Definido como completo cuando:**
- Usuario puede registrarse como profesor/estudiante
- Usuario puede hacer login
- Token se genera y persiste
- Rutas protegidas por rol

### Fase 2 (CRUD Lecciones)
✅ **Definido como completo cuando:**
- Profesor puede crear lección con objetivo
- Profesor puede subir imágenes con descripción + tipo
- Agentes generan estructura automáticamente
- Lección se guarda en JSON con todos los datos
- Profesor puede listar y editar lecciones

### Fase 3 (Sesiones)
✅ **Definido como completo cuando:**
- Estudiante ve lecciones disponibles
- Al iniciar lección, se crea sesión automáticamente
- Sesión persiste progreso (momento actual, completados)
- Estudiante puede retomar sesión

### Fase 4 (Chat AI)
✅ **Definido como completo cuando:**
- Al entrar a momento, IA envía bienvenida automáticamente
- IA expone contenido con imágenes
- IA hace preguntas
- IA evalúa respuestas (correct/partial/incorrect)
- IA da pistas graduales (3 niveles)
- IA explica cuando estudiante falla múltiples veces
- IA re-verifica comprensión después de explicar
- Transiciones entre preguntas y momentos funcionan
- Todo el historial se persiste

### Fase 5 (Evaluación)
✅ **Definido como completo cuando:**
- Estudiante puede enviar evidencias
- Agente Evaluator retorna feedback estructurado
- Feedback incluye: score, criterios, sugerencias
- Evaluación se guarda en sesión

---

## 📊 Estimación de Tiempos

| Fase | Historias | Días Estimados |
|------|-----------|----------------|
| Fase 0: Agentes Base | 9 | 7-10 días |
| Fase 1: Autenticación | 5 | 2-3 días |
| Fase 2: CRUD Lecciones | 7 | 4-5 días |
| Fase 3: Sesiones | 4 | 2-3 días |
| Fase 4: Chat AI (Core) | 16 | 10-12 días |
| Fase 5: Evaluación | 5 | 3-4 días |
| Fase 6: Agentes Extra | 4 | 2-3 días |
| **TOTAL** | **50** | **30-40 días** |

---

## 🔧 Stack Técnico Detallado

### Backend
- **Framework:** Next.js 14.2.5 (App Router)
- **API Routes:** REST con `/api/*`
- **Validación:** Zod 3.23.8
- **LLM Client:** OpenAI SDK (gpt-4o-mini / gpt-4o)
- **Storage:** JSON files (MVP) → PostgreSQL + Prisma (producción)

### Frontend
- **Framework:** React 18.3.1
- **Styling:** CSS-in-JS / Tailwind (TBD)
- **State Management:** React hooks + Context API
- **Forms:** React Hook Form + Zod

### Comunicación entre Agentes
```typescript
// Patrón estándar
Agent A (Input Zod Schema)
  ↓
  Convierte a JSON Schema
  ↓
  OpenAI API (response_format: json_schema)
  ↓
  Output JSON validado
  ↓
  Zod.parse(Output Schema)
  ↓
Agent B (recibe output tipado)
```

### OpenAI SDK - Decisiones Clave

**¿Response Format o Function Calling?**
- **Response Format** para outputs estructurados simples
- **Function Calling** para flujos complejos con múltiples opciones

**¿Streaming o Respuestas Completas?**
- **MVP:** Respuestas completas (más simple)
- **Optimización:** Streaming para mejor UX

**Modelos:**
- **Planner, Activities, Resources:** gpt-4o-mini (más rápido, más barato)
- **Tutor, Checker, Evaluator:** gpt-4o (mejor razonamiento)

---

## 🚀 Próximos Pasos Inmediatos

### Semana 1: Setup + Agentes Base
1. ✅ Inicializar proyecto Next.js
2. ✅ Configurar OpenAI SDK
3. ✅ Implementar `SYSTEM_RULES_FOR_CLAUDE`
4. ✅ Crear agente Planner con Zod
5. ✅ Crear agente Tutor con Zod
6. ✅ Crear agente Checker con Zod
7. ✅ Chat básico de prueba

### Semana 2: Validación de Agentes
1. Probar flujo completo con lección mínima
2. Ajustar prompts según resultados
3. Medir tokens consumidos
4. Optimizar schemas Zod
5. Documentar aprendizajes

### Semana 3+: Continuar con Fases 1-6

---

## 📝 Notas Importantes

### Reglas de Contenido
- ❌ NUNCA incluir temas específicos (fotosíntesis, Pitágoras, etc.)
- ✅ SIEMPRE usar variables genéricas: [CONCEPTO], [PROCESO], [TEORÍA]
- ✅ Validar todos los outputs con `SYSTEM_RULES_FOR_CLAUDE`

### Persistencia
- MVP usa JSON files en `data/`
- Estructura permite migración fácil a DB relacional
- Mantener schemas Zod como source of truth

### Testing
- Cada agente debe tener tests unitarios
- Flujo completo debe tener test de integración
- Validar que schemas Zod rechazan datos inválidos

### Monitoreo
- Loggear tokens consumidos por agente
- Medir latencia de respuestas LLM
- Trackear errores de validación Zod

---

## 🎓 Recursos de Referencia

- **OpenAI Structured Outputs:** https://platform.openai.com/docs/guides/structured-outputs
- **Zod Documentation:** https://zod.dev
- **Next.js App Router:** https://nextjs.org/docs/app
- **Framework Pedagógico:** Gradual Release Model (Fisher & Frey)

---

**Última actualización:** 2025-01-15
**Versión del documento:** 1.0