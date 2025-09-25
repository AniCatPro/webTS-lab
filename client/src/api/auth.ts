import { http } from './http';


export const AuthApi = {
    login: (email: string, password: string) => http.post('/auth/login', { email, password }).then(r => r.data),
    me: () => http.get('/auth/me').then(r => r.data),
    logout: () => http.post('/auth/logout').then(r => r.data),
};