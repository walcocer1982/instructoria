# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Instructoria es una plataforma educativa que utiliza instructores IA conversacionales (Claude de Anthropic) para crear experiencias de aprendizaje personalizadas. El sistema incluye verificación de comprensión automática, memoria persistente, moderación de contenido y manejo inteligente de preguntas on-topic y off-topic.

## Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (Neon) con Prisma ORM
- **IA:** Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Autenticación:** NextAuth.js con Google OAuth (preparado pero no implementado aún)
- **Imágenes:** MCP Server personalizado que sirve imágenes educativas desde Azure Blob Storage

## Comandos de Desarrollo

### Desarrollo Local
```bash
npm run dev              # Iniciar servidor de desarrollo (localhost:3000)
npm run build            # Build de producción (incluye prisma generate)
npm start                # Iniciar servidor de producción
npm run lint             # Ejecutar ESLint
```

### Base de Datos (Prisma)
```bash
npm run db:push          # Sincronizar schema con base de datos
npm run db:studio        # Abrir Prisma Studio (GUI para BD)
npm run db:seed          # Cargar datos de ejemplo (seed.ts)
```

### Testing
```bash
npm run test:session     # Probar creación de sesión de aprendizaje (scripts/test-session.ts)
```

## 🔢 Protocolo de Versionamiento

### Regla de Oro: Un Commit = Una Versión

**IMPORTANTE:** Cada commit debe representar una versión funcional y debe incluir:
1. Actualización de `package.json` (versión)
2. Actualización de `README.md` (CHANGELOG)
3. Sistema completamente funcional verificado

### Semver (Semantic Versioning)

Seguimos `MAJOR.MINOR.PATCH`:

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, correcciones menores
  - Ejemplos: Fix typo en prompt, corregir error de validación, ajustar estilos

- **MINOR** (1.0.0 → 1.1.0): Nuevas features sin breaking changes
  - Ejemplos: Nuevo tema educativo, nueva API endpoint, mejora de UI

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - Ejemplos: Cambio de estructura de contentJson, cambio en API contracts, migración de BD

### Flujo de Trabajo por Implementación

#### 1. Antes de Empezar
```bash
# Verificar versión actual
cat package.json | grep version

# Verificar que estamos en un estado limpio
git status
npm run build  # Debe pasar sin errores
```

#### 2. Durante el Desarrollo
- Implementar la feature/fix completamente
- Probar manualmente que funciona
- Ejecutar `npm run lint` y `npx tsc --noEmit`

#### 3. Al Terminar la Implementación

**Paso 1: Actualizar package.json**
```bash
# Editar manualmente o usar npm version
npm version patch  # para 1.0.0 → 1.0.1
npm version minor  # para 1.0.0 → 1.1.0
npm version major  # para 1.0.0 → 2.0.0
```

**Paso 2: Actualizar README.md - Sección CHANGELOG**

Agregar entrada al inicio del CHANGELOG:
```markdown
### v1.0.1 (2025-10-19)
- **Fix:** Descripción concisa del bug corregido
```

O para features:
```markdown
### v1.1.0 (2025-10-19)
- **Feature:** Nueva funcionalidad de [X]
- **Mejora:** Optimización en [Y]
```

**Paso 3: Verificación Final**
```bash
# Verificar que todo funciona
npm run build
npm run dev  # Probar manualmente

# Verificar cambios
git diff package.json
git diff README.md
```

**Paso 4: Commit**

Claude debe sugerir el commit con formato:
```bash
git add package.json README.md [archivos modificados]
git commit -m "v1.0.1: [Descripción concisa]

- Detalle 1 del cambio
- Detalle 2 del cambio

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Ejemplos de Mensajes de Commit

**PATCH (Bug Fix):**
```
v1.0.1: Fix moderación de contenido en mensajes largos

- Corregir timeout en moderateContent para mensajes >1000 chars
- Agregar fallback graceful si moderación falla

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**MINOR (Nueva Feature):**
```
v1.1.0: Agregar tema de Primeros Auxilios

- Implementar nuevo tema con 5 clases y 12 actividades
- Crear instructor especializado en salud ocupacional
- Agregar imágenes educativas al MCP Server

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**MAJOR (Breaking Change):**
```
v2.0.0: Migrar contentJson a nueva estructura

- BREAKING: Cambiar Activities.verification.criteria de array a objeto
- Migración automática de datos existentes
- Actualizar tipos TypeScript y validaciones Zod

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Checklist Pre-Commit (Claude)

Antes de sugerir commit, Claude debe verificar:
- [ ] `package.json` tiene nueva versión
- [ ] `README.md` tiene entrada en CHANGELOG
- [ ] `npm run build` pasa sin errores
- [ ] Sistema es funcional (se probó manualmente)
- [ ] Mensaje de commit es descriptivo y sigue el formato

