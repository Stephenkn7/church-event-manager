import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Users, LayoutTemplate, Clock, Calendar, CheckCircle, List, TrendingUp, Award, Activity, Edit, Trash2, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useService } from '../context/ServiceContext';

const Home = () => {
    const navigate = useNavigate();
    const { services, createNewService, serviceTemplates } = useService();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Sort services by date (newest first)
    const sortedServices = useMemo(() => [...services].sort((a, b) => new Date(b.date) - new Date(a.date)), [services]);

    // ----------------------------------------------------------------------------------
    // COUNTDOWN LOGIC
    // ----------------------------------------------------------------------------------
    const [timeLeft, setTimeLeft] = useState(null);
    const [nextService, setNextService] = useState(null);
    const [isLiveNow, setIsLiveNow] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            // Find the first service that is in the future OR currently happening (within a reasonable window, e.g., 2 hours)
            // But usually "live" means "time has passed start time".
            // Let's strictly follow: Countdown reaches 0 -> Go Live appears.

            // Filter for services relevant for "Next" or "Live"
            // We want the closest one in the future, OR if we are just past the start time of one.
            // For simplicity based on user request: "when countdown reaches zero... button appears".

            const upcoming = services
                .filter(s => {
                    if (!s.date || !s.startTime) return false;
                    // We keep past services in the list just to check if we are "live" right now (e.g. started 10 mins ago)
                    // But for the countdown logic, we primarily look for the next one.
                    return true;
                })
                .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`));

            // Find first future service
            const futureService = upcoming.find(s => new Date(`${s.date}T${s.startTime}`) > now);

            // Check if we have a service that "just started" (e.g. within last 3 hours) to show as LIVE NOW
            // OR if today is the day and time is passed.
            const liveService = upcoming.find(s => {
                const sDate = new Date(`${s.date}T${s.startTime}`);
                const diff = now - sDate;
                // Considered live if started less than 3 hours ago and verified not finished? 
                // For this specific request: "when countdown reaches zero".
                // So if we are past start time, we are implicitly "at zero".
                return diff >= 0 && diff < 3 * 60 * 60 * 1000; // 3 hours window
            });

            if (liveService) {
                setNextService(liveService);
                setIsLiveNow(true);
                setTimeLeft(null);
            } else if (futureService) {
                setNextService(futureService);
                setIsLiveNow(false);
                const targetDate = new Date(`${futureService.date}T${futureService.startTime}`);
                const difference = targetDate - now;

                if (difference > 0) {
                    setTimeLeft({
                        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                        minutes: Math.floor((difference / 1000 / 60) % 60),
                        seconds: Math.floor((difference / 1000) % 60)
                    });
                } else {
                    // Falls into the "liveService" block on next tick usually, but handle just in case
                    setIsLiveNow(true);
                    setTimeLeft(null);
                }
            } else {
                setNextService(null);
                setIsLiveNow(false);
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [services]);


    // ----------------------------------------------------------------------------------
    // STATISTICS LOGIC
    // ----------------------------------------------------------------------------------
    const stats = useMemo(() => {
        const totalServices = services.length;

        // Average Duration
        const totalDurationMinutes = services.reduce((acc, s) => {
            return acc + (s.parts ? s.parts.reduce((sum, p) => sum + (parseInt(p.duration) || 0), 0) : 0);
        }, 0);
        const avgDuration = totalServices > 0 ? Math.round(totalDurationMinutes / totalServices) : 0;

        // Top Intervenants (Moderator, Conductor, Preacher, and Part Leaders)
        const intervenantCounts = {};
        services.forEach(s => {
            if (s.parts) {
                s.parts.forEach(p => {
                    if (p.leader) intervenantCounts[p.leader] = (intervenantCounts[p.leader] || 0) + 1;
                });
            }
        });
        const topIntervenants = Object.entries(intervenantCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

        // Top Activities
        const activityCounts = {};
        services.forEach(s => {
            if (s.parts) {
                s.parts.forEach(p => {
                    if (p.name) activityCounts[p.name] = (activityCounts[p.name] || 0) + 1;
                });
            }
        });
        const topActivities = Object.entries(activityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

        return { totalServices, avgDuration, topIntervenants, topActivities };
    }, [services]);

    const handleCreateService = (template = null) => {
        const newService = createNewService(template);
        navigate(`/builder/${newService.id}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 sm:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-12">

                <header>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Church Event Manager</h1>
                    <p className="text-slate-500 text-lg">Gestion et pilotage d'événement</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* SECTION 1: CRÉATION DE CULTE */}
                    <div
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-32 bg-indigo-50 rounded-full translate-x-12 -translate-y-12 opacity-50 group-hover:bg-indigo-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Créer un Événement</h2>
                            <p className="text-slate-500">Planifier un nouvel événement depuis zéro ou à partir d'un modèle.</p>
                        </div>
                    </div>

                    {/* SECTION 2: LANCEMENT LIVE + COUNTDOWN */}
                    <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden text-white flex flex-col justify-between">
                        <div className="absolute right-0 bottom-0 p-32 bg-slate-800 rounded-full translate-x-12 translate-y-12 opacity-30"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-900/50 animate-pulse">
                                        <Play className="w-8 h-8 text-white ml-1" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">Lancement Live</h2>
                                    {nextService ? (
                                        <p className="text-slate-400 text-sm mb-6">
                                            {isLiveNow ? "En direct maintenant :" : "Prochain événement :"} <span className="text-white font-semibold">{nextService.theme}</span>
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-sm mb-6">Aucun événement à venir</p>
                                    )}
                                </div>
                            </div>

                            {/* COUNTDOWN */}
                            {!isLiveNow && timeLeft && (
                                <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                                    <div className="bg-slate-800/60 rounded-lg p-2 backdrop-blur-sm border border-slate-700/50">
                                        <div className="text-2xl font-bold font-mono text-white">{timeLeft.days}</div>
                                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Jours</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-lg p-2 backdrop-blur-sm border border-slate-700/50">
                                        <div className="text-2xl font-bold font-mono text-white">{timeLeft.hours}</div>
                                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Heures</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-lg p-2 backdrop-blur-sm border border-slate-700/50">
                                        <div className="text-2xl font-bold font-mono text-white">{timeLeft.minutes}</div>
                                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Min</div>
                                    </div>
                                    <div className="bg-slate-800/60 rounded-lg p-2 backdrop-blur-sm border border-slate-700/50">
                                        <div className="text-2xl font-bold font-mono text-red-500">{timeLeft.seconds}</div>
                                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Sec</div>
                                    </div>
                                </div>
                            )}

                            {!isLiveNow && !timeLeft && (
                                <div className="bg-slate-800/40 rounded-xl p-4 mb-6 text-center border border-slate-800 border-dashed">
                                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <span className="text-sm text-slate-500">En attente de programmation...</span>
                                </div>
                            )}

                            {/* BUTTON - Only visible when Live */}
                            {isLiveNow && nextService && (
                                <button
                                    onClick={() => navigate(`/live/${nextService.id}`)}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    PASSER EN DIRECT
                                </button>
                            )}

                            {/* Show disabled button if counting down, optional but good for UX?
                                No, user requested "un bouton apparaître" specifically. 
                                So we render NOTHING if not live.
                             */}
                        </div>
                    </div>

                    {/* SECTION 3: INTERVENANTS */}
                    <div
                        onClick={() => navigate('/members')}
                        className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-200 hover:border-emerald-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:bg-emerald-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Intervenants</h2>
                            <p className="text-slate-500 text-sm">Gérer les pasteurs, leaders et équipes.</p>
                        </div>
                    </div>

                    {/* SECTION 4: MODÈLES */}
                    <div
                        onClick={() => navigate('/templates')}
                        className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-200 hover:border-amber-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:bg-amber-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                                <LayoutTemplate className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Modèles d'Événement</h2>
                        </div>
                    </div>

                    {/* SECTION 5: BIBLIOTHÈQUE */}
                    <div
                        onClick={() => navigate('/activities')}
                        className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-200 hover:border-purple-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 p-24 bg-purple-50 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:bg-purple-100 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                                <List className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Section d'Événement</h2>
                            <p className="text-slate-500 text-sm">Gérer la liste des activités disponibles.</p>

                        </div>

                    </div>

                </div>

                {/* STATISTICS SECTION */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        Statistiques Globales
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stat Card 1: Cultes */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                            </div>
                            <div className="text-3xl font-extrabold text-slate-900 mb-1">{stats.totalServices}</div>
                            <p className="text-sm text-slate-500">Événements organisés</p>
                            <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Moyenne: {Math.floor(stats.avgDuration / 60)}h {stats.avgDuration % 60}min
                            </div>
                        </div>

                        {/* Stat Card 2: Intervenants */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                    <Award className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Actifs</span>
                            </div>
                            <div className="space-y-3">
                                {stats.topIntervenants.length > 0 ? (
                                    stats.topIntervenants.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{item.name}</span>
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-400 italic">Pas de données</div>
                                )}
                            </div>
                        </div>

                        {/* Stat Card 3: Activités */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activités</span>
                            </div>
                            <div className="space-y-3">
                                {stats.topActivities.length > 0 ? (
                                    stats.topActivities.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-700">{item.name}</span>
                                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-400 italic">Pas de données</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALL SERVICES LIST */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <List className="w-6 h-6 text-indigo-600" />
                            Tous les Événements
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 pl-4">Date</th>
                                    <th className="py-4">Thème</th>
                                    <th className="py-4">Heure</th>
                                    <th className="py-4">Durée</th>
                                    <th className="py-4 pr-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sortedServices.length > 0 ? (
                                    sortedServices.map(service => {
                                        const serviceDate = service.date ? parseISO(service.date) : new Date();
                                        const totalMinutes = service.parts ? service.parts.reduce((acc, p) => acc + (parseInt(p.duration) || 0), 0) : 0;
                                        const hours = Math.floor(totalMinutes / 60);
                                        const minutes = totalMinutes % 60;

                                        return (
                                            <tr key={service.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500 font-bold leading-none">
                                                            <span className="text-xs uppercase">{format(serviceDate, 'MMM', { locale: fr })}</span>
                                                            <span className="text-lg text-slate-700">{format(serviceDate, 'dd', { locale: fr })}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="font-semibold text-slate-700 block">{service.theme || "Sans thème"}</span>
                                                    <span className="text-xs text-slate-400">{service.parts ? service.parts.length : 0} éléments</span>
                                                </td>
                                                <td className="py-4 text-sm text-slate-600 font-mono">
                                                    {service.startTime}
                                                </td>
                                                <td className="py-4 text-sm text-slate-500">
                                                    {hours}h {minutes}min
                                                </td>
                                                <td className="py-4 pr-4 text-right">
                                                    {service.isFinished ? (
                                                        <button
                                                            onClick={() => navigate(`/stats/${service.id}`)}
                                                            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 group-hover:shadow-sm"
                                                        >
                                                            <TrendingUp className="w-4 h-4" />
                                                            Statistiques
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/builder/${service.id}`)}
                                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 group-hover:shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Modifier
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500 italic">
                                            Aucun événement créé pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-6 text-white">
                            <h2 className="text-2xl font-bold">Nouvel Événement</h2>
                            <p className="text-indigo-200 text-sm">Choisissez une méthode pour commencer.</p>
                        </div>

                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Blank */}
                            <button
                                onClick={() => handleCreateService()}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-indigo-600" />
                                </div>
                                <span className="font-bold text-slate-700">Événement Vierge</span>
                                <span className="text-xs text-slate-500 mt-1">Partir de zéro</span>
                            </button>

                            {/* From Templates */}
                            {serviceTemplates && serviceTemplates.length > 0 ? (
                                serviceTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleCreateService(template)}
                                        className="flex flex-col items-start p-6 border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-left relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-12 bg-amber-100 rounded-full translate-x-6 -translate-y-6 opacity-30"></div>
                                        <span className="font-bold text-slate-800 mb-1 relative z-10">{template.theme}</span>
                                        <span className="text-xs text-slate-500 relative z-10">{template.parts.length} éléments • {Math.floor(template.parts.reduce((a, b) => a + (parseInt(b.duration) || 0), 0) / 60)}h</span>
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-xl bg-slate-50 text-center opacity-70">
                                    <LayoutTemplate className="w-8 h-8 text-slate-300 mb-2" />
                                    <span className="text-sm font-semibold text-slate-500">Aucun modèle disponible</span>
                                    <button onClick={() => navigate('/templates')} className="text-xs text-indigo-600 font-bold mt-2 hover:underline">Créer un modèle</button>
                                </div>
                            )}

                        </div>
                        <div className="bg-slate-50 p-4 flex justify-end">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
