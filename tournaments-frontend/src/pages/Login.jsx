import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, UserPlus } from "lucide-react";
import { useUser } from "../contexts/UserContext";

export default function AuthPage() {
    const navigate = useNavigate();
    const { user, login, register } = useUser();

    const [tab, setTab] = useState("login"); // 'login' | 'register'

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState(null);

    // Register state
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regRole, setRegRole] = useState("player");
    const [regNickname, setRegNickname] = useState("");
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState(null);

    useEffect(() => {
        if (user) {
            if (user.role === "admin") {
                navigate("/admin");
            } else if (user.role === "coach") {
                navigate(`/coach/${user.id}`);
            } else {
                navigate(`/perfil/${user.id}`);
            }
        }
    }, [user, navigate]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setLoginLoading(true);
        try {
            await login(loginEmail, loginPassword);
            // Navigation handled by useEffect
        } catch (err) {
            setLoginError(err.response?.data?.detail || err.message || "Login failed");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError(null);
        setRegLoading(true);
        try {
            const body = {
                email: regEmail,
                password: regPassword,
                role: regRole,
            };
            if (regRole === "player" && regNickname) body.nickname = regNickname;

            await register(body);

            // Auto-login after register
            try {
                await login(regEmail, regPassword);
            } catch {
                setTab("login"); // Fallback to login tab if auto-login fails
            }
        } catch (err) {
            setRegError(err.response?.data?.detail || err.message || "Register failed");
        } finally {
            setRegLoading(false);
        }
    };

    if (user) return null; // Avoid flickering while redirecting

    return (
        <div className="max-w-3xl mx-auto mt-12 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Acceso / Registro</h1>
                <div className="flex gap-1 bg-gray-900 rounded-full p-1">
                    <button
                        className={`px-3 py-1 rounded-full text-sm ${tab === "login" ? "bg-lol-gold text-black" : "text-gray-300"}`}
                        onClick={() => setTab("login")}
                    >
                        <LogIn className="inline w-4 h-4 mr-1" /> Entrar
                    </button>
                    <button
                        className={`px-3 py-1 rounded-full text-sm ${tab === "register" ? "bg-lol-gold text-black" : "text-gray-300"}`}
                        onClick={() => setTab("register")}
                    >
                        <UserPlus className="inline w-4 h-4 mr-1" /> Registrarse
                    </button>
                </div>
            </div>

            {tab === "login" ? (
                <form onSubmit={handleLogin} className="grid gap-4">
                    {loginError && <div className="text-red-400 text-sm">{loginError}</div>}

                    <label className="block">
                        <div className="text-sm text-gray-300 mb-1">Email</div>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700"
                                placeholder="tucorreo@ejemplo.com"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <div className="text-sm text-gray-300 mb-1">Contraseña</div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </label>

                    <div className="flex items-center justify-between mt-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-lol-gold text-black rounded hover:opacity-95"
                            disabled={loginLoading}
                        >
                            {loginLoading ? "Accediendo..." : "Entrar"}
                        </button>

                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-gray-200"
                            onClick={() => setTab("register")}
                        >
                            ¿No tienes cuenta? Regístrate
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="grid gap-4">
                    {regError && <div className="text-red-400 text-sm">{regError}</div>}

                    <label className="block">
                        <div className="text-sm text-gray-300 mb-1">Email</div>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700"
                                placeholder="tucorreo@ejemplo.com"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <div className="text-sm text-gray-300 mb-1">Contraseña</div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <div className="text-sm text-gray-300 mb-1">Rol</div>
                        <select
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700"
                        >
                            <option value="player">Jugador</option>
                            <option value="coach">Coach</option>
                            {/* <option value="admin">Admin</option> */}
                        </select>
                    </label>

                    {regRole === "player" && (
                        <label className="block">
                            <div className="text-sm text-gray-300 mb-1">Nickname (opcional)</div>
                            <input
                                type="text"
                                value={regNickname}
                                onChange={(e) => setRegNickname(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700"
                                placeholder="pikaPlayer"
                            />
                        </label>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-lol-gold text-black rounded hover:opacity-95"
                            disabled={regLoading}
                        >
                            {regLoading ? "Registrando..." : "Crear cuenta"}
                        </button>

                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-gray-200"
                            onClick={() => setTab("login")}
                        >
                            ¿Ya tienes cuenta? Entrar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