## 🚀 Protocolo de Release

### Checklist Pre-Release

Antes de crear un nuevo release, ejecutar estos pasos en orden:

#### 1. 🧹 Limpieza de Código
```bash
# Buscar y eliminar console.logs innecesarios (MANTENER console.error/warn)
grep -r "console\.log\|console\.debug" --include="*.ts" --include="*.tsx" src/

# Buscar comentarios TODO/FIXME
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" src/

# Buscar código comentado sin explicación
# IMPORTANTE: NO eliminar comentarios explicativos de arquitectura
# Solo eliminar código muerto comentado
grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" src/app/ src/components/ src/services/
```

**Tipos de Comentarios:**

✅ **MANTENER:**
- Comentarios de arquitectura y patrones
- JSDoc para funciones públicas
- Comentarios de secciones (ej: `// === MODERACIÓN ===`)
- Explicaciones de lógica compleja del chat/verificación

❌ **ELIMINAR:**
- `console.log()` y `console.debug()` (mantener error/warn)
- Código comentado no utilizado
- TODOs temporales resueltos
- Comentarios redundantes

#### 2. 🔍 Verificación de Calidad
```bash
# Ejecutar linter
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar schema de Prisma
npm run db:push -- --dry-run

# Build de producción (incluye prisma generate)
npm run build
```

#### 3. 📝 Actualización de Documentación

**CLAUDE.md:**
- [ ] Agregar nuevos patrones de prompts o servicios
- [ ] Actualizar comandos si cambiaron
- [ ] Documentar cambios en estructura de contenido educativo
- [ ] Agregar soluciones a problemas encontrados

**package.json:**
- [ ] Incrementar versión siguiendo semver:
  - PATCH: bug fixes (1.0.0 → 1.0.1)
  - MINOR: nuevas features (1.0.0 → 1.1.0)
  - MAJOR: cambios breaking (1.0.0 → 2.0.0)

**README.md:**
- [ ] Actualizar características si se agregaron nuevas
- [ ] Actualizar documentación de instalación si cambió
- [ ] Agregar notas sobre nuevos temas/carreras disponibles

#### 4. 🧪 Testing Manual
```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar flujos principales:
# - Crear usuario de prueba (npm run db:seed)
# - Iniciar sesión de aprendizaje (POST /api/session/start)
# - Chatear con instructor (POST /api/chat)
# - Verificar moderación con mensaje inapropiado
# - Verificar que imágenes se carguen desde MCP Server
```

#### 5. ✅ Verificación de Deployment (Vercel)
```bash
# Verificar que build funciona sin DATABASE_URL (Vercel build)
# Prisma debe generar cliente sin error
npm run build

# Verificar que no hay errores de TypeScript
# Verificar que next.config.js tiene configuración correcta de imágenes
```

#### 6. 📋 Changelog

Agregar entrada al README.md o crear CHANGELOG.md:
```markdown
### Versión X.X.X (YYYY-MM-DD)
- **Feature:** [Descripción de nueva funcionalidad]
- **Fix:** [Bug corregido]
- **Mejora:** [Optimización implementada]
- **Breaking:** [Cambio breaking si aplica]
```

## Arquitectura del Sistema

### Flujo de Conversación

El flujo principal del chat sigue estos pasos (implementado en [src/services/chat.ts](src/services/chat.ts)):

1. **Moderación de contenido**: Detecta contenido inapropiado usando Claude API ([src/services/moderation.ts](src/services/moderation.ts))
2. **Clasificación de intención**: Determina si es una pregunta on-topic, off-topic, o respuesta a verificación ([src/services/intent-classification.ts](src/services/intent-classification.ts))
3. **Construcción de prompt**: Genera system prompt dinámico con contexto del tema, actividad actual e historial ([src/services/prompt-builder.ts](src/services/prompt-builder.ts))
4. **Llamada a Claude API**: Envía mensaje y contexto a Claude
5. **Análisis de respuesta**: Si es verificación, analiza la comprensión del estudiante ([src/services/verification.ts](src/services/verification.ts))
6. **Actualización de progreso**: Guarda mensajes y actualiza ActivityProgress si completó criterios ([src/services/progress.ts](src/services/progress.ts))

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

El contenido educativo está almacenado en `Topic.contentJson` como JSON estructurado. Ver [prisma/seed.ts](prisma/seed.ts) para ejemplos de cómo estructurar contenido.

### Tracking de Progreso

```
User
  └── CourseEnrollment
        └── TopicEnrollment
              └── LearningSession (sesión actual)
                    ├── Messages[] (historial completo)
                    └── ActivityProgress[] (evidencias y verificaciones)
```

### Sistema de Imágenes (MCP Server)

