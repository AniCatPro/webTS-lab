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

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: Аудит-лог
 *     description: "Получение записей аудит-лога с фильтрацией по типам и пагинацией. Требуется Bearer-токен."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Список типов событий через запятую (например, file.create,file.delete)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество записей на странице (максимум 200)
 *     responses:
 *       200:
 *         description: Страница с записями аудит-лога
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

adminRouter.get('/logs', async (req, res) => {
  const { types, page = '1', pageSize = '50' } = req.query as Record<string, string>;
  const typeList = (types ? String(types).split(',') : []).filter(Boolean);

  const p = Math.max(parseInt(String(page), 10) || 1, 1);
  const ps = Math.min(Math.max(parseInt(String(pageSize), 10) || 50, 1), 200);

  const where = typeList.length ? { type: { in: typeList } } : {};

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * ps,
      take: ps,
      include: {
        actor: { select: { id: true, email: true } },
        target: { select: { id: true, name: true, kind: true } },
      },
    }),
  ]);

  res.json({ page: p, pageSize: ps, total, data });
});
