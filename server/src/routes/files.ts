import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authGuard } from '../middleware/authGuard.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import send from 'send';

// -------------------------------------------------
// Helpers
// -------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, '..', '..', 'static');
const UPLOADS_DIR = path.join(STATIC_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function isTextLike(mimeType?: string | null) {
    const mt = (mimeType || '').toLowerCase();
    return mt.startsWith('text/') || mt === 'application/json' || mt === 'text/markdown';
}

function toFileType(
    mimeType?: string | null
): 'image' | 'video' | 'audio' | 'document' | 'other' | undefined {
    if (!mimeType) return undefined;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
        mimeType === 'application/pdf' ||
        mimeType.startsWith('text/') ||
        mimeType.includes('markdown') ||
        mimeType.includes('msword') ||
        mimeType.includes('spreadsheet')
    )
        return 'document';
    return 'other';
}

function normalizeParentId(raw: unknown): string | null | undefined {
    if (raw === undefined) return undefined; // корень
    const s = String(raw);
    if (s === '' || s === 'null' || s === 'undefined') return null; // явно корневые
    return s;
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
        cb(null, `${Date.now()}_${safe}`);
    },
});
const upload = multer({ storage });

// -------------------------------------------------
// Router
// -------------------------------------------------
export const filesRouter = Router();

// закрываем весь роутер авторизацией
filesRouter.use(authGuard);

/**
 * GET /api/files
 * Список/поиск
 */
filesRouter.get('/', async (req, res) => {
    const parentId = normalizeParentId(req.query.parentId);
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const type = typeof req.query.type === 'string' ? (req.query.type as any) : undefined;

    const where: any = {};
    if (parentId !== undefined) where.parentId = parentId; // null пройдёт как есть
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (type) where.type = type;

    const [total, data] = await Promise.all([
        prisma.file.count({ where }),
        prisma.file.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { updatedAt: 'desc' },
        }),
    ]);

    res.json({ data, total, page, pageSize });
});

/**
 * GET /api/files/:id
 * Метаданные файла/папки
 */
filesRouter.get('/:id', async (req, res) => {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file);
});

/**
 * GET /api/files/:id/text
 * Получить содержимое текстового файла
 */
filesRouter.get('/:id/text', async (req, res) => {
    const f = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!f) return res.status(404).json({ message: 'Not found' });
    if (f.kind !== 'file' || !isTextLike(f.mimeType)) {
        return res.status(400).json({ message: 'Not a text file' });
    }
    const last = await prisma.textRevision.findFirst({
        where: { fileId: f.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ content: last?.content || '' });
});

/**
 * POST /api/files/:id/text
 * Сохранить новую версию текста
 */
filesRouter.post('/:id/text', async (req, res) => {
    const f = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!f) return res.status(404).json({ message: 'Not found' });
    if (f.kind !== 'file' || !isTextLike(f.mimeType)) {
        return res.status(400).json({ message: 'Not a text file' });
    }

    const content = (req.body?.content ?? '') as string;
    if (typeof content !== 'string' || content.length > 100_000) {
        return res.status(400).json({ message: 'Invalid content' });
    }

    // TODO: можно брать автора из req.user.sub
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    await prisma.textRevision.create({
        data: { fileId: f.id, content, authorId: admin!.id },
    });

    res.json({ ok: true });
});

/**
 * GET /api/files/:id/content
 * Защищённая выдача бинарного содержимого (blob)
 */
filesRouter.get('/:id/content', async (req, res) => {
    const f = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!f) return res.status(404).json({ message: 'Not found' });
    if (f.kind !== 'file' || !f.url) return res.status(400).json({ message: 'No content' });

    const idx = f.url.indexOf('/static/');
    if (idx === -1) return res.status(400).json({ message: 'External content not allowed' });

    const relEncoded = f.url.slice(idx + '/static/'.length); // e.g. seed/Nextcloud%20intro.mp4
    const rel = decodeURIComponent(relEncoded);              // -> seed/Nextcloud intro.mp4
    const abs = path.join(STATIC_DIR, rel);
    if (!fs.existsSync(abs)) return res.status(404).json({ message: 'File not found' });

    // тип ставим заранее
    if (f.mimeType) res.type(f.mimeType);

    send(req, abs)
        .on('error', (err) => {
            console.error('send error', err);
            if (!res.headersSent) res.status(500).end();
        })
        .pipe(res);
});

