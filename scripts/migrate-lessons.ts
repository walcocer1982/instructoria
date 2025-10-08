/**
 * Script para migrar lecciones de JSON a PostgreSQL con Prisma
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrateLessons() {
  try {
    console.log('🚀 Iniciando migración de lecciones...\n');

    const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
    const files = await fs.readdir(lessonsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`📚 Encontradas ${jsonFiles.length} lecciones en JSON\n`);

    // Buscar un usuario TEACHER para asignar como creador
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });

    if (!teacher) {
      console.log('⚠️  No hay usuarios con rol TEACHER, creando uno...');
      // El usuario ya existe con el email walcocer.1982@gmail.com
      const existingUser = await prisma.user.findUnique({
        where: { email: 'walcocer.1982@gmail.com' }
      });

      if (!existingUser) {
        throw new Error('No se encontró el usuario walcocer.1982@gmail.com');
      }

      // Actualizar rol a TEACHER
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'TEACHER' }
      });

      console.log('✅ Usuario actualizado a TEACHER\n');
    }

    const teacherUser = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });

    if (!teacherUser) {
      throw new Error('No se pudo obtener usuario TEACHER');
    }

    for (const file of jsonFiles) {
      const filePath = path.join(lessonsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lessonData = JSON.parse(content);

      console.log(`📖 Migrando: ${lessonData.titulo || file}`);

      // Verificar si ya existe
      const existing = await prisma.lesson.findUnique({
        where: { id: lessonData.id }
      });

      if (existing) {
        console.log(`   ⏭️  Ya existe, saltando...`);
        continue;
      }

      // Crear lección
      await prisma.lesson.create({
        data: {
          id: lessonData.id,
          titulo: lessonData.titulo,
          objetivo: lessonData.objetivo,
          duracion_estimada: lessonData.duracion_min || lessonData.duracion_minutos || 30,
          criterios_evaluacion: lessonData.criterios_evaluacion || [],
          momentos: lessonData.momentos || [],
          imagenes: lessonData.imagenes || [],
          publicada: lessonData.publicada !== false, // Default true
          createdById: teacherUser.id,
        }
      });

      console.log(`   ✅ Migrada exitosamente`);
    }

    console.log('\n✨ Migración completada!');

    // Mostrar resumen
    const totalLessons = await prisma.lesson.count();
    console.log(`\n📊 Total de lecciones en BD: ${totalLessons}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLessons();
