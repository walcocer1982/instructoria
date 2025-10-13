# 📝 Cheatsheet - Comandos Útiles de Instructoria

## 🚀 Setup Inicial (Solo una vez)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Edita .env con tus credenciales (DATABASE_URL y ANTHROPIC_API_KEY)

# 3. Crear tablas en la base de datos
npm run db:push

# 4. Cargar datos de ejemplo
npm run db:seed

# 5. Iniciar servidor
npm run dev
```

---

## 💻 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Iniciar con puerto específico
PORT=3001 npm run dev

# Ver estructura de archivos
tree -L 3 -I node_modules
```

---

## 🗄️ Base de Datos

```bash
# Ver/editar datos con GUI
npm run db:studio
# Abre http://localhost:5555

# Actualizar schema (desarrollo)
npm run db:push

# Recargar datos de ejemplo
npm run db:seed

# Crear migration (producción)
npx prisma migrate dev --name nombre_cambio

# Ver status de migrations
npx prisma migrate status

# Generar Prisma Client
npx prisma generate

# Resetear BD completa (⚠️ BORRA TODO)
npx prisma migrate reset
```

---

## 🧪 Testing

```bash
# Crear sesión de prueba
npm run test:session

# Ver logs en tiempo real
npm run dev | grep -E "POST|GET|Error"

# Probar API con curl
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_id","topicId":"topic_id"}'

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_id","message":"Hola"}'
```

---

## 🏗️ Build y Deploy

```bash
# Build para producción
npm run build

# Iniciar en modo producción
npm run start

# Verificar build
npm run build && npm run start

# Deploy a Vercel
vercel

# Deploy a Vercel (producción)
vercel --prod
```

---

## 🔍 Debugging

```bash
# Ver todos los logs
npm run dev

# Ver solo errores
npm run dev 2>&1 | grep Error

# Inspeccionar base de datos
npm run db:studio

# Ver queries SQL
# Agrega esto a prisma/schema.prisma:
# datasource db {
#   ...
#   log = ["query", "info", "warn", "error"]
# }

# Ver estructura de tabla específica
npx prisma studio
# Navega a la tabla
```

---

## 📊 Prisma Studio

```bash
# Abrir Prisma Studio
npm run db:studio

# Tablas importantes:
# - User: Usuarios
# - Topic: Temas (IPERC)
# - LearningSession: Sesiones activas
# - Message: Historial de conversaciones
# - ActivityProgress: Progreso del estudiante
# - SecurityIncident: Incidentes de seguridad
```

---

## 🔐 Variables de Entorno

```bash
# Ver variables actuales (sin valores sensibles)
env | grep -E "DATABASE_URL|ANTHROPIC|NEXTAUTH"

# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Verificar que .env existe
cat .env
```

---

## 📦 Git

```bash
# Ver status
git status

# Commit
git add .
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Crear branch
git checkout -b feature/nombre-feature

# Merge branch
git checkout main
git merge feature/nombre-feature
```

---

## 🧹 Limpieza

```bash
# Limpiar node_modules
rm -rf node_modules
npm install

# Limpiar .next
rm -rf .next
npm run dev

# Limpiar todo y reinstalar
rm -rf node_modules .next package-lock.json
npm install
npm run db:push
npm run dev
```

---

## 📈 Queries Útiles (Prisma Studio)

### Ver todos los estudiantes con progreso
```
Tabla: User
Include: courseEnrollments → topicEnrollments
```

### Ver conversaciones de una sesión
```
Tabla: LearningSession
Include: messages
Filtrar por: id = "session_xxx"
```

### Ver actividades completadas
```
Tabla: ActivityProgress
Filtrar por: status = "COMPLETED"
Include: topicEnrollment → topic
```

### Ver incidentes de seguridad
```
Tabla: SecurityIncident
Ordenar por: timestamp (descendente)
```

---

## 🔍 Búsqueda en el Código

```bash
# Buscar término en todo el código
grep -r "término" src/

# Buscar en archivos TypeScript
grep -r "término" --include="*.ts" --include="*.tsx" src/

# Buscar función específica
grep -r "function nombreFuncion" src/

# Buscar imports
grep -r "from '@/services" src/

# Ver archivos que usan Prisma
grep -r "prisma\." src/ | cut -d: -f1 | sort -u
```

---

## 📝 Logs y Debugging

