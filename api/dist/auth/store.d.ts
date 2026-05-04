import { User } from './types';
export declare function findUserByEmail(email: string): User | null;
export declare function findUserById(id: string): User | null;
export declare function verifyPassword(plain: string, hash: string): boolean;
export declare function hashPassword(plain: string): string;
export declare function createUser(email: string, password: string, name: string, role: 'admin' | 'client', allowedProfiles: string[]): User;
export declare function updateUserAllowedProfiles(userId: string, profiles: string[]): boolean;
export declare function seedUsersIfEmpty(): void;
export declare function listUsers(): User[];
