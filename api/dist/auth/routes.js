"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ==========================================
// AUTH v5.2 - Endpoints
// Login / Me / Admin register
// ==========================================
const express_1 = require("express");
const store_1 = require("./store");
const jwt_1 = require("./jwt");
const middleware_1 = require("./middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email y password requeridos' });
        return;
    }
    const user = (0, store_1.findUserByEmail)(email);
    if (!user || !user.active) {
        res.status(401).json({ success: false, error: 'Credenciales invalidas' });
        return;
    }
    const valid = (0, store_1.verifyPassword)(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ success: false, error: 'Credenciales invalidas' });
        return;
    }
    const token = (0, jwt_1.encodeToken)(user.id, user.email, user.role);
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            allowedProfiles: user.allowedProfiles
        }
    });
});
// GET /api/auth/me
router.get('/me', (req, res) => {
    if (!req.auth) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
    }
    const user = (0, store_1.findUserByEmail)(req.auth.email);
    if (!user) {
        res.status(401).json({ success: false, error: 'Usuario no encontrado' });
        return;
    }
    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            allowedProfiles: user.allowedProfiles
        }
    });
});
// POST /api/auth/register — solo admin
router.post('/register', middleware_1.requireAuth, (req, res) => {
    if (req.auth?.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Solo admin puede registrar usuarios' });
        return;
    }
    const { email, password, name, role = 'client', allowedProfiles = [] } = req.body || {};
    if (!email || !password || !name) {
        res.status(400).json({ success: false, error: 'Email, password y name requeridos' });
        return;
    }
    const existing = (0, store_1.findUserByEmail)(email);
    if (existing) {
        res.status(409).json({ success: false, error: 'Email ya registrado' });
        return;
    }
    const user = (0, store_1.createUser)(email, password, name, role, allowedProfiles);
    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            allowedProfiles: user.allowedProfiles
        }
    });
});
// GET /api/auth/users — lista usuarios, solo admin
router.get('/users', middleware_1.requireAuth, (req, res) => {
    if (req.auth?.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Solo admin' });
        return;
    }
    const users = (0, store_1.listUsers)().map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        allowedProfiles: u.allowedProfiles,
        active: u.active,
        createdAt: u.createdAt
    }));
    res.json({ success: true, count: users.length, users });
});
// PUT /api/auth/users/:id/profiles — cambiar perfiles permitidos, solo admin
router.put('/users/:id/profiles', middleware_1.requireAuth, (req, res) => {
    if (req.auth?.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Solo admin' });
        return;
    }
    const { allowedProfiles } = req.body || {};
    if (!Array.isArray(allowedProfiles)) {
        res.status(400).json({ success: false, error: 'allowedProfiles debe ser array' });
        return;
    }
    const ok = (0, store_1.updateUserAllowedProfiles)(req.params.id, allowedProfiles);
    if (!ok) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
    }
    res.json({ success: true, message: 'Perfiles actualizados' });
});
exports.default = router;
