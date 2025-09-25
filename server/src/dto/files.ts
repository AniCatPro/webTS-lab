import { z } from 'zod';
export const listQuery = z.object({
    parentId: z.string().optional().nullable(),
    q: z.string().max(200).optional(),
    type: z.enum(['image','video','audio','document','other']).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
});
export const textSaveDto = z.object({
    content: z.string().max(100_000)
});
