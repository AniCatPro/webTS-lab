// client/src/stores/theme.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

type ThemeMode = "auto" | "light" | "dark";

export const useTheme = defineStore("theme", () => {
    const mode = ref<ThemeMode>("auto");
    const systemDark = ref(false);
    let mql: MediaQueryList | null = null;
    let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null;

    const effective = computed<"light" | "dark">(() => {
        return mode.value === "auto" ? (systemDark.value ? "dark" : "light") : mode.value;
    });

    function apply() {
        const html = document.documentElement;
        html.classList.toggle("theme-dark", effective.value === "dark");
    }

    function setMode(m: ThemeMode) {
        if (mode.value === m) return;
        mode.value = m;
        localStorage.setItem("theme-mode", m);
        apply();
    }

    function init() {
        // 1) восстановить выбранный режим
        const saved = (localStorage.getItem("theme-mode") as ThemeMode | null);
        if (saved === "auto" || saved === "light" || saved === "dark") {
            mode.value = saved;
        }

        // 2) подписка на системную тему
        mql = window.matchMedia("(prefers-color-scheme: dark)");
        systemDark.value = !!mql.matches;

        mqlHandler = (e: MediaQueryListEvent) => {
            systemDark.value = e.matches;   // <-- триггерит пересчёт `effective`
            if (mode.value === "auto") apply();
        };

        if ("addEventListener" in mql) {
            mql.addEventListener("change", mqlHandler);
        } else {
            // старый Safari
            // @ts-ignore
            mql.addListener(mqlHandler);
        }

        // 3) применить текущую тему к DOM
        apply();
    }

    // на всякий случай, если где-то захочешь отписываться (HMR и т.п.)
    function dispose() {
        if (!mql || !mqlHandler) return;
        if ("removeEventListener" in mql) {
            mql.removeEventListener("change", mqlHandler);
        } else {
            // @ts-ignore
            mql.removeListener(mqlHandler);
        }
        mql = null;
        mqlHandler = null;
    }

    return { mode, effective, setMode, init, dispose };
});