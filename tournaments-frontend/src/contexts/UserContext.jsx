import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, clearAuth } from "../services/api";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --------------------------------------------------
    // fetchUser: intenta reconstruir el user desde storage
    // --------------------------------------------------
    const fetchUser = async () => {
        try {
            const storedUser = localStorage.getItem("user_data");

            if (storedUser) {
                setUser(JSON.parse(storedUser));
                return;
            }

            // Si no hay user_data, intenta /auth/me (si existe)
            const data = await authAPI.getMe();
            setUser(data);
        } catch (error) {
            console.log("No valid session found or failed to fetch user", error);
            clearAuth(); // Limpia tokens si falla
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        await authAPI.login({ email, password });
        await fetchUser();
    };

    const register = async (userData) => {
        return await authAPI.register(userData);
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
        // window.location.href = "/login";
    };

    return (
        <UserContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
};
