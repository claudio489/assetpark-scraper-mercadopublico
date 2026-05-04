import { Request, Response, NextFunction } from 'express';
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
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function isProfileAllowed(req: Request, profileId: string): boolean;
