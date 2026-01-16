// src/pages/Home.jsx
import React from 'react';
import { useTournaments } from '../contexts/TournamentContext';
import TournamentCarousel from '../components/tournaments/TournamentCarousel';
import TournamentCard from '../components/tournaments/TournamentCard';

const Home = () => {
    const {
        tournaments,
        loading,
        error,
        publishedTournaments,
        ongoingTournaments,
        activeTournaments
    } = useTournaments();

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Cargando torneos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Carrusel principal */}
            <section>
                <h2 className="text-3xl font-bold mb-6 text-white">
                    <span className="bg-gradient-to-r from-lol-gold to-yellow-500 bg-clip-text text-transparent">
                        Torneos Destacados
                    </span>
                </h2>
                <TournamentCarousel />
            </section>

            {/* Torneos con Inscripciones Abiertas */}
            {publishedTournaments.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mr-2">
                            Inscripciones Abiertas
                        </span>
                        <span className="text-sm text-gray-400">({publishedTournaments.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publishedTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                </section>
            )}

            {/* Torneos en Curso */}
            {ongoingTournaments.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mr-2">
                            En Curso
                        </span>
                        <span className="text-sm text-gray-400">({ongoingTournaments.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoingTournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </div>
                </section>
            )}

            {/* Todos los Torneos */}
            <section>
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mr-2">
                        Todos los Torneos
                    </span>
                    <span className="text-sm text-gray-400">({tournaments.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;