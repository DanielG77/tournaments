import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import Home from './pages/Home';
import TournamentDetail from './pages/TournamentDetail';
import PlayerDashboard from './pages/PlayerDashboard';
import CoachDashboard from './pages/CoachDashboard';
import CoachPlayersPage from './pages/CoachPlayersPage'; // Nueva importación
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import PokemonTeamManager from './pages/PokemonTeamManager';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <TournamentProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <Header />

            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/login" element={<Login />} />

                {/* Rutas protegidas */}
                <Route path="/perfil/:id" element={
                  <ProtectedRoute>
                    <PlayerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/coach/:id" element={
                  <ProtectedRoute role="coach">
                    <CoachDashboard />
                  </ProtectedRoute>
                } />

                {/* Nueva ruta para el listado de jugadores del coach */}
                <Route path="/coach/:id/players" element={
                  <ProtectedRoute role="coach">
                    <CoachPlayersPage />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>

            <Footer />
          </div>
        </TournamentProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;