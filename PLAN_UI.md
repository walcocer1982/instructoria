# Plan de Mejoras de UI - Chat de Instructoria

## 🎯 Objetivo
Rediseñar la interfaz del chat para mejorar la experiencia de usuario, basándose en patrones modernos de chat educativo.

## 📊 Análisis de la Imagen de Referencia

### Elementos a Implementar:

#### 1. **Mensajes del Instructor (Sin Burbuja)** ✅
```
[Avatar]  Es como tener un cuchillo afilado sobre la mesa...

          Texto libre, sin fondo de burbuja
          Puede tener palabras en **negrita** para énfasis

          16:20 (timestamp pequeño)
```
- **Formato:** Texto plano sin burbuja
- **Avatar:** Pequeño y circular a la izquierda
- **Timestamp:** Discreto, gris claro
- **Énfasis:** Palabras clave en negrita (ej: "cuchillo", "peligro", "riesgo")

#### 2. **Mensajes del Estudiante (Burbuja Redondeada)** ✅
```
┌──────────────────────────────────────────────────┐
│  entendí                              [Avatar]   │
└──────────────────────────────────────────────────┘
```
- **Formato:** Burbuja redondeada con fondo blanco/gris muy claro
- **Avatar:** A la derecha, dentro o al lado de la burbuja
- **Texto:** Alineado a la derecha
- **Bordes:** Muy redondeados (border-radius grande)

#### 3. **Área de Input con Micrófono** ✅
```
┌────────────────────────────────────────────────────────┐
│  ¿Tienes alguna pregunta específica? (Shift+Enter...  │
│                                                        │
│  Pregunta específica o usa los botones arriba • Enter  │
└────────────────────────────────────────────────────────┘
```
- **Placeholder:** Texto instructivo claro
- **Helper text:** Indicación de shortcuts (Shift+Enter, etc)
- **Fondo:** Blanco con borde sutil
- **Bordes:** Redondeados

## 🎨 Propuesta de Diseño (3 Cambios Principales)

### **Cambio 1: Mensajes del Instructor sin Burbuja** ✅

**Antes:**
```tsx
<div className="bg-instructor-50 text-gray-900 border border-instructor-200 px-4 py-3 rounded-2xl">
  {mensaje del instructor}
</div>
```

**Después:**
```tsx
<div className="text-gray-800 max-w-3xl">
  {mensaje del instructor con formato rico}
  <span className="text-xs text-gray-400 mt-2 block">16:20</span>
</div>
```

**Características:**
- Sin fondo de color
- Sin borde
- Tipografía más grande y legible
- Palabras clave en negrita automática
- Timestamp discreto abajo

---

### **Cambio 2: Mensajes del Estudiante con Burbuja Redondeada** ✅

**Antes:**
```tsx
<div className="bg-student-500 text-white px-4 py-3 rounded-2xl">
  {mensaje del estudiante}
</div>
```

**Después:**
```tsx
<div className="bg-white border border-gray-200 shadow-sm px-5 py-3 rounded-3xl max-w-xl">
  {mensaje del estudiante}
</div>
```

