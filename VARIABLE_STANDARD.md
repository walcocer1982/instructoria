# Estándar de Variables Genéricas - SOPHI

## 📋 Regla Principal

**TODAS las variables genéricas DEBEN estar en INGLÉS, pero el texto puede estar en español.**

## ✅ Variables Aprobadas (INGLÉS)

| Variable | Uso | Ejemplo |
|----------|-----|---------|
| `[MAIN_CONCEPT]` | Concepto principal de la lección | "Explica qué es [MAIN_CONCEPT]" |
| `[CONCEPT_A]`, `[CONCEPT_B]` | Conceptos secundarios o subtemas | "Compara [CONCEPT_A] con [CONCEPT_B]" |
| `[PROCESS]` | Procesos o procedimientos | "Describe el [PROCESS] paso a paso" |
| `[THEORY]` | Teorías o principios teóricos | "Analiza [THEORY] en profundidad" |
| `[PHENOMENON]` | Fenómenos observables | "¿Qué causa [PHENOMENON]?" |
| `[ELEMENT]` | Elementos o componentes | "Identifica [ELEMENT] en el sistema" |
| `[PRINCIPLE]` | Principios fundamentales | "Explica [PRINCIPLE] y sus aplicaciones" |
| `[METHOD]` | Métodos o técnicas | "Aplica [METHOD] para resolver" |
| `[COMPONENT]` | Partes o componentes | "¿Cómo funciona [COMPONENT]?" |

## ❌ Variables Prohibidas (ESPAÑOL)

| ❌ Incorrecto | ✅ Correcto |
|---------------|-------------|
| `[CONCEPTO_PRINCIPAL]` | `[MAIN_CONCEPT]` |
| `[CONCEPTO]` | `[CONCEPT_A]` o `[CONCEPT_B]` |
| `[PROCESO]` | `[PROCESS]` |
| `[TEORÍA]` | `[THEORY]` |
| `[FENÓMENO]` | `[PHENOMENON]` |
| `[ELEMENTO]` | `[ELEMENT]` |
| `[PRINCIPIO]` | `[PRINCIPLE]` |
| `[MÉTODO]` | `[METHOD]` |

## 📝 Ejemplos Correctos

```javascript
// ✅ CORRECTO: Texto en español, variables en inglés
"Explica cómo funciona [PROCESS] en relación con [MAIN_CONCEPT]"
"¿Qué relación existe entre [ELEMENT] y [COMPONENT]?"
"Describe las características de [MAIN_CONCEPT]"
"Analiza la importancia de [PRINCIPLE] para comprender [THEORY]"
```

## ❌ Ejemplos Incorrectos

```javascript
// ❌ Variables en español
"Explica cómo funciona [PROCESO] en relación con [CONCEPTO_PRINCIPAL]"
"¿Qué relación existe entre [ELEMENTO] y [COMPONENTE]?"

// ❌ Temas específicos
"Explica cómo funciona la fotosíntesis"
"¿Qué es el teorema de Pitágoras?"
```

## 🎯 Razón del Estándar

1. **Consistencia**: Variables en inglés son estándar en programación
2. **Internacional**: Facilita colaboración con desarrolladores de habla inglesa
3. **Profesional**: Mantiene el código limpio y profesional
4. **Claridad**: Separa claramente el contenido (español) de las variables (inglés)

## 💻 En el Código

### Comentarios y Texto
```typescript
// Los comentarios pueden estar en español para mejor comprensión
// Esto describe la función principal del agente

export const TUTOR_PROMPT = `
Genera una pregunta sobre [MAIN_CONCEPT].
El texto del prompt está en español, pero las variables en inglés.
`;
```

### Variables en TypeScript
```typescript
// ✅ Nombres de variables en código: inglés (convención estándar)
const mainConcept = "[MAIN_CONCEPT]";
const processDescription = "Explica el [PROCESS]";

// ✅ Comentarios: español (para tu comprensión)
// Esta variable almacena el concepto principal de la lección
```

## 🔍 Validación

Antes de enviar un prompt al LLM, verifica:

1. ✅ ¿Todas las variables están en INGLÉS y en MAYÚSCULAS?
2. ✅ ¿Ninguna variable usa palabras en español?
3. ✅ ¿El texto descriptivo está en español?
4. ✅ ¿No hay temas específicos mencionados?

## 📚 Recursos

- Ver: `lib/promptConstants.ts` → `SYSTEM_RULES_FOR_CLAUDE`
- Ver: `lib/promptConstants.ts` → `OUTPUT_EXAMPLES`