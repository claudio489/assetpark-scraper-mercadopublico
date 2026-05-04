import { JWTPayload } from './types';
export declare function encodeToken(userId: string, email: string, role: string): string;
export declare function decodeToken(token: string): JWTPayload | null;
