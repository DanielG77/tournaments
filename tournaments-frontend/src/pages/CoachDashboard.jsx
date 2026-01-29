import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const api = axios.create({ baseURL: API_BASE });

export default function CoachDashboard() {
    const { id: coachIdParam } = useParams();
    const [coachId, setCoachId] = useState(coachIdParam ?? '');
    const [profile, setProfile] = useState(null);
    const [teams, setTeams] = useState([]);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [playersByTeam, setPlayersByTeam] = useState({});
    const [historyByTeam, setHistoryByTeam] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Crear equipo form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [creatingTeam, setCreatingTeam] = useState(false);

    useEffect(() => {
        // intentar cargar coachId guardado y lanzar fetch si existe
        const saved = localStorage.getItem('coach_test_id') || '';
        if (saved) {
            setCoachId(saved);
            fetchAll(saved);
            return;
        }
        // si no hay saved pero hay coachId en la ruta, lo usamos
        if (coachIdParam) {
            setCoachId(coachIdParam);
            fetchAll(coachIdParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // solo mount

    function isCoachIdValid(id = coachId) {
        return !!id && id.trim().length > 0;
    }

    // fetchAll acepta un coachId opcional para evitar race conditions
    async function fetchAll(id) {
        const idToUse = id ?? coachId;
        if (!isCoachIdValid(idToUse)) {
            setError('Coach ID required. Please enter a coach id in the input and press "Usar ID".');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log(`[CoachDashboard] fetchAll for coach ${idToUse}`);
            const [pRes, tRes] = await Promise.all([
                api.get(`/coach/${idToUse}/profile`),
                api.get(`/coach/${idToUse}/teams`)
            ]);
            setProfile(pRes.data);
            setTeams(Array.isArray(tRes.data) ? tRes.data : (tRes.data.teams || []));
        } catch (err) {
            console.error('fetchAll error', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail || err.message;
            setError(`Error fetching coach data${status ? ` (status ${status})` : ''}: ${detail}`);
        } finally {
            setLoading(false);
        }
    }

    async function fetchPlayers(teamId) {
        if (!isCoachIdValid()) {
            setError('Coach ID required to fetch players.');
            return;
        }
        if (playersByTeam[teamId]) return; // cached

        try {
            console.log(`[CoachDashboard] fetchPlayers team=${teamId} coach=${coachId}`);
            const res = await api.get(`/coach/${coachId}/teams/${teamId}/players`);
            setPlayersByTeam((s) => ({ ...s, [teamId]: res.data.players }));
        } catch (err) {
            console.error('fetchPlayers', err);
            const detail = err?.response?.data?.detail || err.message;
            setError(`Error fetching players: ${detail}`);
        }
    }

    async function fetchHistory(teamId) {
        if (!isCoachIdValid()) {
            setError('Coach ID required to fetch history.');
            return;
        }
        if (historyByTeam[teamId]) return;

        try {
            console.log(`[CoachDashboard] fetchHistory team=${teamId} coach=${coachId}`);
            const res = await api.get(`/coach/${coachId}/teams/${teamId}/history`);
            setHistoryByTeam((s) => ({ ...s, [teamId]: res.data.history }));
        } catch (err) {
            console.error('fetchHistory', err);
            const detail = err?.response?.data?.detail || err.message;
            setError(`Error fetching history: ${detail}`);
        }
    }

    async function handleLeaveTeam(teamId) {
        if (!isCoachIdValid()) {
            setError('Coach ID required to leave team.');
            return;
        }
        if (!confirm('¿Estás seguro que quieres abandonar (o sacar) este equipo? Esta acción es irreversible desde el frontend.')) return;

        try {
            console.log(`[CoachDashboard] leaveTeam team=${teamId} coach=${coachId}`);
            await api.delete(`/coach/${coachId}/teams/${teamId}/leave`);
            setTeams((s) => s.filter((t) => t.id !== teamId));
            const newPlayers = { ...playersByTeam }; delete newPlayers[teamId]; setPlayersByTeam(newPlayers);
            const newHistory = { ...historyByTeam }; delete newHistory[teamId]; setHistoryByTeam(newHistory);
        } catch (err) {
            console.error('leaveTeam', err);
            const detail = err?.response?.data?.detail || err.message;
            setError(`Could not leave team: ${detail}`);
        }
    }

    function toggleTeam(teamId) {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
            return;
        }
        setExpandedTeam(teamId);
        fetchPlayers(teamId);
        fetchHistory(teamId);
    }

    function saveCoachId() {
        if (!isCoachIdValid()) {
            setError('Introduce un Coach ID válido antes de guardar.');
            return;
        }
        localStorage.setItem('coach_test_id', coachId);
        fetchAll(coachId);
    }

    // --- Create team actions ---
    async function createTeam() {
        if (!isCoachIdValid()) {
            setError('Coach ID required to create a team.');
            return;
        }
        if (!newTeamName || newTeamName.trim().length < 2) {
            setError('Nombre del equipo demasiado corto.');
            return;
        }

        setCreatingTeam(true);
        setError(null);
        try {
            const res = await api.post(`/coach/${coachId}/teams`, { name: newTeamName.trim() });
            const created = res.data;
            setTeams((s) => [created, ...s]);
            setNewTeamName('');
            setShowCreateForm(false);
        } catch (err) {
            console.error('createTeam', err);
            const detail = err?.response?.data?.detail || err.message;
            setError(`No se pudo crear el equipo: ${detail}`);
        } finally {
            setCreatingTeam(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard — Coach</h1>
                    <p className="text-slate-400 mt-2">
                        Gestiona tus equipos, jugadores y torneos.
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
                            onClick={saveCoachId}
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

                    <Link
                        to={`/coach/${coachId || 'dashboard'}/players`}
                        className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        📋 Ver listado de jugadores
                    </Link>
                </div>
            </div>

            {loading && (
                <div className="mb-6 p-4 bg-slate-800/30 rounded-lg text-center">
                    Cargando datos...
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 break-words">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna izquierda - Perfil */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white">
                                    {profile?.email?.split('@')[0] || 'Coach'}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">
                                    {profile?.email || 'No hay email'}
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                    Miembro desde: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'No disponible'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Tus equipos</h3>
                                <span className="text-sm bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded-full">
                                    {teams.length} equipo{teams.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => { setShowCreateForm((s) => !s); setError(null); }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
                                >
                                    <span>➕</span>
                                    {showCreateForm ? 'Cerrar formulario' : 'Crear nuevo equipo'}
                                </button>

                                {showCreateForm && (
                                    <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700 animate-slideDown">
                                        <label className="block text-sm font-medium text-white mb-3">Nombre del equipo</label>
                                        <input
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-green-500 focus:outline-none mb-4"
                                            placeholder="Escribe un nombre para el equipo"
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => { setShowCreateForm(false); setNewTeamName(''); }}
                                                className="px-4 py-2 rounded-lg bg-slate-700 text-sm font-medium hover:bg-slate-600 transition"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={createTeam}
                                                disabled={creatingTeam || !newTeamName.trim()}
                                                className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {creatingTeam ? 'Creando...' : 'Crear equipo'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha - Lista de equipos */}
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        {teams.length === 0 ? (
                            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700">
                                <div className="text-5xl mb-4">🏆</div>
                                <h3 className="text-xl font-medium text-white mb-2">No tienes equipos aún</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-6">
                                    Crea tu primer equipo para comenzar a gestionar jugadores y participar en torneos.
                                </p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition"
                                >
                                    Crear mi primer equipo
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold text-white">Mis equipos</h2>
                                    <div className="text-sm text-slate-400">
                                        {teams.length} equipo{teams.length !== 1 ? 's' : ''} creado{teams.length !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {teams.map((team) => (
                                    <div key={team.id} className="bg-slate-800/40 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300">
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <h2 className="text-xl font-bold text-white">{team.name}</h2>
                                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${team.is_active ? 'bg-green-900/40 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                                                            {team.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <span>👥</span>
                                                            <span>{team.players_count || 0} jugadores</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span>📅</span>
                                                            <span>Creado: {team.created_at ? new Date(team.created_at).toLocaleDateString() : '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    <button
                                                        onClick={() => toggleTeam(team.id)}
                                                        className="px-4 py-2.5 bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-600 transition flex items-center gap-2"
                                                    >
                                                        {expandedTeam === team.id ? ' Ocultar' : ' Ver detalles'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveTeam(team.id)}
                                                        className="px-4 py-2.5 bg-red-900/40 text-red-300 rounded-lg text-sm font-medium hover:bg-red-800/40 transition flex items-center gap-2"
                                                    >
                                                        Abandonar
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedTeam === team.id && (
                                                <div className="mt-6 pt-6 border-t border-slate-700">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {/* Jugadores del equipo */}
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                                <span>👥</span>
                                                                Jugadores del equipo
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {playersByTeam[team.id] ? (
                                                                    playersByTeam[team.id].length > 0 ? (
                                                                        playersByTeam[team.id].map((player) => (
                                                                            <div key={player.user_id} className="bg-slate-900/60 p-4 rounded-xl">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="flex-1">
                                                                                        <div className="font-medium text-white">{player.nickname}</div>
                                                                                        <div className="text-sm text-slate-400 mt-1">{player.email}</div>
                                                                                        {player.game_accounts && player.game_accounts.length > 0 && (
                                                                                            <div className="mt-3">
                                                                                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                                                                                    Cuentas de juego
                                                                                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    {player.game_accounts.map((account, idx) => (
                                                                                                        <div key={idx} className="text-xs bg-slate-800 p-2 rounded">
                                                                                                            <div className="font-medium">{account.display_name}</div>
                                                                                                            <div className="text-slate-400">
                                                                                                                {account.game_key} • {account.platform}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-8 bg-slate-900/30 rounded-xl">
                                                                            <div className="text-4xl mb-3">🎮</div>
                                                                            <p className="text-slate-400">Este equipo no tiene jugadores aún</p>
                                                                            <p className="text-sm text-slate-500 mt-2">
                                                                                Ve al listado de jugadores para contratar
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <div className="animate-spin text-slate-400 text-2xl mb-3">⟳</div>
                                                                        <p className="text-slate-400">Cargando jugadores...</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Histórico del equipo */}
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                                <span>📜</span>
                                                                Histórico de torneos
                                                            </h3>
                                                            <div className="space-y-3">
                                                                {historyByTeam[team.id] ? (
                                                                    historyByTeam[team.id].length > 0 ? (
                                                                        historyByTeam[team.id].map((history) => (
                                                                            <div key={history.id} className="bg-slate-900/60 p-4 rounded-xl">
                                                                                <div className="font-bold text-white">{history.tournament_name}</div>
                                                                                <div className="flex items-center gap-3 mt-2">
                                                                                    <span className={`px-2 py-1 text-xs rounded ${history.status === 'finished' ? 'bg-green-900/40 text-green-300' : 'bg-blue-900/40 text-blue-300'}`}>
                                                                                        {history.status}
                                                                                    </span>
                                                                                    <span className="text-xs text-slate-400">
                                                                                        Inscrito: {history.joined_at ? new Date(history.joined_at).toLocaleDateString() : '-'}
                                                                                    </span>
                                                                                </div>
                                                                                {history.finished_at && (
                                                                                    <div className="text-xs text-slate-400 mt-2">
                                                                                        Finalizado: {new Date(history.finished_at).toLocaleDateString()}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-8 bg-slate-900/30 rounded-xl">
                                                                            <div className="text-4xl mb-3">🏆</div>
                                                                            <p className="text-slate-400">No hay histórico de torneos</p>
                                                                            <p className="text-sm text-slate-500 mt-2">
                                                                                Este equipo no ha participado en torneos aún
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <div className="animate-spin text-slate-400 text-2xl mb-3">⟳</div>
                                                                        <p className="text-slate-400">Cargando histórico...</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-sm text-slate-500">
                        <p>Este es tu perfil esperamos serte de ayuda en todo lo que necesites.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to={`/coach/${coachId || 'dashboard'}/players`}
                            className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            Explorar jugadores
                        </Link>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2"
                        >
                            ➕ Crear equipo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}