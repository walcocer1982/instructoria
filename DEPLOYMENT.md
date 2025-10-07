# Guía de Deployment - SOPHI

## ✅ Estado Actual del Proyecto

**Build:** ✅ Exitoso
**Base de Datos:** ✅ Neon PostgreSQL configurado
**Autenticación:** ✅ Google OAuth configurado

---

## 📋 Checklist Pre-Deployment

### 1. Variables de Entorno para Producción

Necesitas configurar estas variables en tu plataforma de deployment (Vercel/Netlify/Railway):

```env
# OpenAI API
OPENAI_API_KEY=sk-proj-...

# Neon PostgreSQL (ya configurado)
DATABASE_URL=<tu-neon-database-url>

# NextAuth (Google OAuth)
AUTH_SECRET=<genera-uno-nuevo-con-openssl>
AUTH_GOOGLE_ID=<tu-google-client-id>
AUTH_GOOGLE_SECRET=<tu-google-client-secret>
NEXTAUTH_URL=https://tu-dominio.vercel.app  # ⚠️ CAMBIAR

# Next.js
NODE_ENV=production
```

**Generar AUTH_SECRET nuevo:**
```bash
openssl rand -base64 32
```

---

### 2. Configurar Google OAuth para Producción

**Ir a:** https://console.cloud.google.com/apis/credentials

1. Selecciona tu proyecto
2. Click en el Client ID existente: `<tu-client-id>`
3. En **"Authorized redirect URIs"**, agregar:
   ```
   https://tu-dominio.vercel.app/api/auth/callback/google
   ```
4. Guardar cambios

---

## 🚀 Deployment en Vercel (Recomendado)

### Opción 1: Deploy desde GitHub

1. Push tu código a GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Ir a [vercel.com](https://vercel.com)
3. Click "New Project"
4. Importar tu repositorio
5. Configurar variables de entorno (copiar desde arriba)
6. Click "Deploy"

### Opción 2: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## 🗄️ Base de Datos

**Ya está lista:** Neon PostgreSQL con tablas migradas

**Tablas creadas:**
- ✅ `users` - Usuarios (estudiantes/profesores/admin)
- ✅ `accounts` - Cuentas OAuth
- ✅ `auth_sessions` - Sesiones de autenticación
- ✅ `lessons` - Lecciones pedagógicas
- ✅ `sessions` - Sesiones de estudiantes (con chatHistory y studentReports)
- ✅ `alerts` - Alertas pedagógicas

**Conexión:** Ya configurada con `DATABASE_URL`

---

## 🔐 Sistema de Roles

El sistema asigna roles automáticamente al primer login:

- **STUDENT** (default) - Todos los usuarios
- **TEACHER** - Usuarios con email de dominios específicos
- **ADMIN** - Manual (cambiar en BD)

**Configurar dominios de profesores** en [auth.ts:27](auth.ts#L27):
```typescript
const teacherDomains = ['teacher.com', 'educador.com', 'sophi.edu'];
```

---

## 📊 Sistema de Reportes

**Ya funcional:**
- ✅ Estudiante: Botón "Reportar Problema"
- ✅ Profesor: Ver reportes en tab "Reportes"
- ✅ BD: Campo `studentReports` en sesiones

---

## ⚠️ Problemas Comunes

### 1. Error: "Invalid redirect URI"
**Solución:** Verificar que la URL en Google Console coincida exactamente con tu dominio de producción

### 2. Error: "Prisma Client not generated"
**Solución:** Vercel lo genera automáticamente. Si falla:
```bash
npx prisma generate
```

### 3. Error: "Cannot connect to database"
**Solución:** Verificar `DATABASE_URL` en variables de entorno

### 4. Middleware loop infinito
**Solución:** Ya está configurado correctamente en [middleware.ts](middleware.ts)

---

## 🧪 Testing en Producción

1. **Login con Google:**
   - Ir a `https://tu-dominio.vercel.app`
   - Click "Sign in with Google"
   - Verificar que te asigna rol correcto

2. **Crear lección (como profesor):**
   - Ir a `/teacher/lessons/create`
   - Crear lección de prueba

3. **Chatear como estudiante:**
   - Ir a `/student`
   - Seleccionar lección
   - Probar chat con LLM

4. **Reportar problema:**
   - Durante el chat, click "Reportar Problema"
   - Escribir descripción
   - Verificar que aparece en `/teacher/evaluations/[sessionId]`

---

## 📦 Archivos Importantes

- ✅ [prisma/schema.prisma](prisma/schema.prisma) - Modelo de BD
- ✅ [auth.ts](auth.ts) - Configuración NextAuth
- ✅ [auth.config.ts](auth.config.ts) - Providers OAuth
- ✅ [middleware.ts](middleware.ts) - Protección de rutas
- ✅ [lib/db.ts](lib/db.ts) - Cliente Prisma
- ✅ [.env.local](.env.local) - Variables locales (NO commitear)

---

## 🎯 Próximos Pasos (Post-Deployment)

1. **Migrar funciones JSON → Prisma**
   - Actualizar `lib/lessons.ts` para usar Prisma
   - Actualizar `lib/sessions.ts` para usar Prisma

2. **Crear usuarios iniciales**
   - Primer profesor: Login con Google
   - Cambiar rol a TEACHER en BD si es necesario

3. **Poblar lecciones de prueba**
   - Crear 2-3 lecciones ejemplo

4. **Monitoreo**
   - Configurar alertas en Vercel
   - Revisar logs de Neon

---

## 📞 Support

- Neon Dashboard: https://console.neon.tech
- Vercel Dashboard: https://vercel.com/dashboard
- Google Console: https://console.cloud.google.com

---

**¡Listo para deployment!** 🚀
