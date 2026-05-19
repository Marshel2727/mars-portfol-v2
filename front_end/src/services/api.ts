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

export default api;