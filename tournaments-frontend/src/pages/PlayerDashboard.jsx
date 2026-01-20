// src/App.jsx
import React, { useEffect, useState } from "react";

/*
  App: Dashboard para jugadores
  - Muestra información del perfil del usuario
  - Lista equipos del usuario
  - Lista cuentas de juego del usuario
*/

function fetchJSON(url, opts) {
    return fetch(url, opts).then(async (res) => {
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || res.statusText);
        }
        return res.json();
    });
}

export default function App() {
    const [userData, setUserData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [gameAccounts, setGameAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadUserData();
    }, []);

    async function loadUserData() {
        setLoading(true);
        setError("");
        try {
            // Cargar datos del usuario
            const userResponse = await fetchJSON("http://localhost:8000/players/me");
            setUserData(userResponse);

            // Cargar equipos del usuario
            const teamsResponse = await fetchJSON("http://localhost:8000/players/me/teams");
            setTeams(teamsResponse);

            // Cargar cuentas de juego del usuario
            const accountsResponse = await fetchJSON("http://localhost:8000/players/me/game-accounts");
            setGameAccounts(accountsResponse);

        } catch (e) {
            setError("Error cargando datos: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    function ProfileCard() {
        if (!userData) return null;

        return (
            <div className="bg-white/90 dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                        <img
                            src={userData.user.avatar_url}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full border-4 border-pokemon-blue"
                        />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userData.profile.nickname}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">{userData.user.email}</p>
                        <div className="flex gap-6 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pokemon-blue">{userData.teams_count}</div>
                                <div className="text-sm text-gray-500">Equipos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pokemon-red">{userData.tournaments_count}</div>
                                <div className="text-sm text-gray-500">Torneos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pokemon-yellow">{userData.game_accounts_count}</div>
                                <div className="text-sm text-gray-500">Cuentas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function TeamsCard() {
        return (
            <div className="bg-white/80 dark:bg-slate-800 rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mis Equipos</h3>
                    <span className="px-3 py-1 bg-pokemon-blue text-white text-sm rounded-full">
                        {teams.length} equipo{teams.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tienes equipos creados aún.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {teams.map(team => (
                            <div key={team.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-lg">{team.name}</h4>
                                        {team.description && (
                                            <p className="text-gray-600 white:text-gray-300 text-sm mt-1">
                                                {team.description}
                                            </p>
                                        )}
                                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                            <span>Juego: {team.game_key}</span>
                                            <span>Estado: {team.status}</span>
                                            <span>{team.is_public ? 'Público' : 'Privado'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">
                                            Creado: {new Date(team.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="mt-2">
                                            {team.owner_user_id === userData?.user.id ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                    Propietario
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                    Miembro
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    function GameAccountsCard() {
        return (
            <div className="bg-white/80 dark:bg-slate-800 rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cuentas de Juego</h3>
                    <span className="px-3 py-1 bg-pokemon-yellow text-gray-900 text-sm rounded-full">
                        {gameAccounts.length} cuenta{gameAccounts.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {gameAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tienes cuentas de juego vinculadas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gameAccounts.map(account => (
                            <div key={account.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-pokemon-blue rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            {account.game_key.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{account.display_name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {account.platform_account_id}
                                        </p>
                                        <div className="flex gap-3 mt-2 text-xs">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {account.game_key}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {account.platform}
                                            </span>
                                            <span className={`px-2 py-1 rounded ${account.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {account.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pokemon-blue to-pokemon-yellow flex items-center justify-center">
                <div className="text-white text-xl">Cargando datos del jugador...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pokemon-blue to-pokemon-yellow text-slate-900 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                                Dashboard del Jugador
                            </h1>
                            <p className="text-sm md:text-base text-white/80">
                                Gestiona tu perfil, equipos y cuentas de juego
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={loadUserData}
                                className="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                            >
                                Recargar datos
                            </button>
                            <button className="px-4 py-2 rounded-md bg-pokemon-red hover:bg-red-600 text-white transition-colors">
                                Editar perfil
                            </button>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <ProfileCard />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TeamsCard />
                    <GameAccountsCard />
                </div>

                <footer className="mt-8 pt-6 border-t border-white/20">
                    <div className="text-center text-white/60 text-sm">
                        <p>ID de usuario: {userData?.user.id}</p>
                        <p className="mt-2">Miembro desde: {userData ? new Date(userData.user.created_at).toLocaleDateString() : ''}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}