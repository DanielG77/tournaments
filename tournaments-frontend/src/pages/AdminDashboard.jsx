import React, { useEffect, useState } from 'react';
import {
    adminTournamentsAPI,
    adminTeamsAPI,
    adminRegistrationsAPI,
    adminPlayersAPI
} from '../services/adminApi';

// AdminDashboard.jsx - panelized admin UI that uses most admin endpoints
// Single-file component for quick integration. Tailwind utility classes used.

export default function AdminDashboard() {
    // Data
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [players, setPlayers] = useState([]);

    // Local UI state
    const [loading, setLoading] = useState(false);
    const [activePanel, setActivePanel] = useState('tournaments');

    // Tournaments form state
    const [editingTournament, setEditingTournament] = useState(null);
    const [tForm, setTForm] = useState({ name: '', description: '' });

    // Team member form
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [memberToAdd, setMemberToAdd] = useState({ userId: '', role: 'member' });

    // Registrations filter
    const [regStatusFilter, setRegStatusFilter] = useState('pending');

    useEffect(() => {
        refreshAll();
    }, []);

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
            // In a real app show a toast / user-friendly message
        } finally {
            setLoading(false);
        }
    }

    // ----------------- TOURNAMENTS -----------------
    function openCreateTournament() {
        setEditingTournament(null);
        setTForm({ name: '', description: '' });
        setActivePanel('tournaments');
    }

    function openEditTournament(t) {
        setEditingTournament(t.id);
        setTForm({ name: t.name || '', description: t.description || '' });
        setActivePanel('tournaments');
    }

    async function submitTournament(e) {
        e.preventDefault();
        try {
            if (editingTournament) {
                await adminTournamentsAPI.update(editingTournament, tForm);
            } else {
                await adminTournamentsAPI.create(tForm);
            }
            await refreshAll();
            setEditingTournament(null);
            setTForm({ name: '', description: '' });
        } catch (err) {
            console.error('Error saving tournament', err);
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
        setSelectedTeam(team);
        setActivePanel('teams');
    }

    async function submitAddMember(e) {
        e.preventDefault();
        if (!selectedTeam) return;
        try {
            await adminTeamsAPI.addMember(selectedTeam.id, memberToAdd.userId, memberToAdd.role);
            // Re-fetch team list (or ideally fetch single team)
            const updatedTeams = await adminTeamsAPI.list();
            setTeams(updatedTeams || []);
            // reset
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
            const p = await adminPlayersAPI.get(id);
            alert(JSON.stringify(p, null, 2));
        } catch (err) {
            console.error('Error fetching player', err);
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
                            onClick={() => setActivePanel('tournaments')}
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
                                    <button onClick={openCreateTournament} className="px-3 py-1 rounded bg-green-600">Nuevo</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {tournaments.map(t => (
                                    <div key={t.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{t.name}</div>
                                            {t.description && <div className="text-sm text-gray-300">{t.description}</div>}
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => openEditTournament(t)} className="px-2 py-1 rounded bg-yellow-600">Editar</button>
                                            <button onClick={() => deleteTournament(t.id)} className="px-2 py-1 rounded bg-red-600">Eliminar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={submitTournament} className="mt-6 bg-gray-900 p-4 rounded">
                                <h3 className="font-semibold mb-2">{editingTournament ? 'Editar torneo' : 'Crear torneo'}</h3>
                                <input
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
                                <div className="flex gap-2">
                                    <button type="submit" className="px-3 py-1 rounded bg-blue-600">Guardar</button>
                                    {editingTournament && (
                                        <button type="button" onClick={() => { setEditingTournament(null); setTForm({ name: '', description: '' }); }} className="px-3 py-1 rounded bg-gray-700">Cancelar</button>
                                    )}
                                </div>
                            </form>
                        </section>
                    )}

                    {/* TEAMS */}
                    {activePanel === 'teams' && (
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Equipos</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {teams.map(team => (
                                    <div key={team.id} className="bg-gray-800 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">{team.name}</div>
                                                <div className="text-sm text-gray-300">ID: {team.id}</div>
                                            </div>
                                            <div className="space-x-2">
                                                <button onClick={() => openTeam(team)} className="px-2 py-1 rounded bg-blue-600">Ver</button>
                                                <button onClick={() => deactivateTeam(team.id)} className="px-2 py-1 rounded bg-red-600">Desactivar</button>
                                            </div>
                                        </div>

                                        {selectedTeam && selectedTeam.id === team.id && (
                                            <div className="mt-3 border-t border-gray-700 pt-3">
                                                <h4 className="font-semibold mb-2">Miembros</h4>
                                                <ul className="space-y-1 mb-3">
                                                    {(team.members || []).map(m => (
                                                        <li key={m.id} className="flex justify-between items-center">
                                                            <div>{m.user_name || m.user_id} <span className="text-sm text-gray-400">({m.role})</span></div>
                                                            <button onClick={() => removeMember(team.id, m.id)} className="px-2 py-1 rounded bg-red-600">Quitar</button>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <form onSubmit={submitAddMember} className="flex gap-2">
                                                    <input required placeholder="User ID" value={memberToAdd.userId} onChange={e => setMemberToAdd({ ...memberToAdd, userId: e.target.value })} className="p-2 rounded bg-gray-800" />
                                                    <select value={memberToAdd.role} onChange={e => setMemberToAdd({ ...memberToAdd, role: e.target.value })} className="p-2 rounded bg-gray-800">
                                                        <option value="member">member</option>
                                                        <option value="captain">captain</option>
                                                        <option value="coach">coach</option>
                                                    </select>
                                                    <button type="submit" className="px-3 py-1 rounded bg-green-600">Agregar</button>
                                                </form>
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
                                            <div className="font-semibold">{p.name || p.username}</div>
                                            <div className="text-sm text-gray-300">ID: {p.id}</div>
                                        </div>
                                        <div>
                                            <button onClick={() => viewPlayer(p.id)} className="px-2 py-1 rounded bg-blue-600">Ver</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </main>
            </div>
        </div>
    );
}
