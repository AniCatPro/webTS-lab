import { defineStore } from 'pinia';
import { AuthApi } from '@/api/auth';
import router from '@/router';

type User = { id: string; email: string; role: 'user' | 'admin' } | null;

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null as User,
        loading: false,
        error: '' as string | null,
    }),
    actions: {
        async fetchMe() {
            try {
                this.loading = true;
                this.user = await AuthApi.me();
                this.error = null;
            } catch (e: any) {
                this.user = null;
                this.error = e.response?.data?.message || e.message;
            } finally {
                this.loading = false;
            }
        },
        async login(email: string, password: string) {
            try {
                this.loading = true;
                await AuthApi.login(email, password);
                await this.fetchMe();

                if (this.user) {
                    const redirect = router.currentRoute.value.query.redirect as string | undefined;
                    router.replace(redirect || { name: 'home' });
                }
            } catch (e: any) {
                this.error = e.response?.data?.message || e.message;
                throw e;
            } finally {
                this.loading = false;
            }
        },
        async logout() {
            await AuthApi.logout();
            this.user = null;
            router.replace({ name: 'login' });
        },
    },
});