**Características:**
- Fondo blanco o gris muy claro (#F9FAFB)
- Borde sutil (border-gray-200)
- Sombra suave para elevación
- Border-radius más grande (rounded-3xl o custom 24px)
- Texto gris oscuro (no blanco)
- Avatar dentro o al lado de la burbuja

---

### **Cambio 3: Área de Input Mejorada con Micrófono** ✅

**Características principales:**
- Textarea con auto-expansión (max 4 líneas)
- Placeholder instructivo con shortcut hints
- Helper text discreto abajo
- **Botón de micrófono** con estados (normal/grabando)
- Botón de enviar (habilitado solo con texto)
- Bordes redondeados (rounded-2xl)
- Focus ring con color del instructor

**Estados del micrófono:**
1. **Normal:** Ícono de micrófono gris, hover bg-gray-100
2. **Grabando:** Ícono de micrófono tachado (MicOff), fondo rojo claro, ring rojo
3. **Disabled:** Cuando está loading el mensaje

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  Textarea (auto-expand)                    [🎤][↑] │
│                                                    │
│  Helper text: "Usa el micrófono • Enter..."       │
└────────────────────────────────────────────────────┘
```

---

### **Cambio 5: Layout y Espaciado**

**Nuevo espaciado:**
- Mensajes del instructor: `space-y-4` (más espacio entre líneas)
- Avatar del instructor: Siempre visible, alineado arriba
- Avatar del estudiante: Dentro de la burbuja o al lado derecho
- Padding general del chat: `px-8 py-6` (más generoso)

**Ancho máximo:**
- Mensajes del instructor: `max-w-3xl` (más ancho, sin restricción de burbuja)
- Mensajes del estudiante: `max-w-xl` (más compacto)

---

## 📝 Implementación Paso a Paso

### **Fase 1: Mensajes del Instructor (Sin Burbuja)**

**Archivos a modificar:**
- `src/app/learn/[sessionId]/page.tsx` (líneas ~380-430)

**Cambios:**
1. Remover clases: `bg-instructor-50`, `border`, `border-instructor-200`, `rounded-2xl`
2. Agregar: Procesamiento de texto para **negrita** en palabras clave
3. Ajustar tipografía: `text-base` → `text-lg`, line-height generoso
4. Timestamp abajo y discreto

**Código:**
```tsx
{msg.role === 'assistant' && (
  <div className="flex gap-4 max-w-4xl">
    <Avatar className="h-10 w-10 flex-shrink-0">
      <AvatarImage src={sessionInfo.instructor.avatar} />
      <AvatarFallback className="bg-instructor-100 text-instructor-700">
        {sessionInfo.instructor.name.charAt(0)}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1">
      <MessageWithImageRefs
        content={msg.content}
        onImageClick={handleImageRefClick}
        onImageMentioned={handleImageMentioned}
        // Nuevo: formato sin burbuja
        variant="plain"
      />
      <span className="text-xs text-gray-400 mt-2 block">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </span>
    </div>
  </div>
)}
```

---

### **Fase 2: Mensajes del Estudiante (Burbuja Mejorada)**

**Cambios:**
1. Cambiar de `bg-student-500 text-white` a `bg-white border shadow-sm`
2. Aumentar border-radius a `rounded-3xl`
3. Ajustar colores de texto
4. Mover avatar dentro/al lado de la burbuja

**Código:**
```tsx
{msg.role === 'user' && (
  <div className="flex gap-3 justify-end max-w-4xl ml-auto">
    <div className="bg-white border border-gray-200 shadow-sm px-5 py-3 rounded-3xl max-w-xl">
      <div className="text-gray-800 text-base whitespace-pre-wrap">
        {msg.content}
      </div>
      <div className="text-xs text-gray-400 mt-1 text-right">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </div>
    </div>

    <Avatar className="h-10 w-10 flex-shrink-0">
      <AvatarImage src={sessionInfo.user.avatar} />
      <AvatarFallback className="bg-gray-100 text-gray-700">
        {sessionInfo.user.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  </div>
)}
```

---

### **Fase 3: Mejoras en MessageWithImageRefs**

**Archivo:** `src/components/MessageWithImageRefs.tsx`

**Agregar prop `variant`:**
```tsx
interface MessageWithImageRefsProps {
  content: string
  onImageClick: (imageTitle: string) => void
  onImageMentioned: (imageTitle: string) => void
  variant?: 'bubble' | 'plain' // Nuevo
}

export function MessageWithImageRefs({
  content,
  onImageClick,
  onImageMentioned,
  variant = 'plain' // Default sin burbuja
}: MessageWithImageRefsProps) {
  // ... código existente

  const baseClasses = variant === 'plain'
    ? 'text-gray-800 text-lg leading-relaxed'
    : 'text-gray-900 text-base'

  return (
    <div className={baseClasses}>
      {/* Procesar contenido con markdown-style bold */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ children }) => (
            <span className="font-bold text-gray-900">{children}</span>
          ),
          // ... otros componentes
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

---

### **Fase 4: Mejoras en el Input (con Micrófono)**

**Cambios en el textarea:**

```tsx
<div className="border-t bg-white p-4">
  <div className="max-w-4xl mx-auto">
    {/* Indicador de grabación (solo visible cuando está grabando) */}
    {isRecording && (
      <div className="mb-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
        <span className="font-medium">Grabando... Habla ahora</span>
      </div>
    )}

    {/* Contenedor con posición relativa */}
    <div className="relative">
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          // Auto-expandir textarea
          e.target.style.height = 'auto'
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
        }}
        onKeyDown={handleKeyPress}
        onPaste={(e) => {
          // Bloquear paste (seguridad)
          e.preventDefault()
        }}
        placeholder="¿Tienes alguna pregunta específica? (Shift+Enter para salto de línea)..."
        className="w-full px-5 py-4 pr-24 border-2 border-gray-200 rounded-2xl
                   focus:outline-none focus:ring-2 focus:ring-instructor-400 focus:border-transparent
                   resize-none text-base bg-white placeholder-gray-400
                   transition-all duration-200"
        style={{
          minHeight: '56px',
          maxHeight: '120px',
        }}
        rows={1}
        disabled={loading}
      />

      {/* Helper text discreto (solo visible cuando NO hay texto) */}
      {!input && !isRecording && (
        <div className="absolute bottom-3 left-5 text-xs text-gray-400 pointer-events-none">
          Usa el micrófono o escribe • Enter para enviar
        </div>
      )}

      {/* Botones flotantes con mejor diseño */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white">
        {/* Botón de micrófono con 3 estados */}
        <button
          onClick={toggleVoiceRecognition}
          disabled={loading}
          className={`p-2.5 rounded-xl transition-all ${
            isRecording
              ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-2 ring-red-300 animate-pulse'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title={isRecording ? 'Detener grabación' : 'Iniciar dictado por voz'}
          type="button"
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        {/* Botón de enviar */}
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className={`p-2.5 rounded-xl transition-all ${
            input.trim() && !loading
              ? 'bg-instructor-600 text-white hover:bg-instructor-700 hover:shadow-md'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
          title="Enviar mensaje"
          type="button"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

**Detalles importantes del micrófono:**
- **Normal state:** Ícono gris, hover suave
- **Recording state:**
  - Fondo rojo claro (`bg-red-50`)
  - Texto rojo (`text-red-600`)
  - Ring rojo (`ring-2 ring-red-300`)
  - Animate pulse (late un poco)
  - Ícono cambia a `MicOff`
- **Indicador visual arriba:** "Grabando... Habla ahora" con punto pulsante
- **Disabled:** Cuando `loading` es true

---

## 🎨 Paleta de Colores Propuesta

```css
/* Instructor Messages (sin burbuja) */
--instructor-text: #1F2937;        /* gray-800 */
--instructor-text-light: #6B7280;  /* gray-500 */
--timestamp: #9CA3AF;              /* gray-400 */

/* Student Messages (burbuja) */
--student-bubble-bg: #FFFFFF;      /* white */
--student-bubble-border: #E5E7EB;  /* gray-200 */
--student-text: #1F2937;           /* gray-800 */

/* Content Cards */
--card-bg: #F5E6D3;                /* beige/amarillo suave */
--card-border: #E8D4B8;            /* beige oscuro */
--card-text: #1F2937;              /* gray-800 */

/* Input Area */
--input-bg: #FFFFFF;               /* white */
--input-border: #E5E7EB;           /* gray-200 */
--input-border-focus: #818CF8;     /* instructor-400 */
--input-placeholder: #9CA3AF;      /* gray-400 */

/* Micrófono */
--mic-normal: #6B7280;                 /* gray-500 */
--mic-hover-bg: #F3F4F6;               /* gray-100 */
--mic-recording-bg: #FEF2F2;           /* red-50 */
--mic-recording-text: #DC2626;         /* red-600 */
--mic-recording-ring: #FCA5A5;         /* red-300 */

/* Emphasis */
--text-bold: #111827;              /* gray-900 */
```

---

## 📱 Responsive Considerations

### Mobile (< 768px)
- Mensajes del instructor: `max-w-full` (ancho completo)
- Mensajes del estudiante: `max-w-full` (ancho completo)
- Avatares más pequeños: `h-8 w-8`
- Padding reducido: `px-4 py-3`
- Tarjetas de contenido: padding reducido

### Tablet (768px - 1024px)
- Mensajes del instructor: `max-w-2xl`
- Mensajes del estudiante: `max-w-lg`

### Desktop (> 1024px)
- Layout actual

---

## ✅ Checklist de Implementación (3 Fases)

### Fase 1: Mensajes del Instructor y Estudiante
- [ ] Remover burbuja de mensajes del instructor (quitar bg, border)
- [ ] Agregar burbuja blanca a mensajes del estudiante
- [ ] Ajustar avatares y posicionamiento
- [ ] Actualizar timestamps (más discretos)
- [ ] Ajustar espaciado entre mensajes
- [ ] Mejorar tipografía (text-lg para instructor)

### Fase 2: Componente MessageWithImageRefs
- [ ] Agregar prop `variant` ('bubble' | 'plain')
- [ ] Soporte para markdown/bold en mensajes del instructor
- [ ] Ajustar estilos según variant
- [ ] Mantener funcionalidad de imágenes

### Fase 3: Área de Input con Micrófono
- [ ] Mejorar placeholder y helper text
- [ ] Rediseñar botón de micrófono (3 estados)
- [ ] Agregar indicador visual "Grabando..."
- [ ] Rediseñar botón de enviar
- [ ] Agregar animaciones suaves (pulse, transitions)
- [ ] Verificar que Web Speech API funciona correctamente

### Fase 4: Testing
- [ ] Probar grabación de voz en Chrome/Edge/Safari
- [ ] Verificar responsive en mobile/tablet/desktop
- [ ] Probar con mensajes largos del instructor
- [ ] Verificar accesibilidad (ARIA labels, keyboard navigation)
- [ ] Performance con historial largo

### Fase 5: Refinamiento
- [ ] Ajustar espaciados finales
- [ ] Pulir animaciones del micrófono
- [ ] Verificar colores y contraste (WCAG AA)
- [ ] Optimizar para dark mode (futuro)

---

## 🚀 Próximos Pasos

1. **Implementar Fase 1** - Mensajes del instructor (sin burbuja) y estudiante (con burbuja blanca)
2. **Implementar Fase 2** - Mejoras en MessageWithImageRefs (soporte markdown)
3. **Implementar Fase 3** - Área de input con micrófono mejorado
4. **Testing exhaustivo** - Especialmente el micrófono en diferentes navegadores
5. **Validar con usuario** para feedback
6. **Deploy gradual** (opcional: feature flag)

## 🎤 Notas Importantes sobre el Micrófono

### Web Speech API Support:
- ✅ **Chrome/Edge:** Soporte completo
- ✅ **Safari:** Soporte desde iOS 14.5+ y macOS Big Sur+
- ❌ **Firefox:** No soportado nativamente

### Estados del Micrófono:
1. **Idle:** Gris, hover bg-gray-100
2. **Recording:** Rojo con pulse animation, ícono MicOff
3. **Disabled:** Durante loading

### Permisos:
- El navegador solicitará permiso la primera vez
- Mostrar mensaje de error si se deniega: "⚠️ Permiso de micrófono denegado..."
- Verificar compatibilidad del navegador

### Transcripción:
- Usar `continuous: true` para seguir escuchando
- `interimResults: true` para mostrar transcripción en tiempo real
- `lang: 'es-PE'` para español de Perú
- Agregar transcripción al textarea (no reemplazar, sino append)

---

## 📚 Referencias

- Diseño basado en: Chat educativo moderno (imagen proporcionada)
- Inspiración: ChatGPT, Claude.ai, interfaces de chat conversacionales
- Biblioteca UI: shadcn/ui (ya integrada)
- Tipografía: Inter (ya configurada)
