import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = path.join(__dirname, '..', '..', 'static', 'seed');

function urlFor(filename: string) {
    return `http://localhost:${process.env.PORT || 4000}/static/seed/${encodeURIComponent(filename)}`;
}

async function ensureFolder(name: string) {
    const folder = await prisma.folder.upsert({
        where: { name },
        update: {},
        create: { name },
    });
    await prisma.auditLog.create({
        data: {
            action: 'CREATE_FOLDER',
            details: `Folder created or exists: ${name}`,
        },
    });
    return folder;
}

async function ensureSeedFile(filename: string, folderId: number) {
    const filePath = path.join(STATIC_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    const file = await prisma.file.upsert({
        where: { name: filename },
        update: {},
        create: {
            name: filename,
            mimeType,
            size: stat.size,
            url: urlFor(filename),
            folderId,
        },
    });
    await prisma.auditLog.create({
        data: {
            action: 'CREATE_FILE',
            details: `File created or exists: ${filename} in folder ${folderId}`,
        },
    });
    return file;
}

async function main() {
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash: adminPass,
            role: 'ADMIN',
        },
    });

    await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            passwordHash: userPass,
            role: 'USER',
        },
    });

    const documents = await ensureFolder('Документы');
    const media = await ensureFolder('Медиа');
    const images = await ensureFolder('Изображения');

    await ensureSeedFile('readme.md', documents.id);
    await ensureSeedFile('sample.pdf', documents.id);
    await ensureSeedFile('Nextcloud intro.mp4', media.id);
    await ensureSeedFile('Welcome to your Nextcloud.png', images.id);

    console.log('Seed complete:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
