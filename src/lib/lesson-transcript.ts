/**
 * Sistema de Transcript de Conversaciones
 *
 * Genera archivos .md con el log completo de conversaciones para debugging
 * Solo funciona en development y controlado por WRITE_LESSON_TXT
 */

import fs from 'fs/promises'
import path from 'path'

interface SessionMetadata {
  userName: string
  email: string
  topicTitle: string
  instructorName: string
}

/**
 * Verifica si el sistema de transcripts está habilitado
 * Requiere: WRITE_LESSON_TXT=1 y NODE_ENV !== production
 */
export function isTranscriptEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV
  const writeLesson = process.env.WRITE_LESSON_TXT

  console.log('[Transcript] Verificando habilitación:', {
    NODE_ENV: nodeEnv,
    WRITE_LESSON_TXT: writeLesson,
    isProduction: nodeEnv === 'production',
    isEnabled: writeLesson === '1' || writeLesson === 'true'
  })

  // Doble seguridad: nunca en producción
  if (nodeEnv === 'production') {
    return false
  }

  return writeLesson === '1' || writeLesson === 'true'
}

/**
 * Asegura que la carpeta /tmp exista
 */
async function ensureTmpDir(): Promise<void> {
  const tmpDir = path.join(process.cwd(), 'tmp')
  console.log('[Transcript] Verificando carpeta tmp:', tmpDir)

  try {
    await fs.access(tmpDir)
    console.log('[Transcript] Carpeta tmp ya existe')
  } catch {
    // Carpeta no existe, crearla
    console.log('[Transcript] Creando carpeta tmp...')
    await fs.mkdir(tmpDir, { recursive: true })
    console.log('[Transcript] ✅ Carpeta tmp creada exitosamente')
  }
}

/**
 * Obtiene la ruta del archivo de transcript para una sesión
 */
function getTranscriptPath(sessionId: string): string {
  return path.join(process.cwd(), 'tmp', `LESSON_${sessionId}.md`)
}

/**
 * Formatea una fecha en formato YYYY-MM-DD HH:mm
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Formatea una hora en formato HH:mm
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Inicializa el archivo de transcript con metadata de la sesión
 */
export async function initTranscript(
  sessionId: string,
  metadata: SessionMetadata
): Promise<void> {
  console.log('[Transcript] initTranscript llamado para sesión:', sessionId)

  if (!isTranscriptEnabled()) {
    console.log('[Transcript] Sistema deshabilitado, saliendo')
    return
  }

  try {
    await ensureTmpDir()

    const transcriptPath = getTranscriptPath(sessionId)
    console.log('[Transcript] Ruta del archivo:', transcriptPath)

    // Verificar si ya existe (evitar sobrescribir)
    try {
      await fs.access(transcriptPath)
      console.log('[Transcript] Archivo ya existe, no sobrescribir')
      return
    } catch {
      console.log('[Transcript] Archivo no existe, creando nuevo...')
    }

    const now = new Date()
    const header = `# Sesión: ${sessionId}
Estudiante: ${metadata.userName} (${metadata.email})
Tema: ${metadata.topicTitle}
Instructor: ${metadata.instructorName}
Fecha: ${formatDateTime(now)}
---

`

    await fs.writeFile(transcriptPath, header, 'utf-8')
    console.log('[Transcript] ✅ Archivo creado exitosamente:', transcriptPath)
  } catch (error) {
    // Fallo silencioso - no afectar el flujo principal
    console.error('[Transcript] ❌ Error al inicializar:', error)
  }
}

/**
 * Agrega un mensaje al transcript
 */
export async function appendMessage(
  sessionId: string,
  role: 'LLM' | 'USER',
  content: string,
  timestamp: Date
): Promise<void> {
  if (!isTranscriptEnabled()) return

  try {
    const transcriptPath = getTranscriptPath(sessionId)

    const messageBlock = `**${role}:**
${content}
> ${formatTime(timestamp)}
---
`

    await fs.appendFile(transcriptPath, messageBlock, 'utf-8')
    console.log(`[Transcript] ✅ Mensaje ${role} agregado`)
  } catch (error) {
    // Fallo silencioso - no afectar el flujo principal
    console.error('[Transcript] ❌ Error al agregar mensaje:', error)
  }
}
