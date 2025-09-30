import { PrismaClient, FileType, FileKind } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = path.join(__dirname, '..', '..', 'static');
const SEED_DIR = path.join(STATIC_DIR, 'seed');

const PORT = Number(process.env.PORT || 4000);
const API_STATIC_BASE = `http://localhost:${PORT}/static`;

function urlFor(relPathFromStatic: string) {
    // Encode each path segment to keep Cyrillic/space-safe URLs
    const encoded = relPathFromStatic
        .split(path.sep)
        .join('/')
        .split('/')
        .map(encodeURIComponent)
        .join('/');
    return `${API_STATIC_BASE}/${encoded}`;
}

function toFileType(m: string | false | null): FileType | null {
    const mt = (m || '').toString().toLowerCase();
    if (!mt) return null;
    if (mt.startsWith('image/')) return 'image';
    if (mt.startsWith('video/')) return 'video';
    if (mt.startsWith('audio/')) return 'audio';
    if (
        mt === 'application/pdf' ||
        mt.startsWith('text/') ||
        mt.includes('markdown') ||
        mt.includes('msword') ||
        mt.includes('spreadsheet')
    ) return 'document';
    return 'other';
}

async function ensureUser(email: string, role: 'ADMIN'|'USER', password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.upsert({
        where: { email },
        update: { role },
        create: { email, passwordHash, role },
    });
}

async function ensureFolder(ownerId: string, name: string, parentId: string | null) {
  const existed = await prisma.file.findFirst({
    where: { ownerId, parentId, name, kind: 'folder' },
  });
  if (existed) return existed;
  const folder = await prisma.file.create({
    data: { ownerId, parentId, name, kind: 'folder' },
  });
  await prisma.auditLog.create({
    data: {
      type: 'file.create',
      actorId: ownerId,
      ownerId,
      targetId: folder.id,
      targetType: 'folder',
      targetName: folder.name,
      details: { parentId },
    },
  });
  return folder;
}

async function importSeedDir(absDir: string, ownerId: string, actorId: string, parentId: string | null) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      const folder = await ensureFolder(ownerId, ent.name, parentId);
      await importSeedDir(abs, ownerId, actorId, folder.id);
      continue;
    }
    if (!ent.isFile()) continue;

    const st = fs.statSync(abs);
    const mimeType = (mime.lookup(ent.name) || 'application/octet-stream').toString();
    const type = toFileType(mimeType);

    // Rel path from STATIC for URL building
    const relFromStatic = path.relative(STATIC_DIR, abs); // e.g. 'seed/a/b/c.png'
    const url = urlFor(relFromStatic);

    // unique within (ownerId, parentId, name, kind)
    const existed = await prisma.file.findFirst({
      where: { ownerId, parentId, name: ent.name, kind: 'file' },
    });
    if (existed) continue;

    const created = await prisma.file.create({
      data: {
        ownerId,
        parentId,
        name: ent.name,
        kind: 'file',
        mimeType,
        type,
        url,
        size: st.size,
      },
    });

    await prisma.auditLog.create({
      data: {
        type: 'file.create',
        actorId,
        ownerId,
        targetId: created.id,
        targetType: 'file',
        targetName: created.name,
        details: { parentId, size: created.size, mimeType: created.mimeType },
      },
    });
  }
}

async function ensureSeedFilesForOwner(ownerId: string, actorId: string) {
  if (!fs.existsSync(SEED_DIR)) {
    console.warn('[seed] Directory not found:', SEED_DIR);
    return;
  }
  await importSeedDir(SEED_DIR, ownerId, actorId, null);
}

async function main() {
    // 1) Users
    const admin = await ensureUser('admin@example.com', 'ADMIN', 'admin123');
    const user  = await ensureUser('user@example.com',  'USER',  'user123');

    // 2) Only regular USER gets initial files from /static/seed
    await ensureSeedFilesForOwner(user.id, user.id);

    console.log('Seed complete:');
    console.log('Admin:', 'admin@example.com / admin123');
    console.log('User :', 'user@example.com / user123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
