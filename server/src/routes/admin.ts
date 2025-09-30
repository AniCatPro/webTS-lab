import { Router } from 'express';
import { authGuard, requireRole } from '../middleware/authGuard.js';
import { prisma } from '../lib/prisma.js';

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Админ-панель (требует Bearer)
 */

/**
 * @swagger
 * /admin/revisions:
 *   get:
 *     tags: [Admin]
 *     summary: Последние текстовые правки
 *     description: "Требуется Bearer-токен (Authorization: Bearer XXX)."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Список правок
 *       401:
 *         description: Нет или неверный токен
 */

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
