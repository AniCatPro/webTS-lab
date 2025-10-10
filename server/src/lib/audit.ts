import { prisma } from './prisma.js';

type AuditArgs = {
    actorId?: string | null;
    targetId?: string | null;
    targetType: 'file' | 'folder' | 'user' | 'system';
    targetName?: string | null;
    details?: any;
};

export async function writeAudit(type: string, args: AuditArgs) {
    try {
        await prisma.auditLog.create({
            data: {
                type,
                actorId: args.actorId ?? null,
                targetId: args.targetId ?? null,
                targetType: args.targetType,
                targetName: args.targetName ?? null,
                details: args.details ?? undefined,
            },
        });
    } catch (e) {
        console.warn('audit log failed:', e);
    }
}