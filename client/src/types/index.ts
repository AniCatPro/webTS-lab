export type FileKind = 'file' | 'folder';
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other';


export interface FsEntry {
    id: string;
    name: string;
    kind: FileKind;
    mimeType?: string;
    type?: FileType;
    parentId?: string | null;
    size?: number;
    url?: string;
    updatedAt: string;
}


export interface Paginated<T> { data: T[]; total: number; page: number; pageSize: number; }