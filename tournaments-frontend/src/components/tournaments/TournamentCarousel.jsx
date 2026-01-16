// src/components/tournaments/TournamentCarousel.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Trophy, Zap, DollarSign, Users } from 'lucide-react';
import { useTournaments } from '../../contexts/TournamentContext';

const TournamentCarousel = () => {
    const { featuredTournament, tournaments, loading } = useTournaments();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Usar torneos activos para el carrusel
    const activeTournaments = tournaments.filter(t => t.is_active);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === activeTournaments.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? activeTournaments.length - 1 : prevIndex - 1
        );
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 5000);
    };

    useEffect(() => {
        if (!isAutoPlaying || activeTournaments.length === 0) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, isAutoPlaying, activeTournaments.length]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando torneos...</p>
            </div>
        );
    }

    if (!activeTournaments || activeTournaments.length === 0) {
        return (
            <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No hay torneos activos disponibles</p>
            </div>
        );
    }

    const currentTournament = activeTournaments[currentIndex];

    const getTournamentTheme = (tournamentName) => {
        const name = tournamentName.toLowerCase();
        if (name.includes('league') || name.includes('lol')) {
            return 'from-lol-gold/10 via-blue-900/10 to-red-900/10';
        } else if (name.includes('counter') || name.includes('cs')) {
            return 'from-cs-orange/10 via-gray-900/10 to-black/10';
        } else if (name.includes('pokémon') || name.includes('pokemon')) {
            return 'from-pokemon-red/10 via-pokemon-yellow/10 to-pokemon-blue/10';
        }
        return 'from-blue-900/10 via-purple-900/10 to-red-900/10';
    };

    return (
        <div className="relative">
            {/* Indicadores de progreso */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {activeTournaments.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 ${index === currentIndex
                            ? 'w-8 h-2 bg-gradient-to-r from-lol-gold to-yellow-500 rounded-full'
                            : 'w-2 h-2 bg-gray-600 rounded-full hover:bg-gray-500'
                            }`}
                        aria-label={`Ir al torneo ${index + 1}`}
                    />
                ))}
            </div>

            {/* Carrusel principal */}
            <div className="relative overflow-hidden rounded-2xl">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {activeTournaments.map((tournament) => {
                        const theme = getTournamentTheme(tournament.name);
                        const startDate = tournament.start_at ? new Date(tournament.start_at) : null;

                        return (
                            <div key={tournament.id} className="w-full flex-shrink-0">
                                <div className="relative">
                                    {/* Fondo con efecto de juego */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 rounded-2xl"></div>
                                    <div className={`absolute inset-0 bg-gradient-to-r ${theme} rounded-2xl`}></div>

                                    {/* Contenido */}
                                    <div className="relative p-8 md:p-12">
                                        <div className="max-w-4xl mx-auto">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                                                <span className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">
                                                    {tournament.is_active ? 'Torneo Activo' : 'Torneo Finalizado'}
                                                </span>
                                            </div>

                                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                                                {tournament.name}
                                            </h2>

                                            <p className="text-lg text-gray-300 mb-8 max-w-2xl">
                                                {tournament.description || '¡Únete al torneo más esperado de la temporada!'}
                                            </p>

                                            {/* Información detallada */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                                {startDate && (
                                                    <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
                                                        <div className="text-sm text-gray-400 mb-1">Fecha de Inicio</div>
                                                        <div className="text-xl font-bold text-white">
                                                            {startDate.toLocaleDateString('es-ES', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
                                                    <div className="text-sm text-gray-400 mb-1">Estado</div>
                                                    <div className={`text-xl font-bold ${tournament.status === 'published' ? 'text-green-500' :
                                                        tournament.status === 'ongoing' ? 'text-blue-500' :
                                                            tournament.status === 'finished' ? 'text-purple-500' : 'text-yellow-500'
                                                        }`}>
                                                        {tournament.status === 'published' ? 'Inscripciones Abiertas' :
                                                            tournament.status === 'ongoing' ? 'En Curso' :
                                                                tournament.status === 'finished' ? 'Finalizado' : 'Borrador'}
                                                    </div>
                                                </div>

                                                <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
                                                    <div className="text-sm text-gray-400 mb-1">Premio Cliente</div>
                                                    <div className="text-xl font-bold text-yellow-500 flex items-center">
                                                        <DollarSign className="w-5 h-5 mr-1" />
                                                        {tournament.price_client?.toFixed(2) || '0.00'}
                                                    </div>
                                                </div>

                                                <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
                                                    <div className="text-sm text-gray-400 mb-1">Costo Jugador</div>
                                                    <div className="text-xl font-bold text-emerald-500 flex items-center">
                                                        <Users className="w-5 h-5 mr-1" />
                                                        {tournament.price_player?.toFixed(2) || '0.00'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="flex flex-wrap gap-4">
                                                <button className="px-6 py-3 bg-gradient-to-r from-lol-gold to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-500/30 flex items-center gap-2">
                                                    <Play className="w-5 h-5" />
                                                    {tournament.status === 'published' ? 'Inscribirse Ahora' : 'Ver Detalles'}
                                                </button>
                                                <button className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold rounded-lg border border-gray-600 hover:from-gray-600 hover:to-gray-700 transition-all duration-300">
                                                    Ver Reglas
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controles de navegación */}
            {activeTournaments.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Torneo anterior"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-3 rounded-full border border-gray-700/50 transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Siguiente torneo"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            {/* Indicador de auto-play */}
            <div className="text-center mt-4">
                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    {isAutoPlaying ? '⏸️ Pausar' : '▶️ Reanudar'} auto-play
                </button>
            </div>
        </div>
    );
};

export default TournamentCarousel;