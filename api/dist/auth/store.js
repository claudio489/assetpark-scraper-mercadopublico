"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.verifyPassword = verifyPassword;
exports.hashPassword = hashPassword;
exports.createUser = createUser;
exports.updateUserAllowedProfiles = updateUserAllowedProfiles;
exports.seedUsersIfEmpty = seedUsersIfEmpty;
exports.listUsers = listUsers;
// ==========================================
// AUTH v5.2 - Store (persistencia en disco)
// data/users.json — mismo patron que historial.json
// ==========================================
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DATA_DIR = path_1.default.join(process.cwd(), 'data');
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
if (!fs_1.default.existsSync(DATA_DIR))
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
let usersCache = null;
function loadUsers() {
    if (usersCache)
        return usersCache;
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            const raw = fs_1.default.readFileSync(USERS_FILE, 'utf-8');
            usersCache = JSON.parse(raw);
            return usersCache;
        }
    }
    catch (e) {
        console.log('[AUTH] Error cargando users:', e.message);
    }
    usersCache = {};
    return usersCache;
}
function saveUsers(users) {
    try {
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
        usersCache = users;
    }
    catch (e) {
        console.log('[AUTH] Error guardando users:', e.message);
    }
}
function findUserByEmail(email) {
    const users = loadUsers();
    const emailLower = email.toLowerCase();
    for (const k of Object.keys(users)) {
        if (users[k].email.toLowerCase() === emailLower)
            return users[k];
    }
    return null;
}
function findUserById(id) {
    return loadUsers()[id] || null;
}
function verifyPassword(plain, hash) {
    return bcryptjs_1.default.compareSync(plain, hash);
}
function hashPassword(plain) {
    return bcryptjs_1.default.hashSync(plain, 10);
}
function createUser(email, password, name, role, allowedProfiles) {
    const users = loadUsers();
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = {
        id,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        name: name.trim(),
        role,
        allowedProfiles: allowedProfiles.map(p => p.toLowerCase().trim()),
        active: true,
        createdAt: new Date().toISOString()
    };
    users[id] = user;
    saveUsers(users);
    return user;
}
function updateUserAllowedProfiles(userId, profiles) {
    const users = loadUsers();
    const user = users[userId];
    if (!user)
        return false;
    user.allowedProfiles = profiles.map(p => p.toLowerCase().trim());
    saveUsers(users);
    return true;
}
function seedUsersIfEmpty() {
    const users = loadUsers();
    const keys = Object.keys(users);
    if (keys.length > 0)
        return; // ya hay usuarios
    console.log('[AUTH] Seeding usuarios por defecto...');
    // Admin
    createUser('admin@assetpark.cl', 'admin2024', 'AssetPark Admin', 'admin', ['constructora', 'tecnologia', 'salud', 'imprenta', 'hormigon', 'general', 'buceo']);
    // D&G Constructora — solo acceso a perfil constructora (genérico)
    createUser('dyg@dygconstructora.cl', 'dyg2024', 'D&G Constructora SPA', 'client', ['constructora']);
    // Demo cliente multiperfil
    createUser('demo@demo.cl', 'demo2024', 'Demo Usuario', 'client', ['constructora', 'hormigon']);
    console.log('[AUTH] Seed OK — 3 usuarios creados');
}
function listUsers() {
    return Object.values(loadUsers());
}
