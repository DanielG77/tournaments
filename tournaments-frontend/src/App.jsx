// src/App.jsx
import React from 'react';
import { TournamentProvider } from './contexts/TournamentContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';

function App() {
  return (
    <TournamentProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Home />
        </main>
        <Footer />
      </div>
    </TournamentProvider>
  );
}

export default App;