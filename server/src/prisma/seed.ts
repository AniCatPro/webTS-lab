import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path, { dirname } from 'path';
import mime from 'mime-types';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    // админ
    const adminPass = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash: adminPass,
            role: 'ADMIN',
        },
    });

    // очищаем данные
    await prisma.textRevision.deleteMany();
    await prisma.file.deleteMany();

    const baseUrl = `http://localhost:${process.env.PORT || 4000}/static/seed`;
    const seedDir = path.join(__dirname, '..', '..', 'static', 'seed');

    const entries: any[] = [];

    for (const file of fs.readdirSync(seedDir)) {
        const filePath = path.join(seedDir, file);
        if (fs.statSync(filePath).isFile()) {
            const ext = path.extname(file).toLowerCase();

            let mimeType = mime.lookup(file) || 'application/octet-stream';
            // нормализация популярных форматов
            if (ext === '.mp4') mimeType = 'video/mp4';
            if (ext === '.mp3') mimeType = 'audio/mpeg';
            if (ext === '.md') mimeType = 'text/markdown';
            if (ext === '.txt') mimeType = 'text/plain';

            let type: 'image' | 'video' | 'audio' | 'document' | 'other' = 'other';
            if (mimeType.startsWith('image/')) type = 'image';
            else if (mimeType.startsWith('video/')) type = 'video';
            else if (mimeType.startsWith('audio/')) type = 'audio';
            else if (
                mimeType === 'application/pdf' ||
                mimeType.startsWith('text/') ||
                mimeType.includes('markdown')
            ) {
                type = 'document';
            }

            const stat = fs.statSync(filePath);

            entries.push({
                name: file,
                kind: 'file',
                mimeType,
                type,
                url: `${baseUrl}/${encodeURIComponent(file)}`,
                size: stat.size,
            });
        }
    }

    if (entries.length > 0) {
        await prisma.file.createMany({ data: entries });
        console.log(`Seeded ${entries.length} files from static/seed`);
    } else {
        console.log('No files found in static/seed');
    }

    console.log('Admin: admin@example.com / admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
