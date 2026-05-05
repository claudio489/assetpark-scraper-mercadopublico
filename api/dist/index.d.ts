declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                profile: string;
                name: string;
            };
        }
    }
}
export {};
