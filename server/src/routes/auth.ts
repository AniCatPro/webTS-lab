import { Router } from 'express';
import { loginDto } from '../dto/auth';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { signToken, setAuthCookie, clearAuthCookie, verifyToken } from '../lib/auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
    const data = loginDto.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.json({ ok: true });
});

authRouter.get('/me', async (req, res) => {
    const token = (req as any).cookies?.token;
    if (!token) return res.json(null);
    try {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true }
        });
        res.json(user);
    } catch {
        res.json(null);
    }
});

authRouter.post('/logout', (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
});
