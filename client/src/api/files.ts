import { http } from './http';
import type { FsEntry, Paginated, FileType } from '@/types';


export interface ListQuery {
    parentId?: string | null;
    q?: string; // поиск по имени
    type?: FileType; // фильтр по виду файла
    page?: number;
    pageSize?: number;
}


export const FilesApi = {
    list: (params: ListQuery) => http.get<Paginated<FsEntry>>('/files', { params }).then(r => r.data),
    get: (id: string) => http.get<FsEntry>(`/files/${id}`).then(r => r.data),
    getText: (id: string) => http.get<{ content: string }>(`/files/${id}/text`).then(r => r.data),
    saveText: (id: string, content: string) => http.post<{ ok: true }>(`/files/${id}/text`, { content }).then(r => r.data),
};