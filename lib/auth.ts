/**
 * Módulo de Autenticación
 * Sistema SOPHI - Fase 1
 */

import { User, UserRole } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'sessions.json');

/**
 * Session activa
 */
export interface Session {
  token: string;
  userId: string;
  email: string;
  rol: UserRole;
  createdAt: string;
  expiresAt: string;
}

/**
 * Hash simple para passwords (MVP)
 * TODO: Usar bcrypt en producción
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Genera un token único
 */
function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Lee todos los usuarios
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const files = await fs.readdir(USERS_DIR);
    const users: User[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(USERS_DIR, file), 'utf-8');
        users.push(JSON.parse(content));
      }
    }

    return users;
  } catch (error) {
    return [];
  }
}

/**
 * Busca un usuario por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Busca un usuario por ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const filePath = path.join(USERS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(data: {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
}): Promise<User> {
  // Verificar que el email no exista
  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  // Crear usuario
  const user: User = {
    id: crypto.randomUUID(),
    nombre: data.nombre,
    email: data.email.toLowerCase(),
    password: hashPassword(data.password),
    rol: data.rol,
    created_at: new Date().toISOString(),
  };

  // Guardar en archivo
  const filePath = path.join(USERS_DIR, `${user.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(user, null, 2));

  return user;
}

/**
 * Verifica credenciales y retorna usuario
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const hashedPassword = hashPassword(password);

  if (user.password !== hashedPassword) {
    return null;
  }

  return user;
}

/**
 * Lee todas las sesiones activas
 */
async function getAllSessions(): Promise<Session[]> {
  try {
    const content = await fs.readFile(SESSIONS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

/**
 * Guarda sesiones
 */
async function saveSessions(sessions: Session[]): Promise<void> {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

/**
 * Crea una nueva sesión
 */
export async function createSession(user: User): Promise<Session> {
  const token = generateToken();
  const now = Date.now();
  const expiresIn = 24 * 60 * 60 * 1000; // 24 horas

  const session: Session = {
    token,
    userId: user.id,
    email: user.email,
    rol: user.rol,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + expiresIn).toISOString(),
  };

  // Agregar a sesiones activas
  const sessions = await getAllSessions();
  sessions.push(session);
  await saveSessions(sessions);

  return session;
}

/**
 * Valida un token y retorna la sesión
 */
export async function validateToken(token: string): Promise<Session | null> {
  const sessions = await getAllSessions();
  const session = sessions.find(s => s.token === token);

  if (!session) {
    return null;
  }

  // Verificar expiración
  if (new Date(session.expiresAt) < new Date()) {
    // Sesión expirada, eliminarla
    await deleteSession(token);
    return null;
  }

  return session;
}

/**
 * Elimina una sesión (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.token !== token);
  await saveSessions(filtered);
}

/**
 * Limpia sesiones expiradas
 */
export async function cleanExpiredSessions(): Promise<void> {
  const sessions = await getAllSessions();
  const now = new Date();
  const active = sessions.filter(s => new Date(s.expiresAt) > now);
  await saveSessions(active);
}