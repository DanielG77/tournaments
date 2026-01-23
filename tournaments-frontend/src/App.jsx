// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/common/ProtectedRoute'; // Importar ProtectedRoute

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import Home from './pages/Home';
import PlayerDashboard from './pages/PlayerDashboard';
import CoachDashboard from './pages/coach_Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login'; // Crear esta página
// import Home from './pages/Home';
// import PlayerDashboard from './pages/PlayerDashboard';
// import CoachDashboard from './pages/coach_Dashboard';
// import AdminDashboard from './pages/AdminDashboard'; // ⬅️ NUEVO
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
                <Route path="/login" element={<Login />} />
                {/* <Route path="/register" element={<Register />} /> */}

                {/* Rutas protegidas */}
                <Route path="/perfil" element={
                  <ProtectedRoute>
                    <PlayerDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/coach" element={
                  <ProtectedRoute role="coach">
                    <CoachDashboard />
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