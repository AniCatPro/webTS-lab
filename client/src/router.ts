import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import FolderPage from '@/pages/FolderPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import AdminPage from '@/pages/AdminPage.vue';


const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: HomePage },
    { path: '/folder/:id', name: 'folder', component: FolderPage, props: true },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/admin', name: 'admin', component: AdminPage },
    { path: '/:pathMatch(.*)*', name: '404', component: () => import('@/pages/NotFoundPage.vue') },
];


export const router = createRouter({ history: createWebHashHistory(), routes });