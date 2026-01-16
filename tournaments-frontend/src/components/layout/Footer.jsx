import React from 'react';
import { Gamepad2, Trophy, Heart, Twitter, Twitch, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-t from-black to-gray-900/50 border-t border-gray-800/50 mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-full border border-gray-700/50">
                                <Gamepad2 className="w-6 h-6 text-lol-gold" />
                            </div>
                            <span className="text-xl font-bold text-white">
                                GameTournaments
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            La plataforma líder para torneos de videojuegos competitivos.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-lol-gold transition-colors">Torneos Activos</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-cs-orange transition-colors">Calendario</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-pokemon-yellow transition-colors">Equipos</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-green-500 transition-colors">Reglas</a></li>
                        </ul>
                    </div>

                    {/* Games */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Juegos</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-lol-gold transition-colors">League of Legends</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-cs-orange transition-colors">Counter Strike 2</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-pokemon-yellow transition-colors">Pokémon</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-green-500 transition-colors">Valorant</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Conéctate</h3>
                        <div className="flex gap-4 mb-6">
                            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                <Twitter className="w-5 h-5 text-blue-400" />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                <Twitch className="w-5 h-5 text-purple-400" />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                <Youtube className="w-5 h-5 text-red-400" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800/50 mt-8 pt-8 text-center">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} GameTournaments. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>Hecho con pasión por los videojuegos</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;