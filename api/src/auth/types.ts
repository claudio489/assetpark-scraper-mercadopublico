// ==========================================
// AUTH v5.2 - Tipos
// Capa de autenticacion NO invasiva
// ==========================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;   // bcryptjs hash
  name: string;
  role: 'admin' | 'client';
  allowedProfiles: string[];  // perfiles que puede ver
  active: boolean;
  createdAt: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  user?: JWTPayload;
  isAuthenticated: boolean;
}
