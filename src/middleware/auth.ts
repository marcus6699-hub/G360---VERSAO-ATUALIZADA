import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuth } from '../lib/firebase-admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../db.json');

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

function getLocalUser(uid: string) {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return (data.users || []).find((u: any) => u.id === uid);
    }
  } catch {}
  return null;
}

const ADMIN_EMAILS = new Set([
  'admin@siteexpress.pro',
  'marcus6699@gmail.com',
]);

/**
 * Validates authentication via Firebase Bearer ID Token or valid session cookie.
 * Fails closed with HTTP 401 if unauthenticated.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // If user is already attached by previous middleware or mock, proceed
  if (req.user && req.user.uid) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // 1. Try Firebase Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const email = decodedToken.email?.toLowerCase();
        const isAdmin =
          decodedToken.admin === true ||
          decodedToken.role === 'admin' ||
          (email ? ADMIN_EMAILS.has(email) : false);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          role: isAdmin ? 'admin' : 'user',
        };
        return next();
      } catch (error) {
        console.warn('[Auth] Invalid or expired Firebase ID token');
        return res.status(401).json({ error: 'Unauthorized: Token de autenticação inválido ou expirado.' });
      }
    }
  }

  // 2. Try Local Session Cookie (sxp_uid)
  const cookieUid = req.cookies?.sxp_uid;
  if (cookieUid && cookieUid !== 'logged_out') {
    const localUser = getLocalUser(cookieUid);
    if (localUser) {
      const email = localUser.email?.toLowerCase();
      const isAdmin = localUser.role === 'admin' || (email ? ADMIN_EMAILS.has(email) : false);

      req.user = {
        uid: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: isAdmin ? 'admin' : 'user',
      };
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Autenticação necessária para acessar este recurso.' });
};

/**
 * Strict RBAC: Requires authenticated user with validated role === 'admin'.
 * Fails closed: 401 if unauthenticated, 403 if authenticated but not admin.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Acesso restrito exclusivamente a administradores do sistema.',
      });
    }
    next();
  });
};
