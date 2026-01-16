import React, { useState } from 'react';
import { Menu, X, Gamepad2, Trophy, Bell, Search, User } from 'lucide-react';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-lol-gold to-yellow-600 rounded-full blur opacity-30"></div>
                            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-full border border-gray-700/50">
                                <Gamepad2 className="w-6 h-6 text-lol-gold" />
                            </div>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-lol-gold via-cs-orange to-pokemon-yellow bg-clip-text text-transparent">
                            GameTournaments
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#" className="text-gray-300 hover:text-lol-gold transition-colors flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Torneos
                        </a>
                        <a href="#" className="text-gray-300 hover:text-cs-orange transition-colors">
                            Clasificación
                        </a>
                        <a href="#" className="text-gray-300 hover:text-pokemon-yellow transition-colors">
                            Equipos
                        </a>
                        <a href="#" className="text-gray-300 hover:text-green-500 transition-colors">
                            Reglas
                        </a>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg transition-all duration-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Iniciar Sesión
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-800/50">
                        <div className="flex flex-col gap-4">
                            <a href="#" className="text-gray-300 hover:text-lol-gold transition-colors py-2">
                                Torneos
                            </a>
                            <a href="#" className="text-gray-300 hover:text-cs-orange transition-colors py-2">
                                Clasificación
                            </a>
                            <a href="#" className="text-gray-300 hover:text-pokemon-yellow transition-colors py-2">
                                Equipos
                            </a>
                            <a href="#" className="text-gray-300 hover:text-green-500 transition-colors py-2">
                                Reglas
                            </a>
                            <div className="pt-4 border-t border-gray-800/50 space-y-3">
                                <button className="w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center gap-2">
                                    <User className="w-4 h-4" />
                                    Iniciar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;