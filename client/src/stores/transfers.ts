import { defineStore } from 'pinia';

export type Transfer = {
    id: string;
    name: string;
    total?: number;
    loaded: number;
    startedAt: number;
    speedBps?: number;
    etaSec?: number;
    done: boolean;
    error?: string | null;
    hideAt?: number;
};

function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useTransfers = defineStore('transfers', {
    state: () => ({ items: [] as Transfer[] }),
    actions: {
        start(name: string, total?: number) {
            const t: Transfer = {
                id: uid(),
                name,
                total,
                loaded: 0,
                startedAt: performance.now(),
                done: false,
                error: null,
            };
            this.items.unshift(t);
            return t.id;
        },
        update(id: string, loaded: number, total?: number) {
            const t = this.items.find(i => i.id === id);
            if (!t) return;
            const now = performance.now();
            const elapsed = (now - t.startedAt) / 1000;
            t.loaded = loaded;
            if (total !== undefined) t.total = total;
            if (elapsed > 0) {
                t.speedBps = t.loaded / elapsed;
                if (t.total && t.speedBps) {
                    const remain = Math.max(0, t.total - t.loaded);
                    t.etaSec = t.speedBps > 0 ? remain / t.speedBps : undefined;
                }
            }
        },
        finish(id: string) {
            const t = this.items.find(i => i.id === id);
            if (!t) return;
            t.done = true;
            t.hideAt = Date.now() + 5000; // держим 5с
        },
        fail(id: string, message: string) {
            const t = this.items.find(i => i.id === id);
            if (!t) return;
            t.error = message || 'Ошибка загрузки';
            t.done = true;
            t.hideAt = Date.now() + 7000;
        },
        sweep() {
            const now = Date.now();
            this.items = this.items.filter(t => !t.hideAt || t.hideAt > now);
        }
    }
});