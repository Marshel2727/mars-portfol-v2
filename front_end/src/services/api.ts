import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('access_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }

        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
);

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/admin")
        ) {
            Cookies.remove("access_token");
            window.location.replace("/login?expired=1");
        }

        return Promise.reject(error);
    }
);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (!axios.isAxiosError(error)) return fallback;

    const responseData = error.response?.data as { message?: string; msg?: string } | undefined;
    return responseData?.message || responseData?.msg || error.message || fallback;
};

export const fetcher = (url: string) => api.get(url).then(res => res.data);

export default api;
