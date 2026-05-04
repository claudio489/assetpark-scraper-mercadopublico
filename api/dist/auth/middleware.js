"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
exports.isProfileAllowed = isProfileAllowed;
const jwt_1 = require("./jwt");
const store_1 = require("./store");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        // Sin token = publico, todo pasa (backward compatible)
        return next();
    }
    const payload = (0, jwt_1.decodeToken)(token);
    if (!payload) {
        // Token invalido o expirado
        return next(); // NO bloquear, actuar como publico (no romper frontend sin login)
    }
    const user = (0, store_1.findUserById)(payload.userId);
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
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        res.status(401).json({ error: 'Requiere autenticacion' });
        return;
    }
    const payload = (0, jwt_1.decodeToken)(token);
    if (!payload) {
        res.status(401).json({ error: 'Token invalido o expirado' });
        return;
    }
    const user = (0, store_1.findUserById)(payload.userId);
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
function isProfileAllowed(req, profileId) {
    if (!req.auth)
        return true; // publico = todo permitido
    if (req.auth.role === 'admin')
        return true; // admin = todo
    const pid = profileId.toLowerCase();
    return req.auth.allowedProfiles.includes(pid);
}
