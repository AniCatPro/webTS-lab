import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signToken, setAuthCookie, verifyToken } from '../lib/auth.js';
import { authGuard } from '../middleware/authGuard.js';

export const authRouter = Router();

// схема валидации тела логина
const loginDto = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'String must contain at least 6 character(s)'),
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res) => {
    // безопасная валидация без throw
    const parsed = loginDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Validation error',
            issues: parsed.error.issues,
        });
    }
    const { email, password } = parsed.data;

    // ищем пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    // не раскрываем, существует ли пользователь
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // выдаём JWT и кладём в cookie
    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.json({ ok: true });
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (_req, res) => {
    // Чистим cookie токена
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // выставь true в проде за HTTPS
        path: '/',
    });
    res.json({ ok: true });
});

/**
 * GET /api/auth/me
 * Возвращает данные текущего пользователя по cookie/JWT
 */
authRouter.get('/me', async (req, res) => {
    try {
        const token =
            req.cookies?.token ||
            (req.header('Authorization')?.startsWith('Bearer ')
                ? req.header('Authorization')!.slice(7)
                : undefined);

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true },
        });

        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        res.json(user);
    } catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

/**
 * Пример защищённого пинга (опционально)
 */
authRouter.get('/ping', authGuard, (_req, res) => {
    res.json({ ok: true });
});