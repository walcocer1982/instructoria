# Monolito Web (Next.js + API interna) — Estructura y archivos clave

> **Objetivo**: Un chat, app monolítica web (frontend + backend en el mismo repo) para un curso 100% virtual. **Sin** incluir ningún curso ni ejemplo de tema. Incluye agentes LLM que aceptan **URLs de imágenes** que tú provees, para que el modelo las use como contexto.

---

## 1) Árbol de carpetas
```
sophi/
├─ app/
│  ├─ page.tsx
│  ├─ lesson/
│  │  └─ page.tsx
│  ├─ api/
│  │  ├─ agents/
│  │  │  └─ [agent]/route.ts
│  │  └─ upload/route.ts
│  └─ layout.tsx
├─ components/
│  └─ AgentRunner.tsx
├─ lib/
│  ├─ llm.ts
│  └─ agents/
│     ├─ planner.ts
│     ├─ activities.ts
│     ├─ tutor.ts
│     ├─ checker.ts
│     ├─ evaluator.ts
│     ├─ resources.ts
│     └─ antiPlagiarism.ts
├─ types.ts
├─ package.json
├─ next.config.js
├─ tsconfig.json
├─ .env.example
└─ README.md
```

---

## 2) `package.json`
```json
{
  "name": "sophi",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zod": "3.23.8",
    "is-url-superb": "6.1.0",
    "undici": "6.19.8"
  },
  "devDependencies": {
    "typescript": "5.5.4"
  }
}
```

---

## 3) `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  }
};
module.exports = nextConfig;
```

---

## 4) `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true,
    "baseUrl": ".",
    "paths": {"@/*": ["./*"]},
    "allowJs": false,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["./"]
}
```

---

## 5) `.env.example`
```dotenv
# Proveedor LLM (usa el que prefieras). Ej.: OpenAI, Anthropic, etc.
LLM_PROVIDER=openai
LLM_API_KEY=xxxxx
# (Opcional) Si tu proveedor acepta imágenes por URL, no necesitas descargar archivos.
```

---

## 6) `types.ts`
```ts
export type AgentName =
  | "planner"
  | "activities"
  | "tutor"
  | "checker"
  | "evaluator"
  | "resources"
  | "antiPlagiarism";

export type ImageRef = { url: string; note?: string };

export type AgentInputBase = {
  objective: string;              // objetivo único de la sesión
  images?: ImageRef[];            // URLs que tú provees
  constraints?: string[];         // límites o políticas
};

export type AgentResponse = {
  ok: boolean;
  content: unknown;               // estructura varía por agente
  usage?: { tokens?: number };
  warnings?: string[];
};
```

---

## 7) `lib/llm.ts` (capa única para llamadas LLM con soporte a imágenes por URL)
```ts
import { ImageRef } from "@/types";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

// Interface mínima para distintos proveedores
export interface LLMClient {
  chat(messages: LLMMessage[], opts?: { model?: string }): Promise<{ text: string }>;
}

// Implementación de ejemplo con OpenAI-compatible (puedes cambiarla)
export class OpenAIClient implements LLMClient {
  constructor(private apiKey: string) {}
  async chat(messages: LLMMessage[], opts?: { model?: string }): Promise<{ text: string }> {
    // Nota: aquí solo dejamos el esqueleto para no acoplar a un vendor específico.
    // Integra tu SDK real en producción.
    const model = opts?.model ?? "gpt-4o-mini";
    // Simulación de respuesta:
    return { text: `Modelo: ${model}. Mensajes recibidos: ${messages.length}.` };
  }
}

export function buildLLM() : LLMClient {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  const key = process.env.LLM_API_KEY ?? "";
  if (!key) throw new Error("Falta LLM_API_KEY");
  switch (provider) {
    case "openai":
    default:
      return new OpenAIClient(key);
  }
}

