import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

// -------------------------------------------------
// Helpers
// -------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, '..', '..', 'static');
const UPLOADS_DIR = path.join(STATIC_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** Нормализация text-подобных mime */
function isTextLike(mimeType?: string | null) {
    const mt = (mimeType || '').toLowerCase();
    return (
        mt.startsWith('text/') ||
        mt === 'application/json' ||
        mt === 'text/markdown'
    );
}

/** Классификация вида файла для поля File.type */
function toFileType(mimeType?: string | null):
    | 'image' | 'video' | 'audio' | 'document' | 'other' | undefined {
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
    ) return 'document';
    return 'other';
}

/** Нормализация parentId из query (?parentId=, null, undefined) */
function normalizeParentId(raw: unknown): string | null | undefined {
    if (raw === undefined) return undefined;               // не фильтруем (корень)
    const s = String(raw);
    if (s === '' || s === 'null' || s === 'undefined') return null;
    return s;
}

// Multer storage в /static/uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
        cb(null, `${Date.now()}_${safe}`);
    }
});
const upload = multer({ storage });

// -------------------------------------------------
// Router
// -------------------------------------------------
export const filesRouter = Router();

/**
 * GET /api/files
 * Список с фильтрами: parentId, q (по имени), type, страница
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
 * Получить метаданные файла/папки
 */
filesRouter.get('/:id', async (req, res) => {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file);
});

/**
 * GET /api/files/:id/text
 * Вернуть актуальный текст для текстового файла
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
 * body: { content: string }
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

    // здесь можно брать автора из req.user, если включишь authGuard
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    await prisma.textRevision.create({
        data: { fileId: f.id, content, authorId: admin!.id },
    });

    res.json({ ok: true });
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

    const absPath = req.file.path; // .../static/uploads/123_name.ext
    const rel = path.relative(STATIC_DIR, absPath).split(path.sep).join('/'); // uploads/123_name.ext
    const url = `http://localhost:${process.env.PORT || 4000}/static/${rel}`;

    // mime из Multer или по расширению; нормализация популярных
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    let mimeType = req.file.mimetype || (mime.lookup(req.file.originalname) || '').toString();
    if (ext === '.mp4') mimeType = 'video/mp4';
    if (ext === '.mp3') mimeType = 'audio/mpeg';
    if (ext === '.md')  mimeType = 'text/markdown';
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
 * DELETE /api/files/:id
 * Удаление файла/папки (папка — только если пуста).
 * Если файл хранится в /static/uploads — удаляем и с диска.
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
        const urlPath = f.url.split('/static/')[1]; // uploads/xxx
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