import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export type JwtPayload = {
    id: string;
    email: string;
    role: 'USER' | 'ADMIN';
};

export function signToken(p: JwtPayload) {
    return jwt.sign(p, JWT_SECRET, { expiresIn: '2h' });
}

export function verifyToken(t: string) {
    return jwt.verify(t, JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(res: Response, token: string) {
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 2,
    });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie('token');
}

export function authGuard(
    req: Request & { user?: JwtPayload },
    res: Response,
    next: NextFunction
) {
    const header = req.header('Authorization');
    let token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) token = (req as any).cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        req.user = verifyToken(token);
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}