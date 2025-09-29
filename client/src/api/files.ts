import { http } from './http';

export const FilesApi = {
    list: (params: { parentId?: string | null; q?: string; type?: string; page?: number; pageSize?: number }) =>
        http.get('/files', { params }).then(r => r.data),

    get: (id: string) => http.get(`/files/${id}`).then(r => r.data),

    getText: (id: string) => http.get(`/files/${id}/text`).then(r => r.data),

    saveText: (id: string, content: string) =>
        http.post(`/files/${id}/text`, { content }).then(r => r.data),

    upload: (file: File, parentId?: string | null) => {
        const form = new FormData();
        form.append('file', file);
        if (parentId !== undefined) form.append('parentId', parentId ?? '');
        return http.post('/files/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
    },

    remove: (id: string) => http.delete(`/files/${id}`).then(r => r.data),

    // защищённая выдача бинарника → получаем blob
    getContentBlob: (id: string) =>
        http.get(`/files/${id}/content`, { responseType: 'blob' }).then(r => r.data),
};