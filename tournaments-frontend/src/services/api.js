import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID || "55555555-5555-5555-5555-555555555555";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// -----------------------------
// Token storage (localStorage)
// -----------------------------
let accessToken = localStorage.getItem("access_token") || null;

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
};

export const getAccessToken = () => accessToken;

export const clearAuth = () => {
    setAccessToken(null);
    localStorage.removeItem("user_data");
    localStorage.removeItem("refresh_token");
};

// -----------------------------
// Request interceptor
// -----------------------------
api.interceptors.request.use(
    (config) => {
        const url = config.url || "";

        if (ADMIN_USER_ID && url.includes("/admin")) {
            config.headers["x-user-id"] = ADMIN_USER_ID;
        }

        const publicRoutes = ["/auth/login", "/auth/register", "/auth/refresh"];
        const isPublic = publicRoutes.some((route) => url.includes(route));

        if (accessToken && !isPublic) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// -----------------------------
// Response interceptor (refresh token)
// -----------------------------
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) {
                clearAuth();
                return Promise.reject(error);
            }

            try {
                const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
                const newAccessToken = res.data.access_token;

                setAccessToken(newAccessToken);

                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (err) {
                clearAuth();
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// -----------------------------
// tournamentAPI
// -----------------------------
export const tournamentAPI = {
    getAll: async () => {
        const res = await api.get("/tournaments");
        const data = res.data || [];
        return data.map((tournament) => ({
            ...tournament,
            images:
                tournament.images && typeof tournament.images === "string"
                    ? (() => {
                        try {
                            return JSON.parse(tournament.images);
                        } catch {
                            return [];
                        }
                    })()
                    : tournament.images || [],
        }));
    },

    getById: async (id) => {
        const res = await api.get(`/tournaments/${id}`);
        const data = res.data || {};
        return {
            ...data,
            images:
                data.images && typeof data.images === "string"
                    ? (() => {
                        try {
                            return JSON.parse(data.images);
                        } catch {
                            return [];
                        }
                    })()
                    : data.images || [],
        };
    },

    create: async (tournamentData) => {
        const res = await api.post("/tournaments", tournamentData);
        return res.data;
    },

    update: async (id, tournamentData) => {
        const res = await api.put(`/tournaments/${id}`, tournamentData);
        return res.data;
    },

    delete: async (id) => {
        const res = await api.delete(`/tournaments/${id}`);
        return res.data;
    },
};

// -----------------------------
// authAPI
// -----------------------------
export const authAPI = {
    login: async (credentials) => {
        const res = await api.post("/auth/login", credentials);
        const { access_token, refresh_token } = res.data;

        setAccessToken(access_token);

        const payload = JSON.parse(atob(access_token.split(".")[1]));
        localStorage.setItem(
            "user_data",
            JSON.stringify({
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            })
        );

        if (refresh_token) localStorage.setItem("refresh_token", refresh_token);

        return res.data;
    },

    register: async (userData) => {
        const res = await api.post("/auth/register", userData);
        return res.data;
    },

    logout: async () => {
        const refreshToken = localStorage.getItem("refresh_token");
        try {
            if (refreshToken) await api.post("/auth/logout", { refresh_token: refreshToken });
        } catch (error) {
            console.warn("Logout API error (proceeding anyway):", error);
        } finally {
            clearAuth();
        }
    },

    getMe: async () => {
        const res = await api.get("/auth/me");
        return res.data;
    },
};

export default api;
