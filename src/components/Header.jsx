import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Tablet, Computer, Wifi, WifiOff, Menu, X, Home, LayoutTemplate, List, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const Header = () => {
    const { isTabletConnected, registerAsTablet, registerAsDesktop, deviceRole } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Use reactive state from context
    const isTabletMode = deviceRole === 'tablet';

    const toggleMode = () => {
        if (isTabletMode) {
            if (confirm("Passer en mode Ordinateur ?")) {
                registerAsDesktop();
            }
        } else {
            if (confirm("Passer en mode Tablette ?")) {
                registerAsTablet();
            }
        }
    };

    const routes = [
        { path: '/', label: 'Accueil', icon: Home },
        { path: '/templates', label: 'Modèles', icon: LayoutTemplate },
        { path: '/activities', label: 'Activités', icon: List },
        { path: '/members', label: 'Intervenants', icon: Users },
    ];

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* LEFT: Logo & Nav (Desktop) */}
                    <div className="flex items-center gap-8">
                        <div
                            onClick={() => navigate('/')}
                            className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <span className="font-extrabold text-xl text-slate-900 tracking-tight hidden sm:block">Church Event Manager</span>
                        </div>

                        <div className="hidden md:flex space-x-1">
                            {routes.map((route) => {
                                const Icon = route.icon;
                                const isActive = location.pathname === route.path;
                                return (
                                    <button
                                        key={route.path}
                                        onClick={() => navigate(route.path)}
                                        className={clsx(
                                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-slate-100 text-indigo-600"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {route.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Tablet Status & Mobile Menu Button */}
                    <div className="flex items-center gap-4">

                        {/* Device Mode Toggle (Hidden on small screens maybe, but useful for testing) */}
                        <button
                            onClick={toggleMode}
                            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-600 border border-slate-200"
                            title={isTabletMode ? "Vous êtes en mode Tablette" : "Vous êtes en mode Ordinateur"}
                        >
                            {isTabletMode ? <Tablet className="w-4 h-4" /> : <Computer className="w-4 h-4" />}
                            <span className="hidden xl:inline">{isTabletMode ? "Mode Tablette" : "Mode PC"}</span>
                        </button>

                        {/* TABLET CONNECTION INDICATOR - The feature requested */}
                        {!isTabletMode && (
                            <div className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm",
                                isTabletConnected
                                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    : "bg-slate-50 border-slate-200 text-slate-400 opacity-80"
                            )}>
                                {isTabletConnected ? (
                                    <>
                                        <Wifi className="w-4 h-4" />
                                        <span>Tablette Connectée</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-4 h-4" />
                                        <span className="hidden sm:inline">Tablette Déconnectée</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white shadow-lg absolute w-full left-0 z-50">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {routes.map((route) => {
                            const Icon = route.icon;
                            const isActive = location.pathname === route.path;
                            return (
                                <button
                                    key={route.path}
                                    onClick={() => {
                                        navigate(route.path);
                                        setIsMenuOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center px-3 py-4 rounded-md text-base font-medium",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {route.label}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => { toggleMode(); setIsMenuOpen(false); }}
                            className="w-full flex items-center px-3 py-4 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50"
                        >
                            {isTabletMode ? <Tablet className="w-5 h-5 mr-3" /> : <Computer className="w-5 h-5 mr-3" />}
                            {isTabletMode ? "Passer en mode PC" : "Passer en mode Tablette"}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Header;
