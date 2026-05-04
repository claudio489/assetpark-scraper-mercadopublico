"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeToken = encodeToken;
exports.decodeToken = decodeToken;
// ==========================================
// AUTH v5.2 - JWT Helper
// jwt-simple (sin dependencias pesadas)
// ==========================================
const jwt_simple_1 = __importDefault(require("jwt-simple"));
const SECRET = process.env.JWT_SECRET || 'assetpark-jwt-secret-2024-change-in-production';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias
function encodeToken(userId, email, role) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        userId,
        email,
        role,
        iat: now,
        exp: now + TOKEN_EXPIRY_SECONDS
    };
    return jwt_simple_1.default.encode(payload, SECRET);
}
function decodeToken(token) {
    try {
        const payload = jwt_simple_1.default.decode(token, SECRET);
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now)
            return null; // expirado
        return payload;
    }
    catch {
        return null;
    }
}
