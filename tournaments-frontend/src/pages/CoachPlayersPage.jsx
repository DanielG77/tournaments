import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE });

export default function CoachPlayersPage() {
    const { id: coachIdParam } = useParams();
    const navigate = useNavigate();
    const [coachId, setCoachId] = useState(coachIdParam ?? '');
    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [error, setError] = useState(null);

    // Lista de jugadores
    const [playersList, setPlayersList] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [playersPagination, setPlayersPagination] = useState({
        limit: 20,
        offset: 0,
        hasMore: false
    });

    // Contratar jugador
    const [showHireModal, setShowHireModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [hiring, setHiring] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('coach_test_id') || '';
        if (saved) {
            setCoachId(saved);
            fetchTeams(saved);
            return;
        }
        if (coachIdParam) {
            setCoachId(coachIdParam);
            fetchTeams(coachIdParam);
        }
    }, []);

    const isValidCoachId = (id) => !!id && id.trim().length > 0;

    async function fetchTeams(id) {
        const cid = id ?? coachId;
        if (!isValidCoachId(cid)) return;

        setLoadingTeams(true);
        setError(null);

        try {
            const tRes = await api.get(`/coach/${cid}/teams`);
            setTeams(Array.isArray(tRes.data) ? tRes.data : (tRes.data.teams || []));
        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
        } finally {
            setLoadingTeams(false);
        }
    }

    // =========================
    //  Cargar jugadores
    // =========================
    async function loadPlayersList(reset = false) {
        if (!isValidCoachId(coachId)) {
            setError("Necesitas un coachId válido para cargar jugadores.");
            return;
        }

        setLoadingPlayers(true);
        setError(null);

        try {
            const { limit, offset } = playersPagination;
            const params = {
                limit,
                offset: reset ? 0 : offset
            };

            const res = await api.get(`/coach/${coachId}/users`, { params });

            // Actualizar lista de jugadores
            if (reset || offset === 0) {
                setPlayersList(res.data || []);
            } else {
                setPlayersList(prev => [...prev, ...(res.data || [])]);
            }

            // Actualizar paginación
            const hasMore = (res.data || []).length === limit;
            setPlayersPagination(prev => ({
                ...prev,
                offset: reset ? limit : prev.offset + limit,
                hasMore
            }));

        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
        } finally {
            setLoadingPlayers(false);
        }
    }

    // =========================
    //  Cargar más jugadores
    // =========================
    function loadMorePlayers() {
        if (playersPagination.hasMore && !loadingPlayers) {
            loadPlayersList(false);
        }
    }

    // =========================
    //  Contratar jugador
    // =========================
    async function hirePlayer() {
        if (!selectedPlayer || !selectedTeamId) return;

        setHiring(true);
        setError(null);

        try {
            await api.post(`/coach/${coachId}/teams/${selectedTeamId}/players`, {
                user_id: selectedPlayer.user_id
            });

            setShowHireModal(false);
            setSelectedPlayer(null);
            setSelectedTeamId(null);

            // Refrescar equipos para que se vea en tiempo real
            fetchTeams(coachId);

            // Mostrar mensaje de éxito
            alert(`¡${selectedPlayer.nickname || selectedPlayer.email} ha sido contratado exitosamente!`);

        } catch (err) {
            setError(err?.response?.data?.detail || err.message);
        } finally {
            setHiring(false);
        }
    }

    const handleUseCoachId = () => {
        if (!isValidCoachId(coachId)) {
            setError('Por favor, introduce un Coach ID válido.');
            return;
        }
        localStorage.setItem('coach_test_id', coachId);
        fetchTeams(coachId);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Listado de Jugadores</h1>
                    <p className="text-slate-400 mt-2">
                        Explora y contrata jugadores para tus equipos.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2">
                        <input
                            value={coachId}
                            onChange={(e) => setCoachId(e.target.value)}
                            placeholder="Coach ID (UUID)"
                            className="bg-slate-800 px-4 py-2 rounded-lg text-sm w-full sm:w-64 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                            onClick={handleUseCoachId}
                            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-700 transition whitespace-nowrap"
                        >
                            Usar ID
                        </button>
                    </div>

                    <Link
                        to={`/coach/${coachId || 'dashboard'}`}
                        className="px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition flex items-center justify-center gap-2"
                    >
                        ← Volver al Dashboard
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Controles */}
            <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Jugadores Disponibles</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {playersList.length > 0
                                ? `${playersList.length} jugadores cargados`
                                : 'Haz clic en "Cargar jugadores" para comenzar'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => loadPlayersList(true)}
                            disabled={loadingPlayers || !isValidCoachId(coachId)}
                            className="px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loadingPlayers ? (
                                <>
                                    <span className="animate-spin">⟳</span> Cargando...
                                </>
                            ) : '📋 Cargar jugadores'}
                        </button>

                        {playersList.length > 0 && (
                            <button
                                onClick={() => {
                                    setPlayersList([]);
                                    setPlayersPagination({
                                        limit: 20,
                                        offset: 0,
                                        hasMore: false
                                    });
                                }}
                                className="px-5 py-2.5 bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-600 transition"
                            >
                                🗑️ Limpiar lista
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado de jugadores */}
            {playersList.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {playersList.map((player) => (
                            <div
                                key={player.user_id}
                                className="bg-slate-800/40 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/30 p-5"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg truncate text-white">
                                            {player.nickname || 'Sin nickname'}
                                        </h3>
                                        <p className="text-sm text-slate-400 truncate mt-1">
                                            {player.email}
                                        </p>
                                    </div>

                                    {player.game_accounts?.length > 0 && (
                                        <span className="text-xs font-medium bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                                            {player.game_accounts.length} cuenta{player.game_accounts.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Cuentas de juego */}
                                {player.game_accounts && player.game_accounts.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                            Cuentas vinculadas
                                        </div>
                                        <div className="space-y-2">
                                            {player.game_accounts.slice(0, 2).map((account) => (
                                                <div
                                                    key={account.id}
                                                    className="text-xs bg-slate-900/60 p-3 rounded-lg"
                                                >
                                                    <div className="font-medium text-white flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        {account.display_name}
                                                    </div>
                                                    <div className="text-slate-400 mt-1 flex items-center gap-2">
                                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                                                            {account.game_key}
                                                        </span>
                                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                                                            {account.platform}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {player.game_accounts.length > 2 && (
                                                <div className="text-xs text-slate-500 text-center pt-1">
                                                    +{player.game_accounts.length - 2} cuenta{player.game_accounts.length - 2 !== 1 ? 's' : ''} más
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Botón de contratar */}
                                <button
                                    onClick={() => {
                                        setSelectedPlayer(player);
                                        setShowHireModal(true);
                                    }}
                                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
                                >
                                    <span>🎮</span>
                                    Contratar jugador
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Botón cargar más */}
                    {playersPagination.hasMore && (
                        <div className="mt-10 text-center">
                            <button
                                onClick={loadMorePlayers}
                                disabled={loadingPlayers}
                                className="px-8 py-3 bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingPlayers ? 'Cargando más jugadores...' : '⬇️ Cargar más jugadores'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-medium text-white mb-2">Lista de jugadores vacía</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Haz clic en "Cargar jugadores" para ver todos los jugadores disponibles para contratar.
                    </p>
                </div>
            )}

            {/* Modal de contratar */}
            {showHireModal && selectedPlayer && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 animate-slideUp">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Contratar Jugador</h3>
                                <button
                                    onClick={() => {
                                        setShowHireModal(false);
                                        setSelectedPlayer(null);
                                        setSelectedTeamId(null);
                                    }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Información del jugador */}
                            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xl">
                                        🎮
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">
                                            {selectedPlayer.nickname || 'Sin nickname'}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {selectedPlayer.email}
                                        </div>
                                    </div>
                                </div>
                                {selectedPlayer.game_accounts?.length > 0 && (
                                    <div className="text-sm text-slate-300 mt-2">
                                        Tiene {selectedPlayer.game_accounts.length} cuenta{selectedPlayer.game_accounts.length !== 1 ? 's' : ''} de juego
                                    </div>
                                )}
                            </div>

                            {/* Selección de equipo */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-white mb-3">
                                    Selecciona un equipo para contratar
                                </label>
                                <select
                                    value={selectedTeamId || ''}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                    className="w-full p-3.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="" className="text-slate-400">-- Elige un equipo --</option>
                                    {teams.map((team) => (
                                        <option
                                            key={team.id}
                                            value={team.id}
                                            className="text-white"
                                        >
                                            {team.name} ({team.players_count || 0} jugadores)
                                        </option>
                                    ))}
                                </select>

                                {teams.length === 0 && (
                                    <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                                        <p className="text-sm text-amber-400">
                                            ⚠️ No tienes equipos creados. Primero crea un equipo en tu dashboard.
                                        </p>
                                        <Link
                                            to={`/coach/${coachId}`}
                                            className="mt-2 inline-block text-sm text-amber-300 hover:text-amber-200 underline"
                                        >
                                            Ir a crear equipo →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Botones del modal */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowHireModal(false);
                                        setSelectedPlayer(null);
                                        setSelectedTeamId(null);
                                    }}
                                    className="px-5 py-2.5 rounded-lg bg-slate-700 text-sm font-medium hover:bg-slate-600 transition"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={hirePlayer}
                                    disabled={!selectedTeamId || hiring}
                                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {hiring ? (
                                        <>
                                            <span className="animate-spin">⟳</span>
                                            Contratando...
                                        </>
                                    ) : '✅ Confirmar contrato'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}