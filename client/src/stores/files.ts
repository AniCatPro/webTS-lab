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
                this.loading = true;
                this.error = null;
                const res: Paginated<FsEntry> = await FilesApi.list({
                    page: this.page,
                    pageSize: this.pageSize,
                    ...params,
                });
                const incoming: FsEntry[] = (res.data ?? (res as any).items ?? res ?? []) as FsEntry[];
                const wantedParent: string | null = params.parentId ?? null;
                const filtered = incoming.filter((x) => ((x.parentId ?? null) === wantedParent));
                const uniq = new Map<string, FsEntry>();
                for (const it of filtered) uniq.set(it.id, it);

                this.items = Array.from(uniq.values());
                this.total = res.total ?? this.items.length;
                this.page = res.page ?? this.page;
                this.pageSize = res.pageSize ?? this.pageSize;
            } catch (e: any) {
                this.error = e?.response?.data?.message || e?.message || String(e);
                this.items = [];
            } finally {
                this.loading = false;
            }
        },

        async openFolder(id: string | null) {
            await this.loadList({ parentId: id });
            this.currentFolder = id ? await FilesApi.get(id) : null;
        },
    },
});