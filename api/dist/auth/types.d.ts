export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'admin' | 'client';
    allowedProfiles: string[];
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
