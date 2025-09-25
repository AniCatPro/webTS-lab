// server/src/routes/admin.ts
import { Router } from 'express';
import { authGuard, requireRole } from '../middleware/authGuard.js';
import { prisma } from '../lib/prisma.js';

export const adminRouter = Router();

adminRouter.use(authGuard, requireRole('ADMIN'));

adminRouter.get('/revisions', async (_req, res) => {
    const list = await prisma.textRevision.findMany({
        include: { file: true, author: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });
    res.json(list);
});
