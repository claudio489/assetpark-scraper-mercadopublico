// ==========================================
// AUTH v5.2 - Middleware (NO invasivo)
// Si no hay token: todo pasa igual (backward compatible)
// Si hay token: valida y adjunta req.auth
// ==========================================
import { Request, Response, NextFunction } from 'express';
import { decodeToken } from './jwt';
import { findUserById } from './store';
import { JWTPayload } from './types';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: string;
        payload: JWTPayload;
        allowedProfiles: string[];
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    // Sin token = publico, todo pasa (backward compatible)
    return next();
  }

  const payload = decodeToken(token);
  if (!payload) {
    // Token invalido o expirado
    return next(); // NO bloquear, actuar como publico (no romper frontend sin login)
  }

  const user = findUserById(payload.userId);
  if (!user || !user.active) {
    return next(); // Usuario no existe o inactivo
  }

  req.auth = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    payload,
    allowedProfiles: user.allowedProfiles
  };

  next();
}

// Middleware estricto: requiere token valido
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Requiere autenticacion' });
    return;
  }

  const payload = decodeToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalido o expirado' });
    return;
  }

  const user = findUserById(payload.userId);
  if (!user || !user.active) {
    res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    return;
  }

  req.auth = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    payload,
    allowedProfiles: user.allowedProfiles
  };

  next();
}

// Verificar si un perfil esta permitido para el usuario actual
export function isProfileAllowed(req: Request, profileId: string): boolean {
  if (!req.auth) return true; // publico = todo permitido
  if (req.auth.role === 'admin') return true; // admin = todo
  const pid = profileId.toLowerCase();
  return req.auth.allowedProfiles.includes(pid);
}
