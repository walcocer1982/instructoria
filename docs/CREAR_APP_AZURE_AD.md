# Guía: Crear Aplicación en Azure AD para Instructoria

## 🎯 Objetivo
Crear una aplicación en Azure Active Directory (Microsoft Entra ID) para permitir login con cuentas Microsoft/Azure AD.

## 📋 Pasos Detallados

### 1. Acceder al Azure Portal

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta corporativa (Centro Tecnológico Minero)

### 2. Ir a Azure Active Directory

1. En el buscador superior, escribe "Azure Active Directory" o "Microsoft Entra ID"
2. Haz clic en el resultado

### 3. Crear Nueva App Registration

1. En el menú izquierdo, busca **"App registrations"** (Registros de aplicaciones)
2. Haz clic en **"+ New registration"** (Nuevo registro)

### 4. Configurar la Aplicación

Llena el formulario:

**Nombre:**
```
Instructoria - Plataforma Educativa
```

**Tipos de cuenta admitidos:**
- Selecciona: **"Accounts in this organizational directory only"** (Solo cuentas de este directorio)
  - Esto permite solo usuarios de Centro Tecnológico Minero
- O si quieres permitir cualquier cuenta Microsoft: **"Accounts in any organizational directory and personal Microsoft accounts"**

**Redirect URI (opcional - lo agregaremos después):**
- Déjalo en blanco por ahora

5. Haz clic en **"Register"** (Registrar)

### 5. Copiar Credenciales

Después de crear la app, verás la página "Overview". **Copia estos valores:**

**Application (client) ID:**
```
Ejemplo: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Directory (tenant) ID:**
```
Ejemplo: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### 6. Crear Client Secret

1. En el menú izquierdo, haz clic en **"Certificates & secrets"**
2. Haz clic en **"+ New client secret"**
3. Configurar:
   - **Description:** `Instructoria Production Secret`
   - **Expires:** Selecciona `24 months` (o el que prefieras)
4. Haz clic en **"Add"**
5. **¡IMPORTANTE!** Copia el **Value** (no el Secret ID) inmediatamente
   - Solo se muestra UNA VEZ
   - Ejemplo: `Duv8Q~otvtZvu.tsVCrx5fcYfxSXzHIB8MDXDcdq`

### 7. Configurar Redirect URIs

1. En el menú izquierdo, haz clic en **"Authentication"**
2. Haz clic en **"+ Add a platform"**
3. Selecciona **"Web"**
4. Agregar estas Redirect URIs (una por línea):

**Para desarrollo local:**
```
http://localhost:3000/api/auth/callback/microsoft-entra-id
```

**Para producción (cuando despliegues):**
```
https://instructoria.vercel.app/api/auth/callback/microsoft-entra-id
```

5. En **"Logout URL"** (opcional):
```
http://localhost:3000/login
```

6. Marca las casillas:
   - ✅ **Access tokens** (used for implicit flows)
   - ✅ **ID tokens** (used for implicit and hybrid flows)

7. Haz clic en **"Configure"**

### 8. Configurar API Permissions

1. En el menú izquierdo, haz clic en **"API permissions"**
2. Deberías ver `User.Read` por defecto
3. Haz clic en **"+ Add a permission"**
4. Selecciona **"Microsoft Graph"**
5. Selecciona **"Delegated permissions"**
6. Busca y marca:
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `User.Read` (ya debería estar)

7. Haz clic en **"Add permissions"**

8. **IMPORTANTE:** Haz clic en **"✓ Grant admin consent for [Tu Organización]"**
   - Esto evita que cada usuario tenga que dar consentimiento individualmente
   - Confirma cuando te lo pida

### 9. Actualizar Variables de Entorno

Abre el archivo `.env` en tu proyecto y actualiza:

```env
# Microsoft OAuth
MICROSOFT_CLIENT_ID="[PEGA AQUÍ EL APPLICATION (CLIENT) ID]"
MICROSOFT_CLIENT_SECRET="[PEGA AQUÍ EL CLIENT SECRET VALUE]"
MICROSOFT_TENANT_ID="[PEGA AQUÍ EL DIRECTORY (TENANT) ID]"
```

**Ejemplo:**
```env
MICROSOFT_CLIENT_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
MICROSOFT_CLIENT_SECRET="Abc8Q~xyz123...hash...xyz"
MICROSOFT_TENANT_ID="z9y8x7w6-v5u4-3210-zyxw-vu9876543210"
```

### 10. Reiniciar Servidor

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

### 11. Probar Login

1. Abre: http://localhost:3000/login
2. Haz clic en **"Continuar con Microsoft"**
3. Deberías ser redirigido a login de Microsoft
4. Inicia sesión con tu cuenta de Centro Tecnológico Minero
5. Deberías ser redirigido de vuelta a `/topics`

## 🐛 Troubleshooting

### Error: "AADSTS700016: Application... was not found"
**Causa:** El Client ID no existe en el tenant
**Solución:** Verifica que copiaste correctamente el Application (client) ID de la página Overview

### Error: "AADSTS50011: The redirect URI does not match"
**Causa:** La URI de callback no está registrada
**Solución:** Verifica que agregaste exactamente: `http://localhost:3000/api/auth/callback/microsoft-entra-id`

### Error: "AADSTS65001: User has not consented"
**Causa:** Falta el admin consent
**Solución:** Ve a API permissions y haz clic en "Grant admin consent"

### Error: "invalid_client"
**Causa:** El Client Secret es incorrecto o expiró
**Solución:** Genera un nuevo Client Secret y actualiza `.env`

## 📦 Para Producción

Cuando despliegues a Vercel:

1. **Agregar variables en Vercel:**
   - Settings → Environment Variables
   - Agrega las 3 variables de Microsoft

2. **Actualizar Redirect URI en Azure AD:**
   - Ve a Authentication en Azure AD
   - Agrega: `https://tu-dominio.vercel.app/api/auth/callback/microsoft-entra-id`

## 📚 Referencias

- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [NextAuth Microsoft Provider](https://authjs.dev/getting-started/providers/microsoft-entra-id)
