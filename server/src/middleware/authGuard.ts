import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../lib/auth.js';

type AuthedRequest = Request & { user?: JwtPayload };

function extractToken(req: Request): string | undefined {
    const h = req.header('Authorization');
    if (h?.startsWith('Bearer ')) return h.slice(7);
    const cookieToken = (req as any).cookies?.token;
    return cookieToken;
}

export function authGuard(req: AuthedRequest, res: Response, next: NextFunction) {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        req.user = verifyToken(token);
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

export function requireRole(role: 'ADMIN' | 'USER') {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}