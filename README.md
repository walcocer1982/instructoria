# SOPHI - Sistema Pedagógico Híbrido Inteligente

Sistema de Enseñanza Virtual con Agentes LLM

## Stack Técnico

- **Framework:** Next.js 14.2.5 (App Router)
- **Lenguaje:** TypeScript
- **Runtime:** React 18.3.1
- **Validación:** Zod 3.23.8
- **IA:** OpenAI SDK
- **Storage:** JSON files (MVP) → PostgreSQL (producción)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` y agregar tu API key de OpenAI.

3. Ejecutar en desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
sophi/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página home
├── components/            # Componentes React
├── lib/                   # Lógica de negocio
│   ├── agents/           # Agentes LLM
│   ├── llm.ts            # Cliente OpenAI
│   └── promptConstants.ts # Templates de prompts
├── types/                 # Tipos TypeScript
├── data/                  # Storage JSON (MVP)
│   ├── users/
│   ├── lessons/
│   └── sessions/
└── public/
    └── uploads/          # Imágenes subidas
```

## Estándar de Variables

⚠️ **IMPORTANTE**: Este proyecto usa variables genéricas en **INGLÉS** para mantener consistencia.

- ✅ Texto en español: "Explica cómo funciona"
- ✅ Variables en inglés: `[MAIN_CONCEPT]`, `[PROCESS]`, `[THEORY]`
- ❌ NUNCA variables en español: `[CONCEPTO]`, `[PROCESO]`, `[TEORÍA]`

Ver documentación completa: [VARIABLE_STANDARD.md](VARIABLE_STANDARD.md)

## Fase Actual

**Fase 0: Fundación de Agentes** ✅
- Historia 0.1: Setup del Proyecto ✅
- Historia 0.2: Capa LLM Base ✅
- Historia 0.3: Sistema de Reglas para Claude ✅
- Historia 0.4: Agente Planner ✅
- Historia 0.5: Agente Tutor ✅
- Historia 0.6: Agente Checker ✅
- Historia 0.7: API Routes para Agentes ✅
- Historia 0.8: Chat Básico (Prueba de Concepto) ✅

- Historia 0.9: Documentación de Aprendizajes ✅

**Fase 1: Autenticación y Gestión de Usuarios** ✅
- Historia 1.1: Modelo de Datos de Usuarios ✅
- Historia 1.2: Registro de Usuarios ✅
- Historia 1.3: Login de Usuarios ✅
- Historia 1.4: UI de Login/Registro ✅
- Historia 1.5: Middleware de Autenticación ✅

**Próximo**: Fase 2 - CRUD de Lecciones (Profesor)

## Pruebas

- **Login/Registro**: `http://localhost:3002/login`
- **Dashboard Profesor**: `http://localhost:3002/teacher`
- **Dashboard Estudiante**: `http://localhost:3002/student`
- **Chat de prueba**: `http://localhost:3002/test-chat`
- **Test Autenticación**: `node test-auth.mjs`
- **Test Agentes**: `node test-planner.mjs`, `node test-tutor.mjs`, `node test-checker.mjs`

## 📚 Documentación

- **[VARIABLE_STANDARD.md](VARIABLE_STANDARD.md)** - Estándar de variables genéricas en inglés
- **[docs/FASE_0_APRENDIZAJES.md](docs/FASE_0_APRENDIZAJES.md)** - Aprendizajes y métricas de Fase 0
- **[docs/FASE_1_AUTENTICACION.md](docs/FASE_1_AUTENTICACION.md)** - Sistema de autenticación completo
- **[docs/DECISIONES_TECNICAS.md](docs/DECISIONES_TECNICAS.md)** - Decisiones técnicas del proyecto
- **[CHANGELOG.md](CHANGELOG.md)** - Historial de cambios

## 🤖 Agentes Implementados

| Agente | Descripción | Endpoint |
|--------|-------------|----------|
| **Planner** | Genera estructura de lección (6 momentos M0-M5) | `/api/agents/planner` |
| **Tutor** | Genera preguntas socráticas y pistas graduales | `/api/agents/tutor` |
| **Checker** | Evalúa respuestas (correct/partial/incorrect) | `/api/agents/checker` |

## Licencia

MIT