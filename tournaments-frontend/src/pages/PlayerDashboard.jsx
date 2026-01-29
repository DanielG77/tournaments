// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

/*
  Dashboard para jugadores - Siguiendo el mismo patrón que el dashboard de coach
  - ID dinámico desde URL o input
  - Guardado en localStorage
  - Peticiones con ID dinámico
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

export default function PlayerDashboard() {
    const { id: playerIdParam } = useParams();
    const [playerId, setPlayerId] = useState(playerIdParam ?? '');
    const [userData, setUserData] = useState(null);
    const [teams, setTeams] = useState([]);
    const [gameAccounts, setGameAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Crear equipo form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);

    useEffect(() => {
        // Intentar cargar playerId guardado y lanzar fetch si existe
        const saved = localStorage.getItem('player_test_id') || '';
        if (saved) {
            setPlayerId(saved);
            fetchAll(saved);
            return;
        }
        // Si no hay saved pero hay playerId en la ruta, lo usamos
        if (playerIdParam) {
            setPlayerId(playerIdParam);
            fetchAll(playerIdParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // solo mount

    function isPlayerIdValid(id = playerId) {
        return !!id && id.trim().length > 0;
    }

    // fetchAll acepta un playerId opcional para evitar race conditions
    async function fetchAll(id) {
        const idToUse = id ?? playerId;
        if (!isPlayerIdValid(idToUse)) {
            setError('Player ID required. Please enter a player id in the input and press "Usar ID".');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log(`[PlayerDashboard] fetchAll for player ${idToUse}`);

            // Cargar datos del usuario
            const userResponse = await fetchJSON(`http://localhost:8000/players/${idToUse}`);
            setUserData(userResponse);

            // Cargar equipos del usuario
            const teamsResponse = await fetchJSON(`http://localhost:8000/players/${idToUse}/teams`);
            setTeams(Array.isArray(teamsResponse) ? teamsResponse : []);

            // Cargar cuentas de juego del usuario
            const accountsResponse = await fetchJSON(`http://localhost:8000/players/${idToUse}/game-accounts`);
            setGameAccounts(Array.isArray(accountsResponse) ? accountsResponse : []);

        } catch (err) {
            console.error('fetchAll error', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail || err.message;
            setError(`Error fetching player data${status ? ` (status ${status})` : ''}: ${detail}`);
        } finally {
            setLoading(false);
        }
    }

    // --- Create team actions ---
    async function createTeam() {
        if (!isPlayerIdValid()) {
            setError('Player ID required to create a team.');
            return;
        }
        if (!newTeamName || newTeamName.trim().length < 2) {
            setError('Nombre del equipo demasiado corto.');
            return;
        }

        setCreatingTeam(true);
        setError(null);
        try {
            // TODO: Necesitarías implementar un endpoint POST para crear equipos
            // Por ahora, mostramos un mensaje de que no está implementado
            throw new Error('Endpoint para crear equipos no implementado en el backend');

            // Si tuvieras el endpoint, sería algo como:
            // const res = await fetchJSON(`http://localhost:8000/players/${playerId}/teams`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ name: newTeamName.trim() })
            // });
            // const created = res;
            // setTeams((s) => [created, ...s]);
            // setNewTeamName('');
            // setShowCreateForm(false);

        } catch (err) {
            console.error('createTeam', err);
            const detail = err?.response?.data?.detail || err.message;
            setError(`No se pudo crear el equipo: ${detail}`);
        } finally {
            setCreatingTeam(false);
        }
    }

    function savePlayerId() {
        if (!isPlayerIdValid()) {
            setError('Introduce un Player ID válido antes de guardar.');
            return;
        }
        localStorage.setItem('player_test_id', playerId);
        fetchAll(playerId);
    }

    function ProfileCard() {
        if (!userData) return null;

        return (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                        {userData.user?.avatar_url ? (
                            <img
                                src={userData.user.avatar_url}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full"
                            />
                        ) : (
                            '👤'
                        )}
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">
                            {userData.profile?.nickname || userData.user?.email?.split('@')[0] || 'Jugador'}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                            {userData.user?.email || 'No hay email'}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                            Miembro desde: {userData.user?.created_at ? new Date(userData.user.created_at).toLocaleDateString() : 'No disponible'}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-indigo-400">{userData.teams_count || 0}</div>
                            <div className="text-sm text-slate-400 mt-1">Equipos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-400">{userData.tournaments_count || 0}</div>
                            <div className="text-sm text-slate-400 mt-1">Torneos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400">{userData.game_accounts_count || 0}</div>
                            <div className="text-sm text-slate-400 mt-1">Cuentas</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function TeamsCard() {
        return (
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Mis Equipos</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Gestiona tus equipos de Pokémon
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-900/40 text-indigo-300 text-sm rounded-full">
                            {teams.length} equipo{teams.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {teams.length === 0 ? (
                        <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-slate-700">
                            <div className="text-5xl mb-4">🏆</div>
                            <h3 className="text-lg font-medium text-white mb-2">No tienes equipos aún</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Crea tu primer equipo para comenzar a armar tu equipo de Pokémon.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teams.map(team => (
                                <div key={team.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-lg text-white">{team.name}</h4>
                                            {team.description && (
                                                <p className="text-slate-400 text-sm mt-1">
                                                    {team.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                                                <span>Juego: {team.game_key || "No especificado"}</span>
                                                <span>Estado: {team.status || "Desconocido"}</span>
                                                <span>{team.is_public ? 'Público' : 'Privado'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400">
                                                Creado: {new Date(team.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="mt-2">
                                                {team.owner_user_id === playerId ? (
                                                    <span className="px-2 py-1 bg-green-900/40 text-green-300 text-xs rounded">
                                                        Propietario
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-blue-900/40 text-blue-300 text-xs rounded">
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
            </div>
        );
    }

    function GameAccountsCard() {
        return (
            <div className="bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Cuentas de Juego</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Tus cuentas vinculadas en diferentes plataformas
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 text-sm rounded-full">
                            {gameAccounts.length} cuenta{gameAccounts.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {gameAccounts.length === 0 ? (
                        <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-slate-700">
                            <div className="text-5xl mb-4">🎮</div>
                            <h3 className="text-lg font-medium text-white mb-2">No tienes cuentas de juego</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Vincula tus cuentas de juego para participar en torneos.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameAccounts.map(account => (
                                <div key={account.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {account.game_key?.charAt(0).toUpperCase() || "?"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{account.display_name || "Sin nombre"}</h4>
                                            <p className="text-sm text-slate-400 mt-1">
                                                {account.platform_account_id || "Sin ID"}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded">
                                                    {account.game_key || "Sin juego"}
                                                </span>
                                                <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded">
                                                    {account.platform || "Sin plataforma"}
                                                </span>
                                                <span className={`px-2 py-1 text-xs rounded ${account.status === 'active'
                                                    ? 'bg-green-900/40 text-green-300'
                                                    : 'bg-red-900/40 text-red-300'
                                                    }`}>
                                                    {account.status || "desconocido"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white text-xl">Cargando datos del jugador...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Dashboard — Jugador</h1>
                            <p className="text-slate-400 mt-2">
                                Gestiona tu perfil, equipos y cuentas de juego.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex gap-2">
                                <input
                                    value={playerId}
                                    onChange={(e) => setPlayerId(e.target.value)}
                                    placeholder="Player ID (UUID)"
                                    className="bg-slate-800 px-4 py-2 rounded-lg text-sm w-full sm:w-64 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                                />
                                <button
                                    onClick={savePlayerId}
                                    className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 transition whitespace-nowrap"
                                >
                                    Usar ID
                                </button>
                                <button
                                    onClick={() => fetchAll()}
                                    className="px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition whitespace-nowrap"
                                >
                                    Refrescar
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 break-words">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna izquierda - Perfil */}
                    <div className="lg:col-span-1">
                        <ProfileCard />
                    </div>

                    {/* Columna derecha - Equipos y Cuentas */}
                    <div className="lg:col-span-2 space-y-8">
                        <TeamsCard />
                        <GameAccountsCard />
                    </div>
                </div>

                <footer className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-sm text-slate-500">
                            <p>ID de usuario: {userData?.user?.id || playerId}</p>
                            <p className="mt-1">Este es tu perfil de jugador. Puedes cambiar de ID usando el input superior.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchAll()}
                                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                ⟳ Actualizar datos
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}