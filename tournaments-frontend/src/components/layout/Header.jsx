import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Gamepad2, Bell, Search, User, LogOut } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { authAPI } from '../../services/api';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { user, loading, logout } = useUser();

    useEffect(() => {
        if (!user) {
            setIsMenuOpen(false);
        }
    }, [user]);

    // const handleLogout = async () => {
    //     try {
    //         await authAPI.logout();
    //         navigate('/login');

    //     } finally {
    //         navigate('/login');
    //     }
    // };
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-lol-gold to-yellow-600 rounded-full blur opacity-30"></div>
                            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-full border border-gray-700/50">
                                <Gamepad2 className="w-6 h-6 text-lol-gold" />
                            </div>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-lol-gold via-cs-orange to-pokemon-yellow bg-clip-text text-transparent">
                            GameTournaments
                        </span>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* NEW: show Login link on desktop when user is NOT logged in */}
                        {!loading && !user && (
                            <Link
                                to="/login"
                                className="px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <User className="w-4 h-4" />
                                Iniciar sesión
                            </Link>
                        )}

                        {!loading && user && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-300">{user.email}</span>
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-sm text-lol-gold hover:underline">Admin</Link>
                                )}
                                {user.role === 'coach' && (
                                    <Link to="/coach" className="text-sm text-cs-orange hover:underline">Coach</Link>
                                )}
                                {user.role === 'player' && (
                                    <Link to="/perfil" className="text-sm text-pokemon-yellow hover:underline">Perfil</Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Salir
                                </button>
                            </div>
                        )}
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
                            {!loading && !user && (
                                <Link
                                    to="/login"
                                    className="w-full px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center gap-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User className="w-4 h-4" />
                                    Iniciar sesión
                                </Link>
                            )}

                            {!loading && user && (
                                <>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" className="py-2" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                                    )}
                                    {user.role === 'coach' && (
                                        <Link to="/coach" className="py-2" onClick={() => setIsMenuOpen(false)}>Coach</Link>
                                    )}
                                    {user.role === 'player' && (
                                        <Link to="/perfil" className="py-2" onClick={() => setIsMenuOpen(false)}>Perfil</Link>
                                    )}
                                    <button
                                        onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                        className="w-full px-4 py-2 bg-gray-800 rounded flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Salir
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
