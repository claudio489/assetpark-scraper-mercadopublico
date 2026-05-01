import { ClientProfile } from '../types';
/**
 * Perfiles predefinidos para distintos rubros
 * Permite reutilizar el engine para múltiples clientes
 */
declare const DEFAULT_PROFILES: Record<string, ClientProfile>;
export declare function getProfile(id: string): ClientProfile | undefined;
export declare function saveProfile(profile: ClientProfile): ClientProfile;
export declare function deleteProfile(id: string): boolean;
export declare function listProfiles(): ClientProfile[];
export declare function createProfileFromTemplate(templateId: string, overrides: Partial<ClientProfile> & {
    id: string;
    name: string;
}): ClientProfile;
export { DEFAULT_PROFILES };
