# Instructoria 🎓

Plataforma educativa con instructores IA especializados usando Claude de Anthropic.

## 🚀 Características

- ✅ **Instructores IA conversacionales** con Claude Sonnet 4.5
- ✅ **Sistema de memoria** persistente para cada estudiante
- ✅ **Moderación de contenido** automática
- ✅ **Verificación de comprensión** mediante IA
- ✅ **Manejo de preguntas** del estudiante (on-topic y off-topic)
- ✅ **Guardrails** para contenido inapropiado
- ✅ **Tracking de progreso** por actividad
- ✅ **Múltiples carreras** (transversales y especializadas)

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14, React, TailwindCSS
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (Neon)
- **ORM:** Prisma
- **IA:** Anthropic Claude API
- **Autenticación:** NextAuth.js (Google OAuth)

## 📋 Requisitos Previos

- Node.js 18+
- Una cuenta en [Neon](https://neon.tech) (PostgreSQL serverless)
- Una API Key de [Anthropic](https://console.anthropic.com/)
- (Opcional) Credenciales de Google OAuth

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd instructoria
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y completa:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-..."

# NextAuth (opcional por ahora)
NEXTAUTH_SECRET="genera-uno-con: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

#### Obtener DATABASE_URL (Neon):

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta y un nuevo proyecto
3. Copia la connection string (debe empezar con `postgresql://`)

#### Obtener ANTHROPIC_API_KEY:

1. Ve a [console.anthropic.com](https://console.anthropic.com/)
2. Crea una API Key
3. Copia la key (empieza con `sk-ant-`)

### 4. Configurar la base de datos

Pushea el schema a tu base de datos:

```bash
npm run db:push
```

### 5. Cargar datos de ejemplo

Ejecuta el seed para crear datos iniciales (carrera SSO, instructor, curso IPERC):

```bash
npm run db:seed
```

Esto creará:
- ✅ Carrera de Seguridad y Salud Ocupacional
- ✅ Instructor IA especializado en SSO
- ✅ Curso "Fundamentos de SSO"
- ✅ Tema "IPERC" con contenido completo
- ✅ Usuario de prueba: `estudiante@test.com`

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎯 Cómo Usar

### Iniciar una sesión de aprendizaje

1. **Obtén el ID del tema** (desde la base de datos o usando Prisma Studio):

```bash
npm run db:studio
```

2. **Inicia una sesión** haciendo POST a `/api/session/start`:

```bash
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "el-id-del-usuario",
    "topicId": "el-id-del-tema-iperc"
  }'
```

Respuesta:
```json
{
  "success": true,
  "sessionId": "clxxx...",
  "topic": { ... },
  "instructor": { ... },
  "welcomeMessage": "¡Hola! Soy Prof. Claude..."
}
```

3. **Accede al chat** en:
```
http://localhost:3000/learn/[sessionId]
```

### Chatear con el instructor

El instructor IA:
- ✅ Explica conceptos paso a paso
- ✅ Hace preguntas para verificar comprensión
- ✅ Responde dudas del estudiante
- ✅ Da feedback específico
- ✅ Redirige si el estudiante se desvía del tema
- ✅ Bloquea contenido inapropiado

## 📁 Estructura del Proyecto

```
instructoria/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── chat/          # Endpoint de chat
│   │   │   ├── session/       # Manejo de sesiones
│   │   │   └── topics/        # Listado de temas
│   │   ├── learn/[sessionId]/ # Página del chat
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home
│   ├── lib/
│   │   ├── prisma.ts          # Cliente de Prisma
│   │   └── anthropic.ts       # Cliente de Anthropic
│   ├── services/
│   │   ├── chat.ts            # Servicio principal de chat
│   │   ├── moderation.ts      # Moderación de contenido
│   │   ├── intent-classification.ts
│   │   ├── verification.ts    # Verificación de comprensión
│   │   └── prompt-builder.ts  # Constructor de prompts
│   └── types/
│       └── topic-content.ts   # Tipos TypeScript
└── package.json
```

## 🎨 Crear un Nuevo Tema

Para crear tu propio tema educativo:

1. Define el contenido en formato JSON (ver `prisma/seed.ts` como ejemplo)
2. Crea el tema en la base de datos con `prisma.topic.create()`
3. Define:
   - **Momentos**: Secciones del tema
   - **Actividades**: Tareas específicas con:
     - `teaching`: Qué debe enseñar el instructor
     - `verification`: Cómo verificar comprensión
     - `student_questions`: Manejo de preguntas
     - `guardrails`: Protecciones

## 🔐 Seguridad

El sistema incluye múltiples capas de seguridad:

1. **Moderación de contenido**: Detecta contenido inapropiado
2. **Guardrails**: Respuestas automáticas ante violaciones
3. **Logging de incidentes**: Registra intentos de contenido prohibido
4. **Escalación**: Notifica después de múltiples violaciones

## 📊 Visualizar Datos

Para ver los datos en Prisma Studio:

```bash
npm run db:studio
```

## 🐛 Troubleshooting

### Error: "ANTHROPIC_API_KEY no está definida"
- Verifica que `.env` tenga `ANTHROPIC_API_KEY`
- Reinicia el servidor después de modificar `.env`

### Error de conexión a la base de datos
- Verifica que `DATABASE_URL` sea correcto
- Asegúrate de que tu IP esté permitida en Neon

### El instructor no responde bien
- Verifica el `systemPromptBase` del instructor
- Revisa los logs en la consola
- Ajusta `temperature` y `maxTokens` si es necesario

## 📝 Próximas Características

- [ ] Autenticación con Google OAuth
- [ ] Dashboard del estudiante con progreso
- [ ] Certificados al completar temas
- [ ] Más especialidades (Tecnología, Negocios)
- [ ] Sistema de evaluación automática
- [ ] Exportar progreso a PDF

## 📋 CHANGELOG

### v1.3.2 (2025-10-19)
- **Fix:** Mejorar uso de imágenes sugeridas
  - Instructor ahora recibe instrucción más clara sobre cuándo mostrar imágenes
  - Cambio de "RECOMENDADAS" a "SUGERIDAS" con contexto específico
  - Instrucción explícita: mencionar imagen EN EL MOMENTO indicado
  - Reduce casos donde imágenes sugeridas no se muestran

### v1.3.1 (2025-10-19)
- **Fix:** Criterios de verificación más flexibles y balanceados
  - Sistema evalúa COMPRENSIÓN del concepto, no perfección de formato
  - Acepta respuestas correctas aunque no sigan formato exacto
  - Umbral: 70% de comprensión para avanzar (antes implícito 95%+)
  - Reduce fricción pedagógica manteniendo calidad educativa
  - Ejemplo: "charco de agua" vs "charco de 1m²" → Ambos válidos si identificó peligro

### v1.3.0 (2025-10-19)
- **Feature:** Moderación context-aware dinámica
  - Sistema detecta automáticamente el tema del curso (SSO, Salud, General)
  - Contexto adaptativo según carrera y tema actual
  - Whitelists dinámicas basadas en contenido educativo
  - Soporte para múltiples disciplinas educativas (SSO, Medicina, etc.)
  - Elimina necesidad de configuración hardcodeada

### v1.2.1 (2025-10-19)
- **Fix:** Moderación mejorada para contextos educativos de SSO
  - Sistema ahora reconoce términos educativos (riesgo, peligro, lesión, crítico, mayor, menor) como apropiados
  - Prompt de moderación especifica contexto de Seguridad y Salud Ocupacional
  - Elimina falsos positivos en respuestas legítimas de estudiantes sobre clasificación de riesgos

### v1.2.0 (2025-10-19)
- **Feature:** Sistema de imágenes sugeridas con fallback transparente
  - Actividades pueden especificar imágenes recomendadas vía `suggested_image_ids`
  - Si imágenes no disponibles, sistema continúa sin que estudiante perciba problema
  - Logging interno para developers cuando imágenes sugeridas faltan
  - Implementado en tema Inspecciones: 3 imágenes educativas con descripciones detalladas
- **Mejora:** Descripciones de imágenes más detalladas con hallazgos específicos
  - Almacén: 8 hallazgos listados (ACTO/CONDICIÓN)
  - Taller de soldadura: 5 hallazgos con clasificación CRÍTICO/MAYOR/MENOR

### v1.1.1 (2025-10-19)
- **Fix:** Mensaje de finalización cuando estudiante completa último tema
  - Instructor ahora felicita y resume puntos clave al completar tema completo
  - Agregada instrucción especial para última actividad del tema
- **Fix:** Orden de mensajes al recargar página
  - Timestamps explícitos (+1ms) garantizan orden correcto user→assistant
  - Corregida condición de carrera en createMany

### v1.1.0 (2025-10-19)
- **Feature:** Nuevo tema "Inspecciones de Seguridad" (60 min, 5 momentos)
  - Clasificación de actos y condiciones subestándares
  - Tipos de inspecciones según normativa peruana (DS 005-2012-TR)
  - Registro profesional de hallazgos
  - Clasificación CRÍTICO/MAYOR/MENOR con tiempos de levantamiento
  - Inspección simulada completa (caso práctico de área de soldadura)
- **Docs:** Archivo CLAUDE.md con guía completa de arquitectura y desarrollo

### v1.0.0 (2025-10-19)
- **Inicial:** Sistema completo de instructores IA conversacionales
- **Feature:** Moderación de contenido con guardrails de seguridad
- **Feature:** Verificación automática de comprensión del estudiante
- **Feature:** Sistema de memoria y tracking de progreso por actividad
- **Feature:** Integración con MCP Server para imágenes educativas
- **Feature:** Tema completo de IPERC (SSO) con instructor especializado
- **Feature:** Deployment en Vercel con PostgreSQL (Neon)

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -am 'Agrega nueva feature'`)
4. Push a la branch (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT

## 🙏 Créditos

- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Built with [Next.js](https://nextjs.org/)
- Database: [Neon](https://neon.tech/)
