import { defineStore } from 'pinia';
import { FilesApi, type ListQuery } from '@/api/files';
import type { FsEntry, Paginated } from '@/types';


export const useFiles = defineStore('files', {
    state: () => ({
        page: 1,
        pageSize: 20,
        total: 0,
        items: [] as FsEntry[],
        loading: false,
        error: '' as string | null,
        currentFolder: null as FsEntry | null,
    }),
    actions: {
        async loadList(params: ListQuery) {
            try {
                this.loading = true; this.error = null;
                const res: Paginated<FsEntry> = await FilesApi.list({ page: this.page, pageSize: this.pageSize, ...params });
                this.items = res.data; this.total = res.total; this.page = res.page; this.pageSize = res.pageSize;
            } catch (e: any) {
                this.error = e.response?.data?.message || e.message;
            } finally { this.loading = false; }
        },
        async openFolder(id: string | null) {
            await this.loadList({ parentId: id });
            this.currentFolder = id ? await FilesApi.get(id) : null;
        }
    }
});