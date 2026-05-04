// ==========================================
// AUTH v5.2 - Endpoints
// Login / Me / Admin register
// ==========================================
import { Router, Request, Response } from 'express';
import { findUserByEmail, verifyPassword, createUser, listUsers, updateUserAllowedProfiles } from './store';
import { encodeToken } from './jwt';
import { requireAuth } from './middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email y password requeridos' });
    return;
  }

  const user = findUserByEmail(email);
  if (!user || !user.active) {
    res.status(401).json({ success: false, error: 'Credenciales invalidas' });
    return;
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Credenciales invalidas' });
    return;
  }

  const token = encodeToken(user.id, user.email, user.role);
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
router.get('/me', (req: Request, res: Response) => {
  if (!req.auth) {
    res.status(401).json({ success: false, error: 'No autenticado' });
    return;
  }
  const user = findUserByEmail(req.auth.email);
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
router.post('/register', requireAuth, (req: Request, res: Response) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Solo admin puede registrar usuarios' });
    return;
  }

  const { email, password, name, role = 'client', allowedProfiles = [] } = req.body || {};
  if (!email || !password || !name) {
    res.status(400).json({ success: false, error: 'Email, password y name requeridos' });
    return;
  }

  const existing = findUserByEmail(email);
  if (existing) {
    res.status(409).json({ success: false, error: 'Email ya registrado' });
    return;
  }

  const user = createUser(email, password, name, role as 'admin' | 'client', allowedProfiles);
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
router.get('/users', requireAuth, (req: Request, res: Response) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Solo admin' });
    return;
  }
  const users = listUsers().map(u => ({
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
router.put('/users/:id/profiles', requireAuth, (req: Request, res: Response) => {
  if (req.auth?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Solo admin' });
    return;
  }
  const { allowedProfiles } = req.body || {};
  if (!Array.isArray(allowedProfiles)) {
    res.status(400).json({ success: false, error: 'allowedProfiles debe ser array' });
    return;
  }
  const ok = updateUserAllowedProfiles(req.params.id, allowedProfiles);
  if (!ok) {
    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return;
  }
  res.json({ success: true, message: 'Perfiles actualizados' });
});

export default router;
