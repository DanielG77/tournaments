import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  DollarSign,
  Trophy,
  Users,
  MapPin,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTournaments } from '../contexts/TournamentContext';
import RegisterButton from '../components/tournaments/RegisterButton';

const TournamentDetail = () => {
  const { id } = useParams();
  const { getTournamentById } = useTournaments();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getTournamentById(id);
      setTournament(data);

    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = () => {
    const status = tournament?.status || (tournament?.is_active ? 'active' : 'draft');

    const statusMap = {
      draft: {
        color: 'bg-gray-600',
        text: 'Borrador',
        icon: <CheckCircle className="w-4 h-4" />
      },
      published: {
        color: 'bg-green-600',
        text: 'Publicado',
        icon: <CheckCircle className="w-4 h-4" />
      },
      ongoing: {
        color: 'bg-yellow-600',
        text: 'En Curso',
        icon: <Clock className="w-4 h-4" />
      },
      active: {
        color: 'bg-green-600',
        text: 'Activo',
        icon: <CheckCircle className="w-4 h-4" />
      },
      completed: {
        color: 'bg-blue-600',
        text: 'Completado',
        icon: <Trophy className="w-4 h-4" />
      },
      cancelled: {
        color: 'bg-red-600',
        text: 'Cancelado',
        icon: <XCircle className="w-4 h-4" />
      },
    };

    const statusInfo = statusMap[status] || statusMap.draft;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 animate-spin rounded-full border-4 border-solid border-lol-gold border-t-transparent"></div>
          <p className="text-gray-400">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-gray-400 mb-4">{error || 'Torneo no encontrado'}</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-lol-gold text-lol-blue rounded-lg">
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-lol-gold mb-8">
          <ChevronLeft className="w-5 h-5" />
          Volver a torneos
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {getStatusBadge()}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${tournament.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
              {tournament.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{tournament.name}</h1>
          <p className="text-gray-300 max-w-3xl">{tournament.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-lol-gold" />
              Detalles del Torneo
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Inicio
                </p>
                <p className="text-xl font-semibold">{formatDateTime(tournament.start_at)}</p>
              </div>

              <div>
                <p className="text-gray-400 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Fin
                </p>
                <p className="text-xl font-semibold">{formatDateTime(tournament.end_date)}</p>
              </div>

              <div>
                <p className="text-gray-400 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Ubicación
                </p>
                <p className="text-xl font-semibold">{tournament.location || 'Online'}</p>
              </div>

              <div>
                <p className="text-gray-400 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Creado
                </p>
                <p className="text-xl font-semibold">{formatDate(tournament.created_at)}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700 grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded-xl">
                <span className="text-gray-400">Precio Espectador</span>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(tournament.price_client)}
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-xl">
                <span className="text-gray-400">Precio Jugador</span>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(tournament.price_player)}
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha CONDICIONAL */}
          <div className="space-y-6">
            {tournament.is_active ? (
              <div className="bg-gradient-to-br from-lol-blue to-gray-900 rounded-2xl p-6 border border-lol-gold/20">
                <h3 className="text-xl font-bold mb-4">Unirse al Torneo</h3>
                <p className="text-gray-300 mb-6">
                  ¡Regístrate ahora para participar en este emocionante torneo!
                </p>
                <RegisterButton tournamentId={id} />
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  Evento Inactivo
                </h3>
                <p className="text-gray-300">
                  Este evento está actualmente inactivo y será recuperado más adelante.
                  <br />
                  Disculpen las molestias.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default TournamentDetail;