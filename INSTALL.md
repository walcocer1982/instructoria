# 🚀 Guía de Instalación - Instructoria

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- ✅ **npm** (viene con Node.js)
- ✅ **Git** - [Descargar aquí](https://git-scm.com/)
- ✅ Una cuenta en **Neon** (PostgreSQL) - [Registro gratis](https://neon.tech)
- ✅ Una **API Key de Anthropic** - [Obtener aquí](https://console.anthropic.com/)

---

## 📥 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/instructoria.git
cd instructoria
```

---

## 📦 Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias (~200 MB).

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1 Obtener DATABASE_URL (Neon)

1. Ve a https://neon.tech
2. Crea una cuenta (gratis, puedes usar GitHub)
3. Crea un nuevo proyecto:
   - Nombre: `instructoria`
   - Región: Elige la más cercana
4. En el dashboard, copia la **Connection String**
   - Debe verse así: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/instructoria?sslmode=require`

### 3.2 Obtener ANTHROPIC_API_KEY

1. Ve a https://console.anthropic.com/
2. Crea una cuenta (requiere tarjeta, pero $5 USD gratis)
3. Ve a **Settings → API Keys**
4. Click en **Create Key**
5. Copia la key (empieza con `sk-ant-api03-...`)

### 3.3 Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto:

```bash
# En Mac/Linux:
touch .env

# En Windows:
type nul > .env
```

Edita el archivo `.env` y agrega:

```env
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/instructoria?sslmode=require"

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-api03-xxxxx"

# NextAuth
NEXTAUTH_SECRET="genera-con-comando-abajo"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.4 Generar NEXTAUTH_SECRET

```bash
# Mac/Linux:
openssl rand -base64 32

# Windows (PowerShell):
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
```

Copia el resultado y pégalo en `NEXTAUTH_SECRET`.

---

## 🗄️ Paso 4: Configurar Base de Datos

```bash
# Push el schema a tu base de datos
npm run db:push

# Cargar datos de ejemplo (SSO + IPERC)
npm run db:seed
```

**Salida esperada:**
```
✅ Carrera SSO creada
✅ Instructor SSO creado
✅ Curso Fundamentos creado
✅ Tema IPERC creado
✅ Usuario de prueba creado

🎉 Seed completado!
```

---

## ▶️ Paso 5: Iniciar Servidor

```bash
npm run dev
```

**Salida esperada:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info  Prisma Client generated
```

Abre tu navegador en **http://localhost:3000**

---

## 🧪 Paso 6: Probar el Sistema

### Opción A: Crear Sesión Automáticamente

```bash
# En otra terminal (deja la primera corriendo)
npm run test:session
```

**Salida:**
```
✅ Usuario encontrado: Estudiante de Prueba
✅ Tema encontrado: IPERC
✅ Sesión creada

🌐 Abre en el navegador:
   http://localhost:3000/learn/clxxx...
```

Abre ese link y ¡empieza a chatear con el instructor IA!

### Opción B: Crear Sesión Manualmente (API)

```bash
# Obtén los IDs de Prisma Studio
npm run db:studio

# Abre http://localhost:5555
# Ve a tabla User → copia el ID
# Ve a tabla Topic → copia el ID del tema "IPERC"

# Crea la sesión con curl:
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "el-id-del-usuario",
    "topicId": "el-id-del-tema-iperc"
  }'

# Respuesta incluirá: { "sessionId": "..." }
# Abre: http://localhost:3000/learn/[sessionId]
```

---

## ✅ Verificación de Instalación

### 1. Verificar que el servidor está corriendo

```bash
curl http://localhost:3000
```

Debe retornar HTML.

### 2. Verificar conexión a base de datos

```bash
npm run db:studio
```

Debe abrir http://localhost:5555 con todas las tablas.

### 3. Verificar API de chat

```bash
# Primero crea una sesión con test:session
# Luego:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "el-session-id",
    "message": "Hola, estoy listo para aprender"
  }'
```

Debe retornar JSON con la respuesta del instructor.

---

## 🎯 ¡Listo!

Si llegaste hasta aquí, **¡Instructoria está instalado y funcionando!** 🎉

### Próximos pasos:

1. 🗨️ **Chatea con el instructor** en http://localhost:3000/learn/[sessionId]
2. 📊 **Explora los datos** con Prisma Studio: `npm run db:studio`
3. 📚 **Lee la documentación** en los archivos .md
4. 🎨 **Personaliza el contenido** editando `prisma/seed.ts`

---

## 🆘 Solución de Problemas

### Error: "ANTHROPIC_API_KEY no está definida"

**Causa:** El archivo `.env` no existe o no tiene la variable.

**Solución:**
1. Verifica que `.env` existe: `ls -la .env`
2. Abre `.env` y verifica que tiene `ANTHROPIC_API_KEY=...`
3. Reinicia el servidor: Ctrl+C y `npm run dev`

---

### Error: "Cannot connect to database"

**Causa:** DATABASE_URL incorrecto o base de datos no accesible.

**Soluciones:**
1. Verifica DATABASE_URL en `.env`
2. En Neon dashboard, verifica que el proyecto está activo
3. En Neon, ve a Settings → **Allow all IPs** (para desarrollo)
4. Prueba la conexión: `npm run db:studio`

---

### Error: "Port 3000 already in use"

**Causa:** Otro proceso está usando el puerto 3000.

**Solución Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

**Solución Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID [numero] /F
npm run dev
```

O usa otro puerto:
```bash
PORT=3001 npm run dev
```

---

### Error: "Prisma Client not generated"

**Causa:** El cliente de Prisma no se generó.

**Solución:**
```bash
npx prisma generate
npm run dev
```

---

### Error: No aparece nada al abrir el chat

**Causas posibles:**
1. La sesión no se creó correctamente
2. No hay mensaje de bienvenida
3. Error en el frontend

**Solución:**
1. Abre DevTools (F12) → Console
2. Busca errores en rojo
3. Verifica en Prisma Studio que la sesión existe:
   ```bash
   npm run db:studio
   # Ve a LearningSession
   ```
4. Verifica que hay un mensaje inicial:
   ```bash
   # En Prisma Studio → Message
   # Debe haber un mensaje con role='assistant'
   ```

---

### Error: "Request failed with status code 500"

**Causa:** Error en el backend.

**Solución:**
1. Revisa la terminal donde corre `npm run dev`
2. Busca el error en rojo
3. Si es error de Anthropic:
   - Verifica tu API key
   - Verifica que tienes créditos
   - Ve a https://console.anthropic.com/
4. Si es error de BD:
   - Verifica DATABASE_URL
   - Ejecuta `npm run db:push`

---

### El instructor no responde bien

**Posibles causas:**
1. API key inválida
2. Prompt mal construido
3. Sin créditos en Anthropic

**Solución:**
1. Verifica tu cuenta en https://console.anthropic.com/
2. Revisa los logs en la terminal
3. Verifica tabla `Message` en Prisma Studio
4. Verifica que `systemPromptBase` del instructor sea válido

---

## 📱 Acceso Rápido

| Servicio | URL |
|----------|-----|
| **App** | http://localhost:3000 |
| **Chat** | http://localhost:3000/learn/[sessionId] |
| **Prisma Studio** | http://localhost:5555 |
| **Neon Dashboard** | https://console.neon.tech/ |
| **Anthropic Console** | https://console.anthropic.com/ |

---

## 🔄 Reinstalación Completa

Si todo falla, reinstala desde cero:

```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar todo
rm -rf node_modules .next package-lock.json

# 3. Reinstalar
npm install

# 4. Reconfigurar BD
npm run db:push

# 5. Recargar datos
npm run db:seed

# 6. Reiniciar
npm run dev
```

---

## 📚 Documentación Adicional

- **[README.md](./README.md)** - Documentación completa
- **[QUICK_START.md](./QUICK_START.md)** - Guía de 5 minutos
- **[CHEATSHEET.md](./CHEATSHEET.md)** - Comandos útiles
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica

---

## 🆘 ¿Todavía tienes problemas?

1. Revisa los logs en la terminal
2. Abre un issue en GitHub
3. Revisa la documentación completa
4. Verifica que cumples todos los requisitos previos

---

¡Esperamos que disfrutes usando Instructoria! 🎓🤖
