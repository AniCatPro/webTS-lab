// client/src/stores/theme.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

type ThemeMode = "auto" | "light" | "dark";

export const useTheme = defineStore("theme", () => {
    // хранится режим, выбранный пользователем
    const mode = ref<ThemeMode>("auto");

    // вычисляемый: какой реально сейчас режим (light/dark)
    const effective = computed(() => {
        if (mode.value === "auto") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return mode.value;
    });

    function setMode(m: ThemeMode) {
        mode.value = m;
        apply();
        localStorage.setItem("theme-mode", m);
    }

    function apply() {
        const html = document.documentElement;
        if (effective.value === "dark") {
            html.classList.add("theme-dark");
        } else {
            html.classList.remove("theme-dark");
        }
    }

    function init() {
        // пробуем из localStorage
        const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
        if (saved) mode.value = saved;

        // слушаем изменения системной темы
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", () => {
            if (mode.value === "auto") apply();
        });

        apply();
    }

    return { mode, effective, setMode, init };
});