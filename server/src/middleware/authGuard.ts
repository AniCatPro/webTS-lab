// server/src/middleware/authGuard.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Расширяем тип (для TS, на рантайме не влияет)
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email: string; role: 'ADMIN' | 'USER' };
        }
    }
}

/**
 * Достаём JWT из cookie 'token' или из Authorization: Bearer xxx
 */
function getToken(req: Request): string | null {
    const fromCookie = req.cookies?.token;
    if (fromCookie) return fromCookie as string;

    const h = req.headers['authorization'];
    if (typeof h === 'string' && h.toLowerCase().startsWith('bearer ')) {
        return h.slice(7).trim();
    }
    return null;
}

/**
 * Обязательная авторизация: вешает req.user.
 */
export async function authGuard(req: Request, res: Response, next: NextFunction) {
    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const userId = payload?.sub as string | undefined;
        if (!userId) return res.status(401).json({ message: 'Invalid token payload' });

        // Берём пользователя из БД, чтобы роль/почта были актуальны
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });
        if (!user) return res.status(401).json({ message: 'User not found' });

        req.user = { id: user.id, email: user.email, role: user.role as 'ADMIN' | 'USER' };
        next();
    } catch (e) {
        console.error('authGuard error', e);
        return res.status(500).json({ message: 'Auth error' });
    }
}

/**
 * Дополнительный гард по роли (например, для /api/admin/*)
 */
export function requireRole(role: 'ADMIN' | 'USER') {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
}