El proyecto usa un MCP Server personalizado que sirve imágenes educativas desde Azure:
- Endpoint: `MCP_SERVER_URL` (por defecto: http://instructoria-mcp.eastus.azurecontainer.io:8080)
- Las imágenes se cargan por tema usando `get_images_by_topic`
- Cliente en [src/services/mcp-client.ts](src/services/mcp-client.ts)
- Las imágenes se cachean en `Topic.images` (JSON)

## API Endpoints Principales

### POST /api/session/start
Inicia una nueva sesión de aprendizaje para un usuario y tema.

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
  "topic": { ... },
  "instructor": { ... },
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

## Variables de Entorno Requeridas

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
```

## Estructura de Código

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Endpoint de chat (/api/chat)
│   │   ├── session/       # Manejo de sesiones (/api/session/start)
│   │   ├── topics/        # Listado de temas
│   │   └── auth/          # NextAuth (preparado)
│   ├── learn/[sessionId]/ # Página del chat
│   └── page.tsx           # Home
├── lib/
│   ├── prisma.ts          # Cliente de Prisma (singleton)
│   ├── anthropic.ts       # Cliente de Anthropic
│   ├── type-helpers.ts    # Parsers de JSON a tipos TypeScript
│   └── session-cache.ts   # Cache en memoria para topic context
├── services/
│   ├── chat.ts            # Servicio principal de chat (processStudentMessage)
│   ├── moderation.ts      # Moderación de contenido con Claude
│   ├── intent-classification.ts  # Clasificación de intención del mensaje
│   ├── verification.ts    # Verificación de comprensión del estudiante
│   ├── prompt-builder.ts  # Constructor de system prompts dinámicos
│   ├── progress.ts        # Actualización de progreso y actividades
│   └── mcp-client.ts      # Cliente para MCP Server de imágenes
└── types/
    └── topic-content.ts   # Tipos TypeScript para contenido educativo
```

## Configuración de Prisma

El schema usa PostgreSQL con las siguientes características:
- `binaryTargets = ["native", "debian-openssl-3.0.x"]` para soporte Vercel
- `prisma generate` se ejecuta automáticamente en `postinstall` y `build`
- Seed con datos de ejemplo: Carrera SSO, Curso "Fundamentos de SSO", Tema "IPERC"

## Consideraciones de Seguridad

El sistema incluye múltiples capas de seguridad:
1. **Moderación de contenido**: Detecta contenido sexual, violencia, actividades ilegales, ataques personales, discurso de odio y spam
2. **Guardrails**: Respuestas automáticas ante violaciones con mensajes apropiados
3. **Logging de incidentes**: Registra intentos de contenido prohibido en tabla `SecurityIncident`
4. **Escalación**: Sistema preparado para notificar después de múltiples violaciones

## Deployment (Vercel)

El proyecto está configurado para Vercel:
- `build` script ejecuta `prisma generate` antes de `next build`
- `postinstall` también ejecuta `prisma generate` para asegurar que el cliente Prisma esté disponible
- Configuración en [next.config.js](next.config.js) incluye soporte para imágenes de Azure Blob Storage
- La página de login está marcada como dinámica para evitar errores de build

## Notas Importantes

- **System Prompts**: El instructor IA usa prompts dinámicos construidos en [src/services/prompt-builder.ts](src/services/prompt-builder.ts) que incluyen contexto del tema, actividad actual, historial y guardrails
- **Optimización de Performance**: El sistema usa cache en memoria para topic context ([src/lib/session-cache.ts](src/lib/session-cache.ts)) y ejecuta moderación + clasificación en paralelo
- **Type Safety**: Todo el contenido JSON se parsea a tipos TypeScript usando Zod schemas en [src/lib/type-helpers.ts](src/lib/type-helpers.ts)
- **Path Aliases**: Usa `@/*` para referenciar archivos en `src/` (configurado en [tsconfig.json](tsconfig.json))

## Crear Nuevo Contenido Educativo

Para agregar un nuevo tema:

1. Define el contenido en JSON siguiendo la estructura en [prisma/seed.ts](prisma/seed.ts):
   - `Classes`: Clases del tema
   - `Moments`: Momentos dentro de cada clase
   - `Activities`: Actividades con `teaching`, `verification`, `student_questions`, `guardrails`

2. Crea el tema usando Prisma:
   ```typescript
   await prisma.topic.create({
     data: {
       title: "Mi Tema",
       contentJson: { topic: {...}, classes: [...] },
       courseId: "...",
       instructorId: "..."
     }
   })
   ```

3. Opcionalmente, carga imágenes usando el MCP Server o almacénalas directamente en `Topic.images`

## Documentación Adicional

- [README.md](README.md): Instalación y uso básico
- [ARCHITECTURE.md](ARCHITECTURE.md): Arquitectura detallada del sistema
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md): Estructura completa del proyecto
- [QUICK_START.md](QUICK_START.md): Guía rápida de inicio
