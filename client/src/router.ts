import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import FolderPage from "@/pages/FolderPage.vue";
import AdminPage from "@/pages/AdminPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";
import { useAuth } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
    { path: "/", name: "home", component: HomePage, meta: { requiresAuth: true } },
    { path: "/folder/:id", name: "folder", component: FolderPage, meta: { requiresAuth: true } },
    { path: "/admin", name: "admin", component: AdminPage, meta: { requiresAuth: true } },
    { path: "/login", name: "login", component: LoginPage },
    { path: "/:pathMatch(.*)*", name: "notfound", component: NotFoundPage },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

let triedFetchMe = false;

router.beforeEach(async (to) => {
    const auth = useAuth();

    if (to.name === "login" && auth.user) {
        return { name: "home" };
    }

    if (!to.meta.requiresAuth) return true;

    if (auth.user) return true;

    if (!triedFetchMe) {
        triedFetchMe = true;
        try {
            await auth.fetchMe();
        } catch {
            // ignore
        }
        if (auth.user) return true;
    }

    return { name: "login", query: { redirect: to.fullPath } };
});

export default router;