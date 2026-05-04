// ==========================================
// AUTH v5.2 - Store (persistencia en disco)
// data/users.json — mismo patron que historial.json
// ==========================================
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let usersCache: Record<string, User> | null = null;

function loadUsers(): Record<string, User> {
  if (usersCache) return usersCache;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      usersCache = JSON.parse(raw);
      return usersCache!;
    }
  } catch (e) {
    console.log('[AUTH] Error cargando users:', (e as Error).message);
  }
  usersCache = {};
  return usersCache;
}

function saveUsers(users: Record<string, User>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    usersCache = users;
  } catch (e) {
    console.log('[AUTH] Error guardando users:', (e as Error).message);
  }
}

export function findUserByEmail(email: string): User | null {
  const users = loadUsers();
  const emailLower = email.toLowerCase();
  for (const k of Object.keys(users)) {
    if (users[k].email.toLowerCase() === emailLower) return users[k];
  }
  return null;
}

export function findUserById(id: string): User | null {
  return loadUsers()[id] || null;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function createUser(email: string, password: string, name: string, role: 'admin' | 'client', allowedProfiles: string[]): User {
  const users = loadUsers();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const user: User = {
    id,
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    name: name.trim(),
    role,
    allowedProfiles: allowedProfiles.map(p => p.toLowerCase().trim()),
    active: true,
    createdAt: new Date().toISOString()
  };
  users[id] = user;
  saveUsers(users);
  return user;
}

export function updateUserAllowedProfiles(userId: string, profiles: string[]): boolean {
  const users = loadUsers();
  const user = users[userId];
  if (!user) return false;
  user.allowedProfiles = profiles.map(p => p.toLowerCase().trim());
  saveUsers(users);
  return true;
}

export function seedUsersIfEmpty() {
  const users = loadUsers();
  const keys = Object.keys(users);
  if (keys.length > 0) return; // ya hay usuarios

  console.log('[AUTH] Seeding usuarios por defecto...');

  // Admin
  createUser('admin@assetpark.cl', 'admin2024', 'AssetPark Admin', 'admin', ['constructora', 'tecnologia', 'salud', 'imprenta', 'hormigon', 'general', 'buceo']);

  // D&G Constructora — solo acceso a perfil dyg-constructora
  createUser('dyg@dygconstructora.cl', 'dyg2024', 'D&G Constructora SPA', 'client', ['dyg-constructora']);

  // Demo cliente multiperfil
  createUser('demo@demo.cl', 'demo2024', 'Demo Usuario', 'client', ['constructora', 'hormigon']);

  console.log('[AUTH] Seed OK — 3 usuarios creados');
}

export function listUsers(): User[] {
  return Object.values(loadUsers());
}
