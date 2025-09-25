import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // admin user
    const adminEmail = 'admin@example.com';
    const adminPass = 'admin123';
    const passwordHash = await bcrypt.hash(adminPass, 10);

    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
        admin = await prisma.user.create({
            data: { email: adminEmail, passwordHash, role: Role.ADMIN }
        });
        console.log(`Admin created: ${adminEmail} / ${adminPass}`);
    }

    // root folder
    const root = await prisma.file.upsert({
        where: { id: 'root-root-root' },
        update: {},
        create: { id: 'root-root-root', name: 'Корень', kind: 'folder', parentId: null }
    });

    // sample files
    const doc1 = await prisma.file.create({
        data: {
            name: 'notes.txt',
            kind: 'file',
            mimeType: 'text/plain',
            type: 'document',
            parentId: root.id
        }
    });

    const pdf1 = await prisma.file.create({
        data: {
            name: 'spec.pdf',
            kind: 'file',
            mimeType: 'application/pdf',
            type: 'document',
            parentId: root.id,
            url: 'http://localhost:4000/static/spec.pdf' // можно сменить
        }
    });

    const img1 = await prisma.file.create({
        data: {
            name: 'photo.png',
            kind: 'file',
            mimeType: 'image/png',
            type: 'image',
            parentId: root.id,
            url: 'http://localhost:4000/static/photo.png'
        }
    });

    // initial text revision
    await prisma.textRevision.create({
        data: {
            fileId: doc1.id,
            authorId: admin.id,
            content: 'Пример текстового файла'
        }
    });

    console.log('Seed finished');
}

main().finally(() => prisma.$disconnect());
