import axios from 'axios';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // отправляем cookie с JWT ко всем запросам к API
});

http.interceptors.response.use(
    r => r,
    (err) => {
// централизованный перехват ошибок
        const msg = err.response?.data?.message || err.message;
        console.error('API error:', msg);
        return Promise.reject(err);
    }
);