/**
 * POST /api/files/upload
 * Загрузка файла (multipart/form-data: file, parentId?)
 */
filesRouter.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file' });

    const parentId = normalizeParentId(req.body?.parentId);
    if (parentId) {
        const parent = await prisma.file.findUnique({ where: { id: parentId } });
        if (!parent || parent.kind !== 'folder') {
            return res.status(400).json({ message: 'Invalid parentId' });
        }
    }

    const absPath = req.file.path;
    const rel = path.relative(STATIC_DIR, absPath).split(path.sep).join('/');
    const url = `http://localhost:${process.env.PORT || 4000}/static/${rel}`;

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let mimeType = req.file.mimetype || (mime.lookup(req.file.originalname) || '').toString();
    if (ext === '.mp4') mimeType = 'video/mp4';
    if (ext === '.mp3') mimeType = 'audio/mpeg';
    if (ext === '.md') mimeType = 'text/markdown';
    if (ext === '.txt') mimeType = 'text/plain';

    const created = await prisma.file.create({
        data: {
            name: req.file.originalname || req.file.filename,
            kind: 'file',
            mimeType,
            type: toFileType(mimeType) as any,
            parentId: parentId ?? null,
            url,
            size: req.file.size,
        },
    });

    res.status(201).json(created);
});

/**
 * POST /api/files/folder
 * Создать папку
 * body: { name: string, parentId?: string|null }
 */
filesRouter.post('/folder', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const parentId = normalizeParentId(req.body?.parentId);
  if (parentId) {
    const parent = await prisma.file.findUnique({ where: { id: parentId } });
    if (!parent || parent.kind !== 'folder') {
      return res.status(400).json({ message: 'Invalid parentId' });
    }
  }

  // Проверка на дубликаты (регистронезависимо в пределах одного родителя)
  const existing = await prisma.file.findFirst({
    where: {
      kind: 'folder',
      parentId: parentId ?? null,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (existing) {
    return res.status(409).json({ message: 'Такая папка уже существует в этой директории' });
  }

  const folder = await prisma.file.create({
    data: {
      name,
      kind: 'folder',
      type: undefined,
      mimeType: null,
      parentId: parentId ?? null,
      url: null,
      size: null,
    },
  });

  res.status(201).json(folder);
});

/**
 * PUT /api/files/:id/move
 * Переместить файл/папку в другую папку (или в корень)
 * body: { parentId?: string|null }
 */
filesRouter.put('/:id/move', async (req, res) => {
  const f = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!f) return res.status(404).json({ message: 'Not found' });

  const parentId = normalizeParentId(req.body?.parentId);
  if (parentId) {
    const parent = await prisma.file.findUnique({ where: { id: parentId } });
    if (!parent || parent.kind !== 'folder') {
      return res.status(400).json({ message: 'Invalid parentId' });
    }

    // нельзя переместить папку внутрь самой себя (и, по-хорошему, внутрь своих потомков —
    // этот кейс можно обработать отдельно при желании)
    if (f.id === parentId) {
      return res.status(400).json({ message: 'Cannot move into itself' });
    }
  }

  const updated = await prisma.file.update({
    where: { id: f.id },
    data: { parentId: parentId ?? null },
  });

  res.json(updated);
});

/**
 * DELETE /api/files/:id
 */
filesRouter.delete('/:id', async (req, res) => {
    const f = await prisma.file.findUnique({
        where: { id: req.params.id },
        include: { children: true },
    });
    if (!f) return res.status(404).json({ message: 'Not found' });

    if (f.kind === 'folder' && f.children.length > 0) {
        return res.status(400).json({ message: 'Folder is not empty' });
    }

    if (f.kind === 'file' && f.url && f.url.includes('/static/uploads/')) {
        const urlPath = f.url.split('/static/')[1];
        const abs = path.join(STATIC_DIR, urlPath);
        try {
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch (e) {
            console.warn('unlink failed', e);
        }
    }

    await prisma.file.delete({ where: { id: f.id } });
    res.json({ ok: true });
});