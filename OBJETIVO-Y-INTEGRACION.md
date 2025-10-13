# 🎯 Objetivo del MCP Server y su Integración con Instructoria

## 📌 Contexto del proyecto

**Instructoria** es una plataforma educativa con instructores IA que enseñan diferentes carreras (SSO, Enfermería, Administración, etc.) mediante conversaciones guiadas por momentos y actividades.

**Problema identificado:**
- Las imágenes educativas son críticas para ciertos momentos (ej: matriz 3×3 de riesgos, tabla de 7 tipos de peligros)
- Hardcodear imágenes en el código dificulta el mantenimiento
- Agregar nuevas carreras requeriría modificar seed.ts cada vez
- Necesitamos un sistema centralizado, escalable y multi-curso

---

## 🎯 Objetivo del MCP Server

Crear un **banco centralizado de imágenes educativas** en Azure que:

1. ✅ **Almacena** todas las imágenes de todos los cursos en Azure Blob Storage
2. ✅ **Cataloga** metadatos ricos en Cosmos DB (cuándo usar, prioridad, descripción)
3. ✅ **Provee** 3 herramientas (tools) para que Instructoria consulte imágenes según necesidad
4. ✅ **Permite** agregar nuevas imágenes sin tocar código de Instructoria
5. ✅ **Identifica** automáticamente imágenes críticas vs opcionales por prioridad

---

## 🏗️ Arquitectura completa

```
┌─────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                             │
│                                                                 │
│  ┌────────────────────┐         ┌──────────────────────────┐  │
│  │  Blob Storage      │         │  Cosmos DB               │  │
│  │  instructoriaimages│         │  instructoria-catalog    │  │
│  │                    │         │                          │  │
│  │  /iperc/critical/  │         │  Database: instructoria  │  │
│  │    tipos.svg       │◄────────│  Container: images_cat.. │  │
│  │    matriz.svg      │         │                          │  │
│  │  /iperc/practical/ │         │  {id, topic, moment_id,  │  │
│  │    taller.jpg      │         │   priority, cdn_url...}  │  │
│  │  /enfermeria/...   │         │                          │  │
│  └────────────────────┘         └──────────────────────────┘  │
│           │                                   │                │
│           │ URLs públicas                     │ Metadata       │
│           │                                   │                │
│  ┌────────▼───────────────────────────────────▼─────────────┐ │
│  │         MCP Server (stdio protocol)                      │ │
│  │                                                           │ │
│  │  Tools:                                                  │ │
│  │  1. get_images_by_topic(topic, priority)                │ │
│  │  2. get_images_by_moment(moment_id)                     │ │
│  │  3. search_images(query)                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MCP Protocol (llamada única al inicio)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              INSTRUCTORIA (Next.js + Prisma + Neon)             │
│                                                                 │
│  Al iniciar curso:                                             │
│  ────────────────                                              │
│  1. Usuario inicia "IPERC"                                     │
│  2. Llamada MCP: get_images_by_topic("iperc", "critical")      │
│  3. MCP responde: [                                            │
│       { id: "tipos-peligros", url: "https://...", ... },       │
│       { id: "matriz-3x3", url: "https://...", ... },           │
│       { id: "jerarquia-controles", url: "https://...", ... }   │
│     ]                                                          │
│  4. Cachear en LearningSession.imagesCache (JSON)              │
│                                                                 │
│  Durante conversación:                                         │
│  ────────────────────────                                      │
│  - NO más llamadas al MCP                                      │
│  - Usar imágenes del cache según moment_id actual             │
│  - Si MCP falló al inicio → curso continúa sin imágenes        │
│                                                                 │
│  Prompt del instructor:                                        │
│  ──────────────────────                                        │
│  "IMÁGENES DISPONIBLES PARA MOMENTO 2:                         │
│   1. Tabla de 7 tipos de peligros - URL: https://...          │
│      Cuándo mostrarla: Cuando expliques los 7 tipos           │
│   2. Foto taller soldadura - URL: https://...                 │
│      Cuándo mostrarla: Para ejercicio práctico"               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de integración paso a paso

### **Fase 1: MCP Server funcionando (lo que haremos primero)**

1. ✅ Proyecto MCP creado en `C:\Users\LEGION\projets\instructoria-mcp-server`
2. ⏳ Ejecutar `setup-azure.ps1` para crear recursos
3. ⏳ Subir 3 imágenes críticas del IPERC
4. ⏳ Probar MCP localmente

### **Fase 2: Integración básica con Instructoria (después)**

En el proyecto Instructoria:

#### **A) Instalar cliente MCP**
```bash
cd C:\Users\LEGION\projets\instructoria
npm install @modelcontextprotocol/sdk
```

#### **B) Crear servicio de imágenes**
Archivo: `src/services/image-service.ts`

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

/**
 * Obtener imágenes desde el MCP Server
 */
export async function fetchImagesForTopic(
  topicSlug: string,
  priority: 'critical' | 'practical' | 'all' = 'critical'
): Promise<any[]> {
  try {
    // 1. Conectar al MCP Server
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['C:\\Users\\LEGION\\projets\\instructoria-mcp-server\\dist\\index.js']
    })

    const client = new Client({
      name: 'instructoria-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    })

    await client.connect(transport)

    // 2. Llamar tool del MCP
    const result = await client.callTool({
      name: 'get_images_by_topic',
      arguments: {
        topic: topicSlug,
        priority: priority === 'all' ? undefined : priority
      }
    })

    // 3. Parsear resultado
    const response = JSON.parse(result.content[0].text)

    await client.close()

    return response.images || []
  } catch (error) {
    console.error('⚠️ Error al obtener imágenes del MCP:', error)
    // Fallar silenciosamente - la clase continúa sin imágenes
    return []
  }
}
```

