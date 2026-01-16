import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Calendar, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { useService } from '../context/ServiceContext';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
    const { services, createNewService, deleteService } = useService();
    const navigate = useNavigate();

    const handleCreate = () => {
        const newService = createNewService();
        navigate(`/builder/${newService.id}`);
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce culte ?")) {
            deleteService(id);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ChurchFlow</h1>
                        <p className="mt-2 text-lg text-slate-600">Tableau de bord</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouveau Culte</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* New Empty Card for explicit action */}
                    <button
                        onClick={handleCreate}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all h-64"
                    >
                        <div className="bg-indigo-100 p-4 rounded-full group-hover:bg-indigo-200 transition-colors mb-4">
                            <Plus className="w-8 h-8 text-indigo-600" />
                        </div>
                        <span className="font-bold text-slate-600 group-hover:text-indigo-700">Créer un culte vide</span>
                    </button>

                    {services.map((service) => (
                        <Link
                            to={`/builder/${service.id}`}
                            key={service.id}
                            className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col h-64 relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleDelete(e, service.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-bold uppercase tracking-wide">
                                        {format(parseISO(service.date), 'dd MMMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                                    {service.theme || "Sans thème"}
                                </h3>
                                <div className="flex items-center space-x-2 text-slate-500 text-sm mb-4">
                                    <Clock className="w-4 h-4" />
                                    <span>{service.startTime} start</span>
                                    <span>•</span>
                                    <span>{service.parts.length} éléments</span>
                                </div>
                                {service.moderator && (
                                    <p className="text-sm text-slate-500">
                                        <span className="font-semibold">Mod:</span> {service.moderator}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                                <span>Éditer</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
