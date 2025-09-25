import axios from 'axios';


export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true, // чтобы cookie с JWT отправлялась автоматически
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