import React, { useEffect, useState } from 'react';
import axios from 'axios';

/*
  CoachDashboard
  - Single-file component that implements a coach dashboard using the backend endpoints you provided.
  - Place this file at: src/pages/CoachDashboard.jsx
  - Integration notes (quick):
      1) Add route in App.jsx: <Route path="/coach" element={<CoachDashboard />} />
      2) Ensure VITE_API_URL is set in .env (you already have VITE_API_URL=http://localhost:8000)
         The component uses import.meta.env.VITE_API_URL if present, otherwise falls back to '/api'.
      3) Backend accepts an X-User-Id header for testing. You can set it in the small "Coach ID" input
         in the UI or leave empty to rely on backend DEFAULT_COACH_ID.
*/

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const api = axios.create({ baseURL: API_BASE });

export default function CoachDashboard() {
    const [coachId, setCoachId] = useState('');
    const [profile, setProfile] = useState(null);
    const [teams, setTeams] = useState([]);
    const [expandedTeam, setExpandedTeam] = useState(null); // team id expanded
    const [playersByTeam, setPlayersByTeam] = useState({});
    const [historyByTeam, setHistoryByTeam] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // try load a saved test coach id from localStorage to make dev easier
        const saved = localStorage.getItem('coach_test_id') || '';
        if (saved) setCoachId(saved);
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function headers() {
        // supply header only if coachId provided (backend accepts header X-User-Id)
        return coachId ? { 'X-User-Id': coachId } : {};
    }

    async function fetchAll() {
        setLoading(true);
        setError(null);
        try {
            const [pRes, tRes] = await Promise.all([
                api.get('/coach/profile', { headers: headers() }),
                api.get('/coach/teams', { headers: headers() }),
            ]);
            setProfile(pRes.data);
            setTeams(tRes.data.teams || []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.detail || err.message || 'Error fetching coach data');
        } finally {
            setLoading(false);
        }
    }

    async function fetchPlayers(teamId) {
        if (playersByTeam[teamId]) return; // cached
        try {
            const res = await api.get(`/coach/teams/${teamId}/players`, { headers: headers() });
            setPlayersByTeam((s) => ({ ...s, [teamId]: res.data.players }));
        } catch (err) {
            console.error('fetchPlayers', err);
            setError(err?.response?.data?.detail || 'Error fetching players');
        }
    }

    async function fetchHistory(teamId) {
        if (historyByTeam[teamId]) return; // cached
        try {
            const res = await api.get(`/coach/teams/${teamId}/history`, { headers: headers() });
            setHistoryByTeam((s) => ({ ...s, [teamId]: res.data.history }));
        } catch (err) {
            console.error('fetchHistory', err);
            setError(err?.response?.data?.detail || 'Error fetching history');
        }
    }

    async function handleLeaveTeam(teamId) {
        if (!confirm('¿Estás seguro que quieres abandonar (o sacar) este equipo? Esta acción es irreversible desde el frontend.')) return;
        try {
            await api.delete(`/coach/teams/${teamId}/leave`, { headers: headers() });
            // refresh teams list
            setTeams((s) => s.filter((t) => t.id !== teamId));
            // clean caches
            const newPlayers = { ...playersByTeam };
            delete newPlayers[teamId];
            setPlayersByTeam(newPlayers);
            const newHistory = { ...historyByTeam };
            delete newHistory[teamId];
            setHistoryByTeam(newHistory);
        } catch (err) {
            console.error('leaveTeam', err);
            setError(err?.response?.data?.detail || 'Could not leave team');
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
        localStorage.setItem('coach_test_id', coachId);
        fetchAll();
    }

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold">Dashboard — Coach</h1>
                <div className="flex gap-2 items-center">
                    <input
                        value={coachId}
                        onChange={(e) => setCoachId(e.target.value)}
                        placeholder="Coach test id (X-User-Id)"
                        className="bg-slate-800 px-3 py-2 rounded-md text-sm w-72"
                    />
                    <button onClick={saveCoachId} className="px-3 py-2 bg-indigo-600 rounded-md text-sm">Usar ID</button>
                    <button onClick={fetchAll} className="px-3 py-2 bg-slate-700 rounded-md text-sm">Refrescar</button>
                </div>
            </div>

            {loading && <div className="mb-4">Cargando datos...</div>}
            {error && <div className="mb-4 text-red-400">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column: profile */}
                <div className="col-span-1">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl shadow">
                        <div className="flex items-center gap-4">
                            <img
                                src={profile?.avatar_url || '/assets/default-avatar.png'}
                                alt="avatar"
                                className="w-16 h-16 rounded-full object-cover"
                            />
                            <div>
                                <div className="text-lg font-medium">{profile?.email ?? 'Coach sin nombre'}</div>
                                <div className="text-sm text-slate-400">Miembro desde: {profile?.created_at ? new Date(profile.created_at).toLocaleString() : '-'}</div>
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-slate-300">
                            Aquí verás tus equipos, jugadores, histórico y torneos.
                        </div>
                    </div>
                </div>

                {/* Right column: teams list */}
                <div className="col-span-1 md:col-span-2">
                    <div className="space-y-4">
                        {teams.length === 0 && <div className="text-slate-400">No tienes equipos aún.</div>}

                        {teams.map((team) => (
                            <div key={team.id} className="bg-slate-800 p-4 rounded-lg shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-semibold">{team.name}</h2>
                                            <span className={`px-2 py-0.5 text-xs rounded ${team.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                                                {team.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-400">Jugadores: {team.players_count ?? '-'}</div>
                                        <div className="text-sm text-slate-400">Creado: {team.created_at ? new Date(team.created_at).toLocaleDateString() : '-'}</div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleTeam(team.id)}
                                            className="px-3 py-2 bg-slate-700 rounded text-sm"
                                        >
                                            {expandedTeam === team.id ? 'Ocultar' : 'Ver jugadores / histórico'}
                                        </button>
                                        <button
                                            onClick={() => handleLeaveTeam(team.id)}
                                            className="px-3 py-2 bg-red-600 rounded text-sm"
                                        >
                                            Abandonar equipo
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {expandedTeam === team.id && (
                                    <div className="mt-4 border-t border-slate-700 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Players */}
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Jugadores</h3>
                                                <div className="space-y-2">
                                                    {playersByTeam[team.id] ? (
                                                        playersByTeam[team.id].map((p) => (
                                                            <div key={p.user_id} className="bg-slate-900 p-3 rounded flex items-start gap-3">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{p.nickname} <span className="text-slate-400 text-sm">({p.email})</span></div>
                                                                    <div className="text-sm text-slate-400 mt-1">Cuentas de juego:</div>
                                                                    <ul className="text-sm mt-1 space-y-1">
                                                                        {p.game_accounts && p.game_accounts.map((acc, idx) => (
                                                                            <li key={idx} className="text-xs">
                                                                                <strong>{acc.game_key}</strong> — {acc.platform} — {acc.display_name}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                                {/* Optional actions per player */}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-slate-400">Cargando jugadores...</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* History */}
                                            <div>
                                                <h3 className="text-lg font-medium mb-2">Histórico</h3>
                                                <div className="space-y-2">
                                                    {historyByTeam[team.id] ? (
                                                        historyByTeam[team.id].map((h) => (
                                                            <div key={h.id} className="bg-slate-900 p-3 rounded">
                                                                <div className="font-medium">{h.tournament_name}</div>
                                                                <div className="text-sm text-slate-400">Estado: {h.status}</div>
                                                                <div className="text-sm text-slate-400">Inscrito: {h.joined_at ? new Date(h.joined_at).toLocaleString() : '-'}</div>
                                                                <div className="text-sm text-slate-400">Finalizado: {h.finished_at ? new Date(h.finished_at).toLocaleString() : '-'}</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-slate-400">Cargando histórico...</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Future: tournaments list could be shown here using /teams/{team_id}/tournaments */}
                                    </div>
                                )}

                            </div>
                        ))}

                    </div>
                </div>
            </div>

            <div className="mt-8 text-sm text-slate-500">
                Nota: este dashboard usa los endpoints /coach/* expuestos por tu backend. Si quieres que use el proxy de Vite agrega base URL '/api' en lugar de VITE_API_URL.
            </div>
        </div>
    );
}
