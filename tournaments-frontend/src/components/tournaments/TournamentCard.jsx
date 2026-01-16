// src/components/tournaments/TournamentCard.jsx
import React from 'react';
import { Trophy, Calendar, Users, Clock, Gamepad2, DollarSign } from 'lucide-react';
import { useTournaments } from '../../contexts/TournamentContext';

const getStatusColor = (status) => {
    switch (status) {
        case 'published':
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'ongoing':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'finished':
            return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'draft':
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default:
            return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'published': return 'Inscripciones Abiertas';
        case 'ongoing': return 'En Curso';
        case 'finished': return 'Finalizado';
        case 'draft': return 'Borrador';
        default: return status || 'Desconocido';
    }
};

const getGameTheme = (tournamentName) => {
    const name = tournamentName.toLowerCase();
    if (name.includes('league') || name.includes('lol')) {
        return {
            gradient: 'from-lol-gold/10 to-lol-blue/20',
            border: 'border-lol-gold/30',
            accent: 'text-lol-gold',
            glow: 'from-lol-gold via-cs-orange to-pokemon-yellow',
        };
    } else if (name.includes('counter') || name.includes('cs')) {
        return {
            gradient: 'from-cs-orange/10 to-cs-dark/20',
            border: 'border-cs-orange/30',
            accent: 'text-cs-orange',
            glow: 'from-cs-orange via-lol-gold to-pokemon-yellow',
        };
    } else if (name.includes('pokémon') || name.includes('pokemon')) {
        return {
            gradient: 'from-pokemon-red/10 to-pokemon-blue/20',
            border: 'border-pokemon-yellow/30',
            accent: 'text-pokemon-yellow',
            glow: 'from-pokemon-red via-cs-orange to-lol-gold',
        };
    } else if (name.includes('valorant')) {
        return {
            gradient: 'from-red-500/10 to-black/20',
            border: 'border-red-500/30',
            accent: 'text-red-500',
            glow: 'from-red-500 via-purple-500 to-pink-500',
        };
    }
    return {
        gradient: 'from-gray-700/10 to-gray-800/20',
        border: 'border-gray-600/30',
        accent: 'text-gray-300',
        glow: 'from-gray-600 via-gray-500 to-gray-400',
    };
};

const TournamentCard = ({ tournament }) => {
    const { updateTournamentStatus } = useTournaments();
    const theme = getGameTheme(tournament.name);

    // Formatear fechas
    const startDate = tournament.start_at ? new Date(tournament.start_at) : null;
    const endDate = tournament.end_at ? new Date(tournament.end_at) : null;
    const isActive = tournament.is_active;

    // Manejar clic en botón
    const handleButtonClick = () => {
        if (tournament.status === 'published') {
            // Lógica para inscripción
            console.log('Inscribirse al torneo:', tournament.id);
        } else if (tournament.status === 'draft') {
            // Cambiar de borrador a publicado (esto sería mejor en un admin panel)
            updateTournamentStatus(tournament.id, 'published');
        }
    };

    return (
        <div className="group relative">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${theme.glow} rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>

            <div className={`relative bg-gradient-to-br ${theme.gradient} backdrop-blur-sm rounded-xl p-6 border ${theme.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/10`}>

                {/* Estado y Activo */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className={`w-5 h-5 ${theme.accent}`} />
                            <h3 className="text-xl font-bold text-white truncate">{tournament.name}</h3>
                            {!isActive && (
                                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                                    Inactivo
                                </span>
                            )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tournament.status)}`}>
                            {getStatusText(tournament.status)}
                        </span>
                    </div>
                    <Gamepad2 className="w-8 h-8 text-gray-500" />
                </div>

                {/* Descripción */}
                <p className="text-gray-300 mb-6 line-clamp-2">
                    {tournament.description || 'Torneo de videojuegos competitivo'}
                </p>

                {/* Información del Torneo */}
                <div className="space-y-3 mb-4">
                    {startDate && (
                        <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                                Inicia: {startDate.toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )}

                    {endDate && tournament.status === 'ongoing' && (
                        <div className="flex items-center text-sm text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>
                                Finaliza: {endDate.toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    )}

                    {/* Precios */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-black/20 p-3 rounded-lg">
                            <div className="flex items-center text-sm text-gray-400 mb-1">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span>Cliente</span>
                            </div>
                            <div className="text-lg font-bold text-white">
                                ${tournament.price_client?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg">
                            <div className="flex items-center text-sm text-gray-400 mb-1">
                                <Users className="w-4 h-4 mr-1" />
                                <span>Jugador</span>
                            </div>
                            <div className="text-lg font-bold text-white">
                                ${tournament.price_player?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="mt-6 pt-6 border-t border-gray-700/50 flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                            Creado: {new Date(tournament.created_at).toLocaleDateString('es-ES')}
                        </span>
                    </div>

                    <button
                        onClick={handleButtonClick}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${tournament.status === 'published'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500'
                            : tournament.status === 'draft'
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500'
                                : tournament.status === 'ongoing'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-400 hover:to-cyan-500'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {tournament.status === 'published' ? 'Inscribirse' :
                            tournament.status === 'draft' ? 'Publicar' :
                                tournament.status === 'ongoing' ? 'Ver Partidas' : 'Ver Resultados'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TournamentCard;