#### **C) Modificar inicio de sesión**
Archivo: `src/app/api/session/start/route.ts`

```typescript
import { fetchImagesForTopic } from '@/services/image-service'

export async function POST(req: Request) {
  const { topicId, userId } = await req.json()

  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  })

  // 🆕 Obtener imágenes desde MCP
  const images = await fetchImagesForTopic(topic.slug, 'critical')

  console.log(`📸 Imágenes obtenidas: ${images.length}`)

  // Crear sesión con imágenes cacheadas
  const session = await prisma.learningSession.create({
    data: {
      userId,
      topicEnrollmentId: enrollmentId,
      currentMomentId: firstMoment.id,
      currentActivityId: firstActivity.id,
      imagesCache: images // 🆕 Cache de imágenes
    }
  })

  return Response.json({ sessionId: session.id })
}
```

#### **D) Modificar prompt-builder**
Archivo: `src/services/prompt-builder.ts`

```typescript
export function buildSystemPrompt(
  activity: Activity,
  conversationHistory: Message[],
  session: LearningSession // 🆕 Recibir sesión
) {
  let systemPrompt = `...`

  // 🆕 Agregar imágenes disponibles según momento actual
  const imagesCache = session.imagesCache as any[] || []
  const momentImages = imagesCache.filter(img =>
    img.moment_id === session.currentMomentId
  )

  if (momentImages.length > 0) {
    systemPrompt += `\n\nIMÁGENES DISPONIBLES PARA ESTE MOMENTO:\n`
    momentImages.forEach((img, i) => {
      systemPrompt += `
${i + 1}. ${img.title}
   URL: ${img.url}
   Cuándo mostrarla: ${img.when_to_show}
   Descripción: ${img.description}
`
    })
  }

  return systemPrompt
}
```

---

## 📊 Prioridades de imágenes

### **CRITICAL (críticas)**
Imágenes esenciales para la comprensión del concepto:
- Matriz 3×3 de evaluación de riesgos
- Tabla de 7 tipos de peligros
- Pirámide de jerarquía de controles

**Sin estas imágenes, el aprendizaje es significativamente más difícil.**

### **PRACTICAL (prácticas)**
Ejemplos visuales que refuerzan:
- Foto de taller de soldadura (para identificar peligros)
- Ejemplos de EPP
- Plantilla de matriz IPERC

**Útiles pero no indispensables. Se puede enseñar sin ellas.**

### **OPTIONAL (opcionales)**
Alternativas o contextos específicos:
- Variaciones de matrices (2×2, 5×5)
- Ejemplos de otras industrias
- Infografías alternativas

**Solo se cargan si el estudiante pregunta específicamente.**

---

## 💰 Costos y optimización

### **Estrategia de llamadas:**
- ✅ **1 llamada al MCP** al inicio del curso
- ✅ Cache en `LearningSession.imagesCache`
- ✅ **0 llamadas** durante toda la conversación
- ✅ Si MCP falla → curso continúa sin imágenes

### **Costos estimados:**
- Storage (100 imágenes): ~$0.001/mes
- Cosmos DB: $0/mes (free tier)
- Bandwidth: $0/mes (primeros 100GB gratis)
- **Total: ~$0.10/mes**

### **Tokens:**
- Llamada MCP: ~300 tokens
- 6 imágenes con metadata en prompt: ~600 tokens/sesión
- **Costo: ~$0.002 por estudiante**

---

## 🎯 Ventajas del enfoque

