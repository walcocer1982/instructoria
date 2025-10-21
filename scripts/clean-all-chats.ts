/**
 * Script para LIMPIAR TODOS LOS CHATS Y SESIONES
 *
 * Elimina:
 * - Todos los mensajes (Message)
 * - Todas las sesiones de aprendizaje (LearningSession)
 * - Todo el progreso de actividades (ActivityProgress)
 * - Todos los incidentes de seguridad (SecurityIncident)
 * - Todos los enrollments (TopicEnrollment, CourseEnrollment)
 *
 * MANTIENE:
 * - Usuarios
 * - Carreras
 * - Cursos
 * - Temas
 * - Instructores
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanAllChats() {
  console.log('🧹 Iniciando limpieza de TODOS los chats...\n')

  try {
    // 1. Eliminar SecurityIncident (depende de LearningSession)
    console.log('1️⃣ Eliminando incidentes de seguridad...')
    const deletedIncidents = await prisma.securityIncident.deleteMany({})
    console.log(`   ✅ ${deletedIncidents.count} incidentes eliminados\n`)

    // 2. Eliminar Message (depende de LearningSession)
    console.log('2️⃣ Eliminando mensajes...')
    const deletedMessages = await prisma.message.deleteMany({})
    console.log(`   ✅ ${deletedMessages.count} mensajes eliminados\n`)

    // 3. Eliminar LearningSession (depende de TopicEnrollment)
    console.log('3️⃣ Eliminando sesiones de aprendizaje...')
    const deletedSessions = await prisma.learningSession.deleteMany({})
    console.log(`   ✅ ${deletedSessions.count} sesiones eliminadas\n`)

    // 4. Eliminar ActivityProgress (depende de TopicEnrollment)
    console.log('4️⃣ Eliminando progreso de actividades...')
    const deletedProgress = await prisma.activityProgress.deleteMany({})
    console.log(`   ✅ ${deletedProgress.count} registros de progreso eliminados\n`)

    // 5. Eliminar TopicEnrollment (depende de CourseEnrollment)
    console.log('5️⃣ Eliminando enrollments de temas...')
    const deletedTopicEnrollments = await prisma.topicEnrollment.deleteMany({})
    console.log(`   ✅ ${deletedTopicEnrollments.count} topic enrollments eliminados\n`)

    // 6. Eliminar CourseEnrollment
    console.log('6️⃣ Eliminando enrollments de cursos...')
    const deletedCourseEnrollments = await prisma.courseEnrollment.deleteMany({})
    console.log(`   ✅ ${deletedCourseEnrollments.count} course enrollments eliminados\n`)

    console.log('✅ ¡LIMPIEZA COMPLETADA!\n')
    console.log('📊 Resumen:')
    console.log(`   - Incidentes: ${deletedIncidents.count}`)
    console.log(`   - Mensajes: ${deletedMessages.count}`)
    console.log(`   - Sesiones: ${deletedSessions.count}`)
    console.log(`   - Progreso: ${deletedProgress.count}`)
    console.log(`   - Topic Enrollments: ${deletedTopicEnrollments.count}`)
    console.log(`   - Course Enrollments: ${deletedCourseEnrollments.count}`)
    console.log('\n🎯 Base de datos limpia. Puedes empezar de nuevo.\n')
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanAllChats()
  .then(() => {
    console.log('✅ Script finalizado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