```bash
# Ver logs en tiempo real
npm run dev | tee logs.txt

# Ver solo warnings y errors
npm run dev 2>&1 | grep -E "warn|error" -i

# Ver requests HTTP
npm run dev | grep -E "POST|GET|PUT|DELETE"

# Ver uso de tokens de Anthropic
grep -r "usage" src/services/

# Ver mensajes guardados
# Usa Prisma Studio: npm run db:studio → Message
```

---

## 🧪 Testing Manual

### 1. Test de Moderación
```
Mensaje: [contenido inapropiado]
Esperado: Respuesta de guardrail + log en SecurityIncident
```

### 2. Test de Verificación
```
Mensaje: [respuesta correcta]
Esperado: canAdvance = true, ActivityProgress.status = COMPLETED
```

### 3. Test de Preguntas Off-Topic
```
Mensaje: "¿Cuánto gana un ingeniero?"
Esperado: Respuesta breve + redirección al tema
```

### 4. Test de Memoria
```
1. Completa actividad 1
2. En actividad 2, menciona algo de actividad 1
3. Esperado: Instructor lo recuerda
```

---

## 🎯 Flujo de Trabajo Típico

```bash
# 1. Pull últimos cambios
git pull

# 2. Instalar dependencias si hay nuevas
npm install

# 3. Actualizar BD si cambió schema
npm run db:push

# 4. Iniciar desarrollo
npm run dev

# 5. Hacer cambios en el código

# 6. Probar cambios
npm run test:session
# Abre el link y prueba

# 7. Commit y push
git add .
git commit -m "feat: descripción"
git push
```

---

## 🔥 Comandos de Emergencia

```bash
# Si nada funciona, REINICIAR TODO:
rm -rf node_modules .next package-lock.json
npm install
npm run db:push
npx prisma generate
npm run dev

# Si la BD está corrupta:
npm run db:push --accept-data-loss

# Si Prisma Client está desactualizado:
npx prisma generate

# Si el puerto está ocupado:
lsof -ti:3000 | xargs kill  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

---

## 📱 URLs Importantes

```
# Desarrollo
http://localhost:3000              # Home
http://localhost:3000/learn/[id]   # Chat
http://localhost:5555              # Prisma Studio

# API
http://localhost:3000/api/session/start
http://localhost:3000/api/chat
http://localhost:3000/api/topics
```

---

## 🎓 Comandos de Producción

```bash
# Verificar antes de deploy
npm run build
npm run start

# Deploy a Vercel
vercel

# Ver logs en producción
vercel logs

# Configurar variables en Vercel
vercel env add DATABASE_URL
vercel env add ANTHROPIC_API_KEY
```

---

## 💡 Tips

1. **Siempre usa Prisma Studio** para inspeccionar datos
2. **Reinicia el servidor** después de cambiar .env
3. **Usa `test:session`** en lugar de crear sesiones manualmente
4. **Revisa los logs** en la terminal cuando algo falle
5. **Guarda cambios frecuentemente** con git

---

## 🆘 Errores Comunes

### "ANTHROPIC_API_KEY no está definida"
```bash
# Solución:
echo $ANTHROPIC_API_KEY  # Verificar
# Agregar a .env
# Reiniciar servidor
```

### "Cannot find module '@prisma/client'"
```bash
# Solución:
npx prisma generate
npm run dev
```

### "Database connection failed"
```bash
# Solución:
# 1. Verificar DATABASE_URL en .env
# 2. Verificar conexión a internet
# 3. Verificar IP permitida en Neon
npm run db:studio  # Para probar conexión
```

### "Port 3000 already in use"
```bash
# Solución Mac/Linux:
lsof -ti:3000 | xargs kill

# Solución Windows:
netstat -ano | findstr :3000
taskkill /PID [numero] /F
```

---

## 📚 Documentación de Referencia

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

## 🎯 Comandos por Rol

### Estudiante/Usuario
```bash
npm run test:session  # Crear sesión
# Abrir link y usar
```

### Desarrollador
```bash
npm run dev           # Desarrollar
npm run db:studio     # Ver datos
npm run test:session  # Probar
```

### DevOps
```bash
npm run build         # Build
npm run start         # Producción
vercel deploy         # Deploy
```

### Administrador de Contenido
```bash
npm run db:studio     # Editar contenido
# Modificar seed.ts para nuevo contenido
npm run db:seed       # Recargar
```

---

¡Guarda este cheatsheet para consulta rápida! 🚀