export function mixTextAndImages(text: string, images?: ImageRef[]) {
  const content: LLMMessage["content"] = [{ type: "text", text }];
  for (const img of images ?? []) {
    // validación simple de URL; asume que son públicas
    if (img.url.startsWith("http://") || img.url.startsWith("https://")) {
      content.push({ type: "image_url", image_url: { url: img.url } });
    }
  }
  return content;
}
```

---

## 8) Agentes (`lib/agents/*.ts`)
> Todos aceptan `objective`, `images` (opcional) y `constraints`. **No** incluyen contenidos, cursos ni temas; solo plantillas/estructuras.

### 8.1 `lib/agents/planner.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runPlanner(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Eres Planificador de Lección. Devuelve estructura por M0–M5.",
    "No incluyas ningún ejemplo de tema ni nombres de cursos.",
    "Usa un solo objetivo de aprendizaje (objective).",
    "Incluye tiempos sugeridos, evidencias y criterios observables.",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Asistente instruccional." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { plan: text } };
}
```

### 8.2 `lib/agents/activities.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runActivities(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Diseña actividades/casos alineados a un único objetivo.",
    "Entrega sin contenidos concretos; solo estructuras de pasos y entregables.",
    "Incluye variantes parametrizables y criterios de autenticidad.",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Diseñador de actividades." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { activities: text } };
}
```

### 8.3 `lib/agents/tutor.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runTutor(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Eres Tutor Socrático. Genera preguntas progresivas y repreguntas.",
    "No proporciones respuestas finales ni ejemplos de temas.",
    "Incluye manejo de errores típicos (sin contenido temático).",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Tutor Socrático." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { prompts: text } };
}
```

### 8.4 `lib/agents/checker.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runChecker(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Genera micro-checks mínimos (conceptual y aplicado) sin contenido de ejemplo.",
    "Incluye solo formatos y claves abstractas (sin datos temáticos).",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Verificador de comprensión." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { checks: text } };
}
```

### 8.5 `lib/agents/evaluator.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runEvaluator(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Devuelve una rúbrica breve (4 criterios) y formato de feedback sin ejemplos de tema.",
    "Estructura en JSON genérico: criterios[], niveles[], feedback_template.",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Evaluador formativo." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { rubric: text } };
}
```

### 8.6 `lib/agents/resources.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runResources(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Sugiere tipos de recursos a pedir (imágenes, esquemas, diagramas).",
    "No enlaces concretos ni contenidos; solo especificaciones del recurso.",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Curador de recursos." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { resource_specs: text } };
}
```

### 8.7 `lib/agents/antiPlagiarism.ts`
```ts
import { AgentInputBase, AgentResponse } from "@/types";
import { buildLLM, mixTextAndImages } from "@/lib/llm";

export async function runAntiPlagiarism(input: AgentInputBase): Promise<AgentResponse> {
  const llm = buildLLM();
  const prompt = [
    "Propón mecanismos de autenticidad (variantes de enunciado, cambios de parámetros, trazas de proceso).",
    "No uses ni inventes contenidos temáticos.",
    ...(input.constraints ?? [])
  ].join("\n");

  const messages = [
    { role: "system" as const, content: [{ type: "text" as const, text: "Detector de autenticidad." }] },
    { role: "user" as const, content: mixTextAndImages(`Objetivo: ${input.objective}\n${prompt}`, input.images) }
  ];

  const { text } = await llm.chat(messages);
  return { ok: true, content: { authenticity: text } };
}
```

---

## 9) API: `app/api/agents/[agent]/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentName } from "@/types";
import { runPlanner } from "@/lib/agents/planner";
import { runActivities } from "@/lib/agents/activities";
import { runTutor } from "@/lib/agents/tutor";
import { runChecker } from "@/lib/agents/checker";
import { runEvaluator } from "@/lib/agents/evaluator";
import { runResources } from "@/lib/agents/resources";
import { runAntiPlagiarism } from "@/lib/agents/antiPlagiarism";

const schema = z.object({
  objective: z.string().min(3),
  images: z
    .array(z.object({ url: z.string().url(), note: z.string().optional() }))
    .optional(),
  constraints: z.array(z.string()).optional()
});

const map: Record<AgentName, Function> = {
  planner: runPlanner,
  activities: runActivities,
  tutor: runTutor,
  checker: runChecker,
  evaluator: runEvaluator,
  resources: runResources,
  antiPlagiarism: runAntiPlagiarism
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent: AgentName }> }
) {
  const { agent } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const fn = map[agent];
  if (!fn) return NextResponse.json({ ok: false, error: "Agente no soportado" }, { status: 404 });
  const res = await fn(parsed.data);
  return NextResponse.json(res);
}
```

---

## 10) API: `app/api/upload/route.ts` (registro de imágenes por URL)
```ts
import { NextRequest, NextResponse } from "next/server";
import isUrl from "is-url-superb";

export async function POST(req: NextRequest) {
  const { urls } = await req.json();
  if (!Array.isArray(urls)) {
    return NextResponse.json({ ok: false, error: "Se espera array de URLs" }, { status: 400 });
  }
  const accepted = urls.filter((u) => isUrl(u));
  // No descargamos nada: las imágenes se pasan por URL al LLM.
  // Podrías guardar un log aquí si quisieras.
  return NextResponse.json({ ok: true, images: accepted.map((u) => ({ url: u })) });
}
```

---

## 11) UI: `app/layout.tsx`
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ padding: 16, maxWidth: 960, margin: '0 auto' }}>
          <h1>Monolito — Curso Virtual</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
```

---

## 12) UI: `app/page.tsx` (home)
```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <p>App monolítica para curso virtual (sin contenidos). Usa agentes LLM y URLs de imagen.</p>
      <ul>
        <li><Link href="/lesson">Crear artefactos de lección</Link></li>
      </ul>
    </main>
  );
}
```

---

## 13) UI: `app/lesson/page.tsx` (form simple para disparar agentes)
```tsx
'use client';
import { useState } from 'react';
import AgentRunner from '@/components/AgentRunner';

export default function LessonPage() {
  const [objective, setObjective] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [constraints, setConstraints] = useState('');

  return (
    <main>
      <h2>Lección (1 objetivo)</h2>
      <label>Objetivo de aprendizaje</label>
      <input value={objective} onChange={e=>setObjective(e.target.value)} style={{width:'100%', padding:8, margin:'8px 0'}} />

      <label>URLs de imágenes (separadas por coma)</label>
      <input value={imageUrls} onChange={e=>setImageUrls(e.target.value)} style={{width:'100%', padding:8, margin:'8px 0'}} />

      <label>Restricciones/Políticas (una por línea)</label>
      <textarea value={constraints} onChange={e=>setConstraints(e.target.value)} style={{width:'100%', padding:8, height:120, margin:'8px 0'}} />

      <AgentRunner
        objective={objective}
        images={imageUrls.split(',').map(s=>s.trim()).filter(Boolean).map(url=>({url}))}
        constraints={constraints.split('\n').map(s=>s.trim()).filter(Boolean)}
      />
    </main>
  );
}
```

---

## 14) Componente: `components/AgentRunner.tsx`
```tsx
'use client';
import { useState } from 'react';

const AGENTS = [
  'planner',
  'activities',
  'tutor',
  'checker',
  'evaluator',
  'resources',
  'antiPlagiarism'
] as const;

type Props = {
  objective: string;
  images: { url: string }[];
  constraints: string[];
};

export default function AgentRunner({ objective, images, constraints }: Props) {
  const [logs, setLogs] = useState<Record<string, any>>({});
  const run = async (agent: string) => {
    const res = await fetch(`/api/agents/${agent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective, images, constraints })
    });
    const json = await res.json();
    setLogs((p) => ({ ...p, [agent]: json }));
  };

  return (
    <section>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'12px 0'}}>
        {AGENTS.map(a => (
          <button key={a} onClick={()=>run(a)} disabled={!objective}>
            {a}
          </button>
        ))}
      </div>
      <pre style={{background:'#f6f6f6', padding:12, whiteSpace:'pre-wrap'}}>
        {JSON.stringify(logs, null, 2)}
      </pre>
    </section>
  );
}
```

---

## 15) `README.md` (cómo correr)
```md
# Monolito Curso (sin contenidos)

## Requisitos
- Node.js 20+
- LLM_API_KEY

## Pasos
1. `cp .env.example .env` y completa `LLM_API_KEY`.
2. `npm i`
3. `npm run dev`
4. Abre `http://localhost:3000`.

## Notas
- Pega **URLs públicas de imágenes** en el formulario. El backend no descarga nada; solo pasa las URLs al LLM.
- Cambia `lib/llm.ts` para el proveedor real (SDK/endpoint) que uses.
- Los agentes **no** incluyen contenidos, cursos ni temas. Son estructuras/plantillas.
```

Json lesson

{
"curso": "",
"objetivo": "",
"duracion_min": 60,
"criterios_exito": ["", "", ""],
"evidencia_principal": "",
"recursos": [""],
"momentos": [
{"id": "M0", "nombre": "Apertura", "min": 8, "actividad": "OA + pregunta gatillo", "evidencias": [""]},
{"id": "M1", "nombre": "Activación", "min": 8, "actividad": "Piensa–pareja–comparte", "evidencias": [""]},
{"id": "M2", "nombre": "Modelado", "min": 14, "actividad": "Ejemplo y contrajemplo + guía", "micro_check": ["2 ítems R/ corta"], "evidencias": [""]},
{"id": "M3", "nombre": "Práctica guiada", "min": 20, "actividad": "Caso con 3 entregables", "autenticidad": "parámetros por equipo", "evidencias": [""]},
{"id": "M4", "nombre": "Práctica autónoma", "min": 8, "actividad": "Producto individual + rúbrica (4 criterios)", "micro_check": ["1 aplicado"], "evidencias": [""]},
{"id": "M5", "nombre": "Cierre", "min": 6, "actividad": "Exit ticket + siguiente paso", "evidencias": [""]}
]
}