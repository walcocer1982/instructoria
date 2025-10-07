/**
 * API de Upload de Imágenes
 * Convierte imágenes a base64 data URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateToken } from '@/lib/auth';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * POST /api/upload
 * Sube una o más imágenes
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 });
    }

    const session = await validateToken(token);

    if (!session || session.rol !== 'profesor') {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 403 });
    }

    // Parsear form data
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se enviaron archivos',
      }, { status: 400 });
    }

    const uploadedFiles: Array<{
      filename: string;
      url: string;
      size: number;
    }> = [];

    // Procesar cada archivo
    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Generar nombre único
      const ext = file.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);

      // Convertir a buffer y guardar
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await fs.writeFile(filepath, buffer);

      // URL pública
      const url = `/uploads/${filename}`;

      uploadedFiles.push({
        filename,
        url,
        size: buffer.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} archivo(s) subido(s) exitosamente`,
      files: uploadedFiles,
    });

  } catch (error: any) {
    console.error('Error en POST /api/upload:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Error al subir archivos',
    }, { status: 500 });
  }
}