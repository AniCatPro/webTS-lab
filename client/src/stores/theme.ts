import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'fm_theme_mode';

export const useTheme = defineStore('theme', () => {
    const mode = ref<ThemeMode>('auto');
    const systemDarkMql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const systemIsDark = ref<boolean>(!!systemDarkMql?.matches);

    const effective = computed<'light' | 'dark'>(() => {
        if (mode.value === 'auto') return systemIsDark.value ? 'dark' : 'light';
        return mode.value;
    });

    function applyDomClass() {
        const root = document.documentElement;
        if (effective.value === 'dark') root.classList.add('theme-dark');
        else root.classList.remove('theme-dark');

        // полезно для корректных нативных виджетов/скроллбаров
        root.style.colorScheme = effective.value;
    }

    function setMode(next: ThemeMode) {
        mode.value = next;
        localStorage.setItem(STORAGE_KEY, next);
        applyDomClass();
    }

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (saved === 'auto' || saved === 'light' || saved === 'dark') {
            mode.value = saved;
        }

        if (systemDarkMql) {
            const handler = (e: MediaQueryListEvent) => {
                systemIsDark.value = e.matches;
                if (mode.value === 'auto') applyDomClass();
            };
            systemDarkMql.addEventListener?.('change', handler);
        }

        applyDomClass();
    }

    // если кто-то где-то поменяет mode, авто-применим класс
    watch(mode, applyDomClass);

    return { mode, effective, setMode, init };
});