### **1. Escalabilidad**
```
✅ Agregar nueva carrera = solo subir imágenes al MCP
✅ No tocar código de Instructoria
✅ Reutilizar imágenes entre cursos
```

### **2. Mantenibilidad**
```
✅ Actualizar imagen = solo resubir a Azure
✅ Metadata centralizada en Cosmos DB
✅ Un solo lugar para gestionar todo
```

### **3. Flexibilidad**
```
✅ Instructor decide cuándo mostrar cada imagen
✅ Prioridades claras (critical, practical, optional)
✅ Búsqueda por keywords
```

### **4. Resiliencia**
```
✅ Si MCP falla → clase continúa sin imágenes
✅ No bloquea la funcionalidad core
✅ Degrada gracefully
```

---

## 📝 Estructura de una imagen en el catálogo

```json
{
  "id": "iperc-tipos-peligros",
  "topic": "iperc",
  "moment_id": "moment_002",
  "priority": "critical",
  "title": "Tabla de 7 Tipos de Peligros",
  "description": "Tabla visual que clasifica los 7 tipos...",
  "blob_path": "iperc/critical/tipos-peligros.svg",
  "cdn_url": "https://instructoriaimages.blob.core.windows.net/educational-images/iperc/critical/tipos-peligros.svg",
  "keywords": ["peligros", "clasificacion", "sso"],
  "when_to_show": "Cuando expliques los 7 tipos de peligros en el Momento 2",
  "usage_contexts": [
    "Inicio de Momento 2: Identificación de Peligros",
    "Si el estudiante pregunta sobre tipos de peligros"
  ],
  "created_at": "2025-10-11T10:00:00Z"
}
```

---

## 🔄 Estado actual del proyecto

### ✅ Completado:
- [x] Proyecto MCP Server creado
- [x] Estructura completa con 3 tools
- [x] Scripts de deploy para Azure
- [x] Script para subir imágenes
- [x] Documentación completa (README.md)

### ⏳ Pendiente (en orden):
1. Ejecutar `setup-azure.ps1` para crear recursos en Azure
2. Configurar `.env` con credenciales
3. Probar MCP localmente con `npm run dev`
4. Subir 3 imágenes críticas del IPERC
5. Probar tools del MCP
6. **LUEGO**: Integrar en Instructoria (Fase 2)

---

## 🚫 Decisión importante: Standby de Instructoria

**Acuerdo:**
- Proyecto Instructoria en **standby** hasta tener MCP 100% funcional
- Enfoque total en MCP Server primero
- Una vez probado el MCP → retomar integración

**Razón:**
- Evitar complicaciones mezclando dos proyectos
- Probar MCP de forma aislada
- Integrar solo cuando esté sólido

---

## 📋 Checklist para retomar Instructoria

Cuando el MCP esté listo, integrar siguiendo estos pasos:

- [ ] MCP Server probado y funcional
- [ ] Al menos 3 imágenes subidas y catalogadas
- [ ] Tools del MCP responden correctamente
- [ ] Instalar `@modelcontextprotocol/sdk` en Instructoria
- [ ] Crear `src/services/image-service.ts`
- [ ] Modificar `src/app/api/session/start/route.ts`
- [ ] Modificar `src/services/prompt-builder.ts`
- [ ] Agregar campo `imagesCache` a `LearningSession` en schema.prisma
- [ ] Probar flujo completo end-to-end
- [ ] Verificar que si MCP falla, clase continúa sin imágenes

---

## 🎯 Objetivo final

**Un instructor IA que:**
1. Al iniciar curso IPERC, consulta el MCP
2. Recibe URLs de 3-6 imágenes críticas/prácticas
3. Durante Momento 2, menciona: "Aquí tienes la tabla de tipos de peligros: [URL]"
4. El frontend muestra la imagen desde Azure CDN
5. El estudiante aprende con apoyo visual efectivo
6. Si MCP falla, el instructor enseña solo con texto

**Todo esto sin hardcodear URLs ni modificar código al agregar nuevas imágenes.**

---

## 📞 Punto de retorno

**Cuando vuelvas a trabajar en Instructoria:**

1. Lee este documento completo
2. Verifica que el MCP esté corriendo: `npm run dev` en `instructoria-mcp-server`
3. Sigue el checklist de integración
4. Consulta `README.md` del MCP si necesitas recordar comandos

**Estado del MCP:** ⏳ En implementación (esperando setup de Azure)

---

**Fecha de creación:** 2025-10-11
**Proyecto MCP:** `C:\Users\LEGION\projets\instructoria-mcp-server`
**Proyecto Instructoria:** `C:\Users\LEGION\projets\instructoria` (standby)
