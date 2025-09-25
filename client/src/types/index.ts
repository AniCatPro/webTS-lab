export type FileKind = 'file' | 'folder';
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other';


export interface FsEntry {
    id: string;
    name: string;
    kind: FileKind; // 'file'|'folder'
    mimeType?: string; // для файлов
    type?: FileType; // нормализованный вид для фильтра
    parentId?: string | null;
    size?: number;
    url?: string; // для предпросмотра бинарных
    updatedAt: string;
}


export interface Paginated<T> { data: T[]; total: number; page: number; pageSize: number; }