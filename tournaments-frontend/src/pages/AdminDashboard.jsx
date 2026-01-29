import React, { useEffect, useState } from 'react';
import {
    adminTournamentsAPI,
    adminTeamsAPI,
    adminRegistrationsAPI,
    adminPlayersAPI
} from '../services/adminApi';

function fmtDate(d) {
    if (!d) return '';
    try {
        return new Date(d).toLocaleString();
    } catch {
        return String(d);
    }
}


export default function AdminDashboard() {
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [players, setPlayers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [activePanel, setActivePanel] = useState('tournaments');

    const [editingTournament, setEditingTournament] = useState(null);
    const [tForm, setTForm] = useState({ name: '', description: '' });

    const [selectedTeam, setSelectedTeam] = useState(null);
    const [memberToAdd, setMemberToAdd] = useState({ userId: '', role: 'member' });

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
            const p = await adminPlayersAPI.get(id);
            alert(JSON.stringify(p, null, 2));
        } catch (err) {
            console.error('Error fetching player', err);
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

                    {/* TEAMS PANEL */}
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
