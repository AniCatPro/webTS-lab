import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { listQuery, textSaveDto } from '../dto/files';

export const filesRouter = Router();

filesRouter.get('/', async (req, res) => {
    const q = listQuery.parse(req.query);
    const page = Number(q.page || 1), pageSize = Number(q.pageSize || 20);

    const where: any = {};
    if (q.parentId !== undefined) where.parentId = q.parentId === null ? null : q.parentId;
    if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
    if (q.type) where.type = q.type;

    const [total, data] = await Promise.all([
        prisma.file.count({ where }),
        prisma.file.findMany({ where, skip: (page-1)*pageSize, take: pageSize, orderBy: { updatedAt: 'desc' } }),
    ]);

    res.json({ data, total, page, pageSize });
});

filesRouter.get('/:id', async (req, res) => {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file);
});

filesRouter.get('/:id/text', async (req, res) => {
    const f = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!f || f.kind !== 'file' || !(f.mimeType||'').startsWith('text')) return res.status(400).json({ message: 'Not a text file' });
    const last = await prisma.textRevision.findFirst({ where: { fileId: f.id }, orderBy: { createdAt: 'desc' } });
    res.json({ content: last?.content || '' });
});

filesRouter.post('/:id/text', async (req, res) => {
    const f = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!f || f.kind !== 'file' || !(f.mimeType||'').startsWith('text')) return res.status(400).json({ message: 'Not a text file' });
    const body = textSaveDto.parse(req.body);
    // для примера — пишем как бы от админа; можно расширить: брать userId из токена
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const rev = await prisma.textRevision.create({ data: { fileId: f.id, content: body.content, authorId: admin!.id } });
    res.json({ ok: true, id: rev.id });
});
