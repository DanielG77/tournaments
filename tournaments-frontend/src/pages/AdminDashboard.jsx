import React, { useEffect, useState, useRef } from 'react';
import {
    adminTournamentsAPI,
    adminTeamsAPI,
    adminRegistrationsAPI,
    adminPlayersAPI
} from '../services/adminApi';

// AdminDashboard.jsx - panelized admin UI that uses most admin endpoints
// Single-file component for quick integration. Tailwind utility classes used.
function fmtDate(d) {
    if (!d) return '';
    try {
        return new Date(d).toLocaleString();
    } catch {
        return String(d);
    }
}

function toLocalDatetimeInput(iso) {
    if (!iso) return '';
    try {
        const dt = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        const year = dt.getFullYear();
        const month = pad(dt.getMonth() + 1);
        const day = pad(dt.getDate());
        const hour = pad(dt.getHours());
        const minute = pad(dt.getMinutes());
        return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch {
        return '';
    }
}

export default function AdminDashboard() {
    // Data
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [players, setPlayers] = useState([]);

    // Local UI state
    const [loading, setLoading] = useState(false);
    const [activePanel, setActivePanel] = useState('tournaments');

    // Form visibility and ref
    const [showTournamentForm, setShowTournamentForm] = useState(false);
    const nameInputRef = useRef(null);

    // Tournaments form state - extended fields
    const [editingTournament, setEditingTournament] = useState(null);
    const [tForm, setTForm] = useState({
        name: '',
        description: '',
        status: 'draft',
        start_at: '',
        end_at: '',
        price_client: '',
        price_player: '',
        is_active: true
    });

    // Team member form
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [memberToAdd, setMemberToAdd] = useState({ userId: '', role: 'member' });

    // Registrations filter
    const [regStatusFilter, setRegStatusFilter] = useState('pending');

    // Player viewing/editing
    const [viewingPlayer, setViewingPlayer] = useState(null); // will hold player id when open
    const [playerForm, setPlayerForm] = useState({
        login: '',
        password: '',
        name: '',
        email: ''
    });

    useEffect(() => {
        refreshAll();
    }, []);

    useEffect(() => {
        if (showTournamentForm) {
            // focus name input for better UX
            setTimeout(() => nameInputRef.current?.focus(), 50);
        }
    }, [showTournamentForm]);

    async function refreshAll() {
        setLoading(true);
        try {
            const [tList, teamList, regList, pList] = await Promise.all([
                adminTournamentsAPI.list(),
                adminTeamsAPI.list(),
                adminRegistrationsAPI.list(regStatusFilter),
                adminPlayersAPI.list()
            ]);
            setTournaments(tList || []);
            setTeams(teamList || []);
            setRegistrations(regList || []);
            setPlayers(pList || []);
        } catch (err) {
            console.error('Error loading admin data', err);
        } finally {
            setLoading(false);
        }
    }

    // ----------------- TOURNAMENTS -----------------
    function openCreateTournament() {
        setEditingTournament(null);
        setTForm({
            name: '',
            description: '',
            status: 'draft',
            start_at: '',
            end_at: '',
            price_client: '',
            price_player: '',
            is_active: true
        });
        setShowTournamentForm(true);
        setActivePanel('tournaments');
    }

    async function openEditTournament(t) {
        setLoading(true);
        try {
            const full = await adminTournamentsAPI.get(t.id);
            if (!full) {
                console.warn('Tournament not found', t.id);
                return;
            }
            setEditingTournament(full.id);
            setTForm({
                name: full.name || '',
                description: full.description || '',
                status: full.status || 'draft',
                start_at: full.start_at ? toLocalDatetimeInput(full.start_at) : '',
                end_at: full.end_at ? toLocalDatetimeInput(full.end_at) : '',
                price_client: (full.price_client != null) ? String(full.price_client) : '',
                price_player: (full.price_player != null) ? String(full.price_player) : '',
                is_active: full.is_active == null ? true : !!full.is_active
            });
            setShowTournamentForm(true);
            setActivePanel('tournaments');
        } catch (err) {
            console.error('Error loading tournament for edit', err);
        } finally {
            setLoading(false);
        }
    }

    function cancelTournamentEdit() {
        setEditingTournament(null);
        setTForm({
            name: '',
            description: '',
            status: 'draft',
            start_at: '',
            end_at: '',
            price_client: '',
            price_player: '',
            is_active: true
        });
        setShowTournamentForm(false);
    }

    async function submitTournament(e) {
        e.preventDefault();
        try {
            const payload = {
                name: tForm.name,
                description: tForm.description || undefined,
                status: tForm.status || undefined,
                start_at: tForm.start_at ? new Date(tForm.start_at).toISOString() : undefined,
                end_at: tForm.end_at ? new Date(tForm.end_at).toISOString() : undefined,
                price_client: tForm.price_client !== '' ? Number(tForm.price_client) : undefined,
                price_player: tForm.price_player !== '' ? Number(tForm.price_player) : undefined,
                is_active: typeof tForm.is_active === 'boolean' ? tForm.is_active : undefined
            };

            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            if (editingTournament) {
                await adminTournamentsAPI.update(editingTournament, payload);
            } else {
                await adminTournamentsAPI.create(payload);
            }

            await refreshAll();
            cancelTournamentEdit();
        } catch (err) {
            console.error('Error saving tournament', err);
            console.error('Backend detail:', err.response?.data);
            alert('Error saving torneo. Revisa la consola para más información.');
        }
    }

    async function deleteTournament(id) {
        if (!confirm('¿Eliminar torneo? Esta acción es irreversible.')) return;
        try {
            await adminTournamentsAPI.delete(id);
            setTournaments(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting tournament', err);
        }
    }

    // ----------------- TEAMS -----------------
    async function openTeam(team) {
        try {
            setLoading(true);
            const fullTeam = await adminTeamsAPI.getTeam(team.id);
            if (!fullTeam) {
                console.warn('Team not found', team.id);
                setSelectedTeam(null);
            } else {
                setSelectedTeam(fullTeam);
                setActivePanel('teams');
            }
        } catch (err) {
            console.error('Error loading team detail', err);
            setSelectedTeam(null);
        } finally {
            setLoading(false);
        }
    }

    async function submitAddMember(e) {
        e.preventDefault();
        if (!selectedTeam) return;
        try {
            await adminTeamsAPI.addMember(selectedTeam.id, memberToAdd.userId, memberToAdd.role);
            const updatedTeams = await adminTeamsAPI.list();
            setTeams(updatedTeams || []);
            setMemberToAdd({ userId: '', role: 'member' });
        } catch (err) {
            console.error('Error adding member', err);
        }
    }

    async function removeMember(teamId, memberId) {
        if (!confirm('Eliminar miembro del equipo?')) return;
        try {
            await adminTeamsAPI.removeMember(teamId, memberId);
            const updatedTeams = await adminTeamsAPI.list();
            setTeams(updatedTeams || []);
        } catch (err) {
            console.error('Error removing member', err);
        }
    }

    async function deactivateTeam(id) {
        if (!confirm('Desactivar equipo?')) return;
        try {
            await adminTeamsAPI.deactivate(id);
            const updated = await adminTeamsAPI.list();
            setTeams(updated || []);
        } catch (err) {
            console.error('Error deactivating team', err);
        }
    }

    // ----------------- REGISTRATIONS -----------------
    async function changeRegistrationStatus(participantId, newStatus) {
        try {
            await adminRegistrationsAPI.changeStatus(participantId, { status: newStatus });
            const r = await adminRegistrationsAPI.list(regStatusFilter);
            setRegistrations(r || []);
        } catch (err) {
            console.error('Error changing registration status', err);
        }
    }

    async function reviewRegistration(participantId, payload) {
        try {
            await adminRegistrationsAPI.review(participantId, payload);
            const r = await adminRegistrationsAPI.list(regStatusFilter);
            setRegistrations(r || []);
        } catch (err) {
            console.error('Error reviewing registration', err);
        }
    }

    // ----------------- PLAYERS -----------------
    async function viewPlayer(id) {
        try {
            setLoading(true);
            const p = await adminPlayersAPI.get(id);

            if (!p || !p.user) return;

            console.debug("Fetched player:", p);

            const u = p.user;

            setPlayerForm({
                login: u.nickname || '',   // este será tu "username"
                password: 'Password Privada',              // vacío por seguridad
                name: u.nickname || '',    // si tienes un campo name real, cámbialo aquí
                email: u.email || ''
            });

            setViewingPlayer(id);

        } catch (err) {
            console.error("Error fetching player:", err);
        } finally {
            setLoading(false);
        }
    }

    async function updatePlayerPassword(id, newPassword) {
        console.log("Updating player password (via adminPlayersAPI):", id);
        try {
            // backend espera { password: '...' }
            const res = await adminPlayersAPI.updatePassword(id, { password: newPassword });
            // Si backend devuelve 204, res será null (success)
            return res;
        } catch (err) {
            const message = err.response?.data?.detail || err.response?.data || err.message || 'Unknown error';
            if (err.response?.status === 401) throw new Error('UNAUTHORIZED');
            throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
        }
    }


    function closePlayerForm() {
        setViewingPlayer(null);
        setPlayerForm({ login: '', password: '', name: '', email: '' });
    }

    async function submitPlayerForm(e) {
        e.preventDefault();
        if (!viewingPlayer) return;

        try {
            setLoading(true);

            // Solo actualizamos la contraseña si se ha ingresado
            const wantToChangePassword =
                playerForm.password && playerForm.password.length > 0;

            if (!wantToChangePassword) {
                alert("No se ha ingresado nueva contraseña, nada que actualizar.");
                return;
            }

            // Validación mínima
            if (playerForm.password.length < 8) {
                throw new Error('La contraseña debe tener al menos 8 caracteres');
            }

            await updatePlayerPassword(viewingPlayer, playerForm.password);

            alert("Contraseña actualizada correctamente.");
            await refreshAll();
            closePlayerForm();

        } catch (err) {
            console.error("Error updating player password:", err);
            if (err.message === "UNAUTHORIZED") {
                alert("No autorizado. Por favor, inicie sesión nuevamente como administrador.");
            } else {
                alert("Error actualizando la contraseña: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }
    async function handleChangeMemberStatus(teamId, userId, newStatus) {
        if (!confirm(`¿Cambiar estado del miembro a ${newStatus}?`)) return;

        try {
            setLoading(true);
            await adminTeamsAPI.updateMemberStatus(teamId, userId, newStatus);

            if (selectedTeam && selectedTeam.id === teamId) {
                const fullTeam = await adminTeamsAPI.getTeam(teamId);
                setSelectedTeam(fullTeam || null);
            }

            const updatedTeams = await adminTeamsAPI.list();
            setTeams(updatedTeams || []);
        } catch (err) {
            console.error('Error updating member status', err);
        } finally {
            setLoading(false);
        }
    }

    // ----------------- UI -----------------
    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <aside className="col-span-1 bg-gray-900 p-4 rounded">
                    <nav className="space-y-2">
                        <button
                            onClick={() => { setActivePanel('tournaments'); setShowTournamentForm(false); }}
                            className={`w-full text-left p-2 rounded ${activePanel === 'tournaments' ? 'bg-gray-700' : ''}`}>
                            Torneos
                        </button>
                        <button
                            onClick={() => setActivePanel('teams')}
                            className={`w-full text-left p-2 rounded ${activePanel === 'teams' ? 'bg-gray-700' : ''}`}>
                            Equipos
                        </button>
                        <button
                            onClick={() => setActivePanel('registrations')}
                            className={`w-full text-left p-2 rounded ${activePanel === 'registrations' ? 'bg-gray-700' : ''}`}>
                            Inscripciones
                        </button>
                        <button
                            onClick={() => setActivePanel('players')}
                            className={`w-full text-left p-2 rounded ${activePanel === 'players' ? 'bg-gray-700' : ''}`}>
                            Jugadores
                        </button>
                        <button onClick={refreshAll} className="w-full text-left p-2 rounded bg-gray-800">Refrescar</button>
                    </nav>
                </aside>

                <main className="col-span-3">
                    {loading && <div className="mb-4">Cargando...</div>}

                    {/* TOURNAMENTS */}
                    {activePanel === 'tournaments' && (
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Torneos</h2>
                                <div>
                                    {!showTournamentForm && (
                                        <button onClick={openCreateTournament} className="px-3 py-1 rounded bg-green-600">Nuevo</button>
                                    )}
                                </div>
                            </div>

                            {!showTournamentForm && (
                                <div className="grid grid-cols-1 gap-3">
                                    {tournaments.map(t => (
                                        <div key={t.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold">{t.name}</div>
                                                {t.description && <div className="text-sm text-gray-300">{t.description}</div>}
                                                <div className="text-xs text-gray-400">Status: {t.status} • {fmtDate(t.start_at)}</div>
                                            </div>
                                            <div className="space-x-2">
                                                <button onClick={() => openEditTournament(t)} className="px-2 py-1 rounded bg-yellow-600">Editar</button>
                                                <button onClick={() => deleteTournament(t.id)} className="px-2 py-1 rounded bg-red-600">Eliminar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showTournamentForm && (
                                <div className="max-w-2xl mx-auto mt-6">
                                    <form onSubmit={submitTournament} className="bg-gray-900 p-6 rounded shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-lg">{editingTournament ? `Estás editando: ${tForm.name || ''}` : 'Crear torneo'}</h3>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={cancelTournamentEdit} className="px-3 py-1 rounded bg-gray-700">Cancelar</button>
                                            </div>
                                        </div>

                                        <input
                                            ref={nameInputRef}
                                            required
                                            placeholder="Nombre"
                                            value={tForm.name}
                                            onChange={e => setTForm({ ...tForm, name: e.target.value })}
                                            className="w-full mb-2 p-2 rounded bg-gray-800"
                                        />

                                        <textarea
                                            placeholder="Descripción (opcional)"
                                            value={tForm.description}
                                            onChange={e => setTForm({ ...tForm, description: e.target.value })}
                                            className="w-full mb-2 p-2 rounded bg-gray-800"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm text-gray-300">Precio cliente</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={tForm.price_client}
                                                    onChange={e => setTForm({ ...tForm, price_client: e.target.value })}
                                                    className="p-2 rounded bg-gray-800 border border-gray-700"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm text-gray-300">Precio jugador</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={tForm.price_player}
                                                    onChange={e => setTForm({ ...tForm, price_player: e.target.value })}
                                                    className="p-2 rounded bg-gray-800 border border-gray-700"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm text-gray-300">Estado</label>
                                                <label className="flex items-center gap-2 p-2 rounded bg-gray-800 border border-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!tForm.is_active}
                                                        onChange={e => setTForm({ ...tForm, is_active: e.target.checked })}
                                                    />
                                                    <span className="text-sm">Activo</span>
                                                </label>
                                            </div>
                                        </div>


                                        <div className="flex gap-2 justify-end">
                                            <button type="submit" className="px-3 py-1 rounded bg-blue-600">Guardar</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </section>
                    )}

                    {activePanel === 'teams' && (
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Equipos</h2>
                            </div>

                            <div className="space-y-3">
                                {teams.length === 0 && <div className="text-gray-300">No hay equipos.</div>}
                                {teams.map(team => (
                                    <div key={team.id} className="bg-gray-800 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{team.name}</div>
                                                <div className="text-sm text-gray-400">{team.id}</div>
                                            </div>

                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => openTeam(team)}
                                                    className="px-2 py-1 bg-blue-600 rounded"
                                                >
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={() => deactivateTeam(team.id)}
                                                    className="px-2 py-1 bg-red-600 rounded"
                                                >
                                                    Desactivar
                                                </button>
                                            </div>
                                        </div>

                                        {/* MEMBERS LIST - only visible if selectedTeam matches */}
                                        {selectedTeam?.id === team.id && (
                                            <div className="mt-4 border-t border-gray-700 pt-3">
                                                <h4 className="font-semibold mb-2">
                                                    Miembros ({selectedTeam.members?.length || 0})
                                                </h4>

                                                {(selectedTeam.members && selectedTeam.members.length > 0) ? (
                                                    <ul className="space-y-2">
                                                        {selectedTeam.members.map(m => (
                                                            <li key={m.user_id} className="flex justify-between items-center">
                                                                <div>
                                                                    <div className="font-medium">{m.user_name || m.user_id}</div>
                                                                    <div className="text-sm text-gray-400">Role: {m.role || 'member'}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Joined: {fmtDate(m.joined_at)} {m.left_at ? ` — Left: ${fmtDate(m.left_at)}` : ''}
                                                                    </div>
                                                                    {m.requested_at && <div className="text-xs text-gray-400">Requested: {fmtDate(m.requested_at)}</div>}
                                                                    <div className="text-xs text-gray-500">Estado: {m.status}</div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    {/* only show accept/reject when pending */}
                                                                    {m.status === 'pending' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleChangeMemberStatus(team.id, m.user_id, 'active')}
                                                                                className="px-2 py-1 bg-green-600 rounded"
                                                                            >
                                                                                Aceptar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleChangeMemberStatus(team.id, m.user_id, 'rejected')}
                                                                                className="px-2 py-1 bg-red-600 rounded"
                                                                            >
                                                                                Rechazar
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {/* show remove always */}
                                                                    <button
                                                                        onClick={() => removeMember(team.id, m.user_id)}
                                                                        className="px-2 py-1 bg-gray-700 rounded"
                                                                    >
                                                                        Quitar
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-sm text-gray-300">No hay miembros en este equipo.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* REGISTRATIONS */}
                    {activePanel === 'registrations' && (
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xl font-semibold">Inscripciones</h2>
                                <div className="flex gap-2 items-center">
                                    <label className="text-sm">Estado:</label>
                                    <select value={regStatusFilter} onChange={e => { setRegStatusFilter(e.target.value); adminRegistrationsAPI.list(e.target.value).then(setRegistrations); }} className="p-2 rounded bg-gray-800">
                                        <option value="pending">pending</option>
                                        <option value="approved">approved</option>
                                        <option value="rejected">rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {registrations.map(r => (
                                    <div key={r.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{r.participant_name || r.participant_id}</div>
                                            <div className="text-sm text-gray-300">Estado: {r.status}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => reviewRegistration(r.participant_id || r.id, { approved: true })} className="px-2 py-1 rounded bg-green-600">Revisar ✓</button>
                                            <button onClick={() => changeRegistrationStatus(r.participant_id || r.id, 'rejected')} className="px-2 py-1 rounded bg-red-600">Rechazar</button>
                                            <button onClick={() => changeRegistrationStatus(r.participant_id || r.id, 'approved')} className="px-2 py-1 rounded bg-blue-600">Aprobar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* PLAYERS */}
                    {activePanel === 'players' && (
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Jugadores</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {players.map(p => (
                                    <div key={p.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                                        <div>
                                            {/* Show nickname if available, else email/id */}
                                            <div className="font-semibold">{p.nickname || p.email || p.id}</div>
                                            <div className="text-sm text-gray-300">Email: {p.email}</div>
                                            <div className="text-xs text-gray-500">ID: {p.id}</div>
                                        </div>
                                        <div>
                                            <button onClick={() => viewPlayer(p.id)} className="px-2 py-1 rounded bg-blue-600">Editar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Player modal/form */}
                            {viewingPlayer && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-black opacity-50" onClick={closePlayerForm} />

                                    <form onSubmit={submitPlayerForm} className="relative z-10 w-full max-w-md bg-gray-900 p-6 rounded shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-lg">Editar jugador</h3>
                                            <button type="button" onClick={closePlayerForm} className="px-2 py-1 rounded bg-gray-700">Cerrar</button>
                                        </div>

                                        <label className="text-sm text-gray-300">Nombre</label>
                                        <input
                                            value={playerForm.name}
                                            onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                                            className="w-full mb-2 p-2 rounded bg-gray-800"
                                        />

                                        <label className="text-sm text-gray-300">Email</label>
                                        <input
                                            type="email"
                                            value={playerForm.email}
                                            onChange={e => setPlayerForm({ ...playerForm, email: e.target.value })}
                                            className="w-full mb-2 p-2 rounded bg-gray-800"
                                        />

                                        <label className="text-sm text-gray-300">Login</label>
                                        <input
                                            value={playerForm.login}
                                            onChange={e => setPlayerForm({ ...playerForm, login: e.target.value })}
                                            className="w-full mb-2 p-2 rounded bg-gray-800"
                                        />

                                        <label className="text-sm text-gray-300">Password (dejar en blanco para no cambiar)</label>
                                        <input
                                            type="password"
                                            value={playerForm.password}
                                            onChange={e => setPlayerForm({ ...playerForm, password: e.target.value })}
                                            className="w-full mb-4 p-2 rounded bg-gray-800"
                                        />

                                        <div className="flex gap-2 justify-end">
                                            <button type="button" onClick={closePlayerForm} className="px-3 py-1 rounded bg-gray-700">Cancelar</button>
                                            <button type="submit" className="px-3 py-1 rounded bg-green-600">Guardar</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
