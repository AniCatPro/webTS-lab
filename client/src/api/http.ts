import axios from 'axios';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

function redirectToLoginOnce() {
    const isOnLogin = location.hash.startsWith('#/login');
    if (!isOnLogin) {
        location.replace(`${location.origin}${location.pathname}#/login`);
    }
}

http.interceptors.response.use(
    (resp) => resp,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) redirectToLoginOnce();
        return Promise.reject(error);
    }
);