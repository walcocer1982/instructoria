/**
 * Sistema centralizado de debug logging
 *
 * Control mediante variable de entorno: NEXT_PUBLIC_DEBUG_LOGS
 *
 * Uso:
 * ```typescript
 * import { debugLog, debugError, debugGroup, debugGroupEnd } from '@/lib/debug-utils'
 *
 * debugLog('VERIFICATION', 'Analizando respuesta', { data })
 * debugError('API', 'Error en request', error)
 *
 * debugGroup('STREAM', '🔍 VERIFICACIÓN DE RESPUESTA')
 * debugLog('STREAM', 'Intent:', intent)
 * debugGroupEnd()
 * ```
 */

/**
 * Verifica si el modo debug está activado
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: usar variable de entorno
    return process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true' || process.env.NEXT_PUBLIC_DEBUG_LOGS === '1'
  }
  // Client-side: usar variable de entorno inyectada en build time
  return process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true' || process.env.NEXT_PUBLIC_DEBUG_LOGS === '1'
}

/**
 * Formatea el namespace con colores consistentes
 */
function formatNamespace(namespace: string): string {
  return `[${namespace}]`
}

/**
 * Log de debug estándar
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 *
 * @param namespace Categoría del log (ej: 'VERIFICATION', 'STREAM', 'API')
 * @param message Mensaje principal
 * @param data Datos opcionales a mostrar
 */
export function debugLog(namespace: string, message: string, data?: any): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)

  if (data !== undefined) {
    console.log(prefix, message, data)
  } else {
    console.log(prefix, message)
  }
}

/**
 * Log de error con formato consistente
 * Se imprime siempre (ignora flag de debug) porque es un error
 *
 * @param namespace Categoría del log
 * @param message Mensaje de error
 * @param error Error opcional a mostrar
 */
export function debugError(namespace: string, message: string, error?: any): void {
  const prefix = formatNamespace(namespace)

  if (error !== undefined) {
    console.error(prefix, '❌', message, error)
  } else {
    console.error(prefix, '❌', message)
  }
}

/**
 * Log de advertencia
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 *
 * @param namespace Categoría del log
 * @param message Mensaje de advertencia
 * @param data Datos opcionales
 */
export function debugWarn(namespace: string, message: string, data?: any): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)

  if (data !== undefined) {
    console.warn(prefix, '⚠️', message, data)
  } else {
    console.warn(prefix, '⚠️', message)
  }
}

/**
 * Inicia un grupo colapsable de logs
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 *
 * @param namespace Categoría del log
 * @param title Título del grupo
 */
export function debugGroup(namespace: string, title: string): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)
  console.group(`${prefix} ${title}`)
}

/**
 * Finaliza un grupo colapsable de logs
 */
export function debugGroupEnd(): void {
  if (!isDebugEnabled()) return

  console.groupEnd()
}

/**
 * Log de información con ícono
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 */
export function debugInfo(namespace: string, message: string, data?: any): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)

  if (data !== undefined) {
    console.log(prefix, 'ℹ️', message, data)
  } else {
    console.log(prefix, 'ℹ️', message)
  }
}

/**
 * Log de éxito con checkmark
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 */
export function debugSuccess(namespace: string, message: string, data?: any): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)

  if (data !== undefined) {
    console.log(prefix, '✅', message, data)
  } else {
    console.log(prefix, '✅', message)
  }
}

/**
 * Separador visual para logs
 * Solo se imprime si NEXT_PUBLIC_DEBUG_LOGS está activado
 */
export function debugSeparator(namespace: string): void {
  if (!isDebugEnabled()) return

  const prefix = formatNamespace(namespace)
  console.log(prefix, '==========================================')
}
