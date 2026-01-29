import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function fetchJSON(url) {
    return fetch(url).then(async (res) => {
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || res.statusText);
        }
        return res.json();
    });
}

export default function PokemonTeamManager() {
    const { playerId, teamId } = useParams();

    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addPosition, setAddPosition] = useState(null);

    useEffect(() => {
        loadTeam();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleAdd(position) {
        setAddPosition(position);
    }

    function closeModal() {
        setAddPosition(null);
    }

    async function handleReorder(from, to) {
        setMembers(prev => {
            const updated = prev.map(m => {
                if (m.position === from) return { ...m, position: to };
                if (m.position === to) return { ...m, position: from };
                return m;
            });
            return updated;
        });

        // Persistencia en backend
        await fetch(
            `http://localhost:8000/pokemon-teams/${teamId}/reorder`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ from, to }),
            }
        );
    }


    async function loadTeam() {
        setLoading(true);
        setError("");

        try {
            const teamData = await fetchJSON(
                `http://localhost:8000/pokemon-teams/${teamId}`
            );

            const membersData = await fetchJSON(
                `http://localhost:8000/pokemon-teams/${teamId}/members`
            );

            setTeam(teamData);
            setMembers(Array.isArray(membersData) ? membersData : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Error cargando el equipo Pokémon");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                Cargando equipo Pokémon…
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{team.name}</h1>
                        <p className="text-slate-400 mt-1">
                            Gestión del equipo Pokémon
                        </p>
                    </div>

                    <Link
                        to={`/players/${playerId}`}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                        ← Volver
                    </Link>
                </div>

                {/* Slots */}
                <PokemonSlots
                    members={members}
                    onReorder={handleReorder}
                    onAdd={handleAdd}
                />
            </div>
        </div>
    );
}
