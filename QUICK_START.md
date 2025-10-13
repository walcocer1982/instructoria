# 🚀 Inicio Rápido - Instructoria

Guía paso a paso para tener Instructoria funcionando en 5 minutos.

## ⚡ Pasos Rápidos

### 1️⃣ Instalar dependencias

```bash
npm install
```

### 2️⃣ Configurar variables de entorno

Crea un archivo `.env` en la raíz:

```env
# Database (Neon PostgreSQL) - Consigue uno gratis en neon.tech
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Anthropic API - Consigue una en console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-api03-..."

# NextAuth (genera con: openssl rand -base64 32)
NEXTAUTH_SECRET="tu-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**¿Dónde consigo estas credenciales?**

📊 **DATABASE_URL (Neon - GRATIS):**
1. Ve a https://neon.tech
2. Crea cuenta (login con GitHub es rápido)
3. Crea nuevo proyecto → Copia la "Connection String"

🤖 **ANTHROPIC_API_KEY:**
1. Ve a https://console.anthropic.com/
2. Sign up (tarjeta requerida, pero $5 gratis)
3. Settings → API Keys → Create Key

### 3️⃣ Configurar la base de datos

```bash
# Push el schema a la base de datos
npm run db:push

# Cargar datos de ejemplo
npm run db:seed
```

Esto crea:
- ✅ Carrera de SSO
- ✅ Instructor IA
- ✅ Curso de Fundamentos
- ✅ Tema IPERC completo
- ✅ Usuario: `estudiante@test.com`

### 4️⃣ Iniciar servidor

```bash
npm run dev
```

Abre http://localhost:3000

### 5️⃣ Crear una sesión de prueba

```bash
npm run test:session
```

Esto te dará un link como:
```
http://localhost:3000/learn/clxxx...
```

¡Abre ese link y empieza a chatear con el instructor IA!

---

## 💬 Ejemplos de Conversación

### Flujo Normal ✅

```
👤 Estudiante: Hola, estoy listo

🤖 Instructor: ¡Perfecto! Vamos a aprender sobre IPERC...
[Explicación]
Ahora, ¿puedes explicarme con tus palabras qué es un peligro?

👤 Estudiante: Un peligro es algo peligroso que hay en el trabajo

🤖 Instructor: Vas por buen camino, pero seamos más específicos...
[Repregunta con pista]

👤 Estudiante: Ah ya, un peligro es como una máquina sin protección
que ya está ahí, y el riesgo es la probabilidad de que me haga daño

🤖 Instructor: ¡Excelente! Explicaste perfecto. Has completado esta
actividad ✅
```

### Pregunta Legítima ✅

```
👤 Estudiante: ¿Qué tipos de peligros existen?

🤖 Instructor: Excelente pregunta. Hay 7 tipos principales:
mecánicos, físicos, químicos, biológicos, ergonómicos,
psicosociales y locativos. [Explica cada uno]
```

### Pregunta Off-Topic ⚠️

```
👤 Estudiante: ¿Cuánto gana un ingeniero de seguridad?

🤖 Instructor: Entiendo tu interés laboral, pero eso está fuera
del alcance de este curso técnico. Te recomiendo buscar en
portales como Computrabajo. Ahora, continuemos con IPERC...
```

### Contenido Inapropiado 🚫

```
👤 Estudiante: [pregunta inapropiada]

🤖 Instructor: No puedo ayudarte con ese tema. Soy un instructor
de SSO y debo mantener conversaciones profesionales. ¿Volvemos a IPERC?

[Se registra incidente en la base de datos]
```

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor en localhost:3000

# Base de datos
npm run db:push          # Actualiza schema
npm run db:studio        # Abre Prisma Studio (GUI)
npm run db:seed          # Carga datos de ejemplo

# Testing
npm run test:session     # Crea sesión de prueba

# Producción
npm run build            # Build para producción
npm run start            # Inicia en producción
```

---

## 🐛 Solución de Problemas

### ❌ Error: "ANTHROPIC_API_KEY no está definida"

**Solución:**
1. Verifica que `.env` existe y tiene `ANTHROPIC_API_KEY`
2. Reinicia el servidor: Ctrl+C y `npm run dev` nuevamente

### ❌ Error: "Database connection failed"

**Solución:**
1. Verifica que `DATABASE_URL` esté correcto en `.env`
2. En Neon, verifica que tu IP esté permitida
3. Prueba la conexión: `npm run db:studio`

### ❌ Error: "Prisma Client not generated"

**Solución:**
```bash
npx prisma generate
npm run dev
```

### ❌ El instructor no responde o responde mal

**Posibles causas:**
1. **API Key inválida:** Verifica en console.anthropic.com
2. **Sin créditos:** Anthropic requiere créditos (revisa tu cuenta)
3. **Prompt mal formado:** Revisa logs en la terminal

**Debugging:**
- Revisa la terminal donde corre `npm run dev`
- Abre DevTools del navegador (F12) → Console
- Verifica tabla `Message` en Prisma Studio

---

## 📊 Ver los Datos

Para explorar la base de datos visualmente:

```bash
npm run db:studio
```

Se abre en http://localhost:5555

Tablas importantes:
- `User` - Usuarios
- `Topic` - Temas (IPERC)
- `LearningSession` - Sesiones activas
- `Message` - Historial de conversaciones
- `ActivityProgress` - Progreso del estudiante
- `SecurityIncident` - Incidentes registrados

---

## 🎯 Próximos Pasos

1. ✅ **Prueba el chat** con diferentes tipos de preguntas
2. ✅ **Observa la moderación** probando contenido inapropiado
3. ✅ **Revisa los logs** en la terminal y Prisma Studio
4. ✅ **Crea tu propio tema** modificando el seed
5. ✅ **Personaliza el instructor** cambiando el systemPrompt

---

## 📚 Más Información

- [README.md](./README.md) - Documentación completa
- [prisma/schema.prisma](./prisma/schema.prisma) - Estructura de BD
- [src/types/topic-content.ts](./src/types/topic-content.ts) - Tipos de contenido
- [prisma/seed.ts](./prisma/seed.ts) - Ejemplo de tema IPERC

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa la documentación completa en [README.md](./README.md)
2. Verifica los logs en la terminal
3. Usa Prisma Studio para inspeccionar datos
4. Revisa la consola del navegador (F12)

¡Listo! 🎉 Ahora tienes Instructoria funcionando.
