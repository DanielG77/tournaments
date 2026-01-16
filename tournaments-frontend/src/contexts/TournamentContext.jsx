// src/contexts/TournamentContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';

const TournamentContext = createContext();

export const useTournaments = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournaments must be used within TournamentProvider');
    }
    return context;
};

export const TournamentProvider = ({ children }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [featuredTournament, setFeaturedTournament] = useState(null);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await tournamentAPI.getAll();
            console.log('Datos recibidos de API:', data);

            setTournaments(data);

            // Encontrar el torneo destacado: primero los activos, luego los publicados
            if (data.length > 0) {
                const activeTournament = data.find(t =>
                    t.is_active && (t.status === 'published' || t.status === 'ongoing')
                ) || data[0];

                setFeaturedTournament(activeTournament);
            }

        } catch (err) {
            console.error('Error en fetchTournaments:', err);
            setError('Error al cargar los torneos. Por favor, intenta más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const getTournamentById = async (id) => {
        try {
            return await tournamentAPI.getById(id);
        } catch (err) {
            console.error('Error fetching tournament by ID:', err);
            throw err;
        }
    };

    const updateTournamentStatus = (id, status) => {
        setTournaments(prev =>
            prev.map(tournament =>
                tournament.id === id ? { ...tournament, status } : tournament
            )
        );

        if (featuredTournament?.id === id) {
            setFeaturedTournament(prev => ({ ...prev, status }));
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    const value = {
        tournaments,
        featuredTournament,
        loading,
        error,
        refreshTournaments: fetchTournaments,
        getTournamentById,
        updateTournamentStatus,
        // Filtros útiles
        publishedTournaments: tournaments.filter(t => t.status === 'published'),
        ongoingTournaments: tournaments.filter(t => t.status === 'ongoing'),
        activeTournaments: tournaments.filter(t => t.is_active),
    };

    return (
        <TournamentContext.Provider value={value}>
            {children}
        </TournamentContext.Provider>
    );
};