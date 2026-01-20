// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './contexts/TournamentContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import PlayerDashboard from './pages/PlayerDashboard';
import CoachDashboard from './pages/coach_Dashboard';

function App() {
  return (
    <BrowserRouter>
      <TournamentProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/perfil" element={<PlayerDashboard />} />
              <Route path="/coach" element={<CoachDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </TournamentProvider>
    </BrowserRouter>
  );
}

export default App;
