// ==========================================
// AUTH v5.2 - JWT Helper
// jwt-simple (sin dependencias pesadas)
// ==========================================
import jwt from 'jwt-simple';
import { JWTPayload } from './types';

const SECRET = process.env.JWT_SECRET || 'assetpark-jwt-secret-2024-change-in-production';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export function encodeToken(userId: string, email: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    userId,
    email,
    role,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS
  };
  return jwt.encode(payload, SECRET);
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.decode(token, SECRET) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null; // expirado
    return payload;
  } catch {
    return null;
  }
}
