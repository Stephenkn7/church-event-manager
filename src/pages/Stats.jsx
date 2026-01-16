import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Stats = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { services } = useService();
    const [service, setService] = useState(null);

    useEffect(() => {
        const foundService = services.find(s => s.id === id);
        if (foundService) {
            setService(JSON.parse(JSON.stringify(foundService)));
        } else {
            navigate('/');
        }
    }, [id, services, navigate]);

    if (!service) return <div className="p-10">Loading...</div>;

    // Calculations
    const totalPlannedSeconds = service.parts.reduce((acc, part) => acc + ((parseInt(part.duration) || 0) * 60), 0);
    const totalActualSeconds = service.parts.reduce((acc, part) => acc + (part.actualDuration || 0), 0);

    const totalDiffSeconds = totalActualSeconds - totalPlannedSeconds;
    const isOverTotal = totalDiffSeconds > 0;

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    // Chart Data Preparation
    const chartData = service.parts.map(part => ({
        name: part.name.length > 20 ? part.name.substring(0, 15) + '...' : part.name,
        Prévu: parseInt(part.duration) || 0,
        Réel: Math.round((part.actualDuration || 0) / 60 * 10) / 10 // Convert to minutes
    }));

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-indigo-600 font-medium">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour au tableau de bord
                    </button>
                    <button onClick={() => navigate(`/builder/${id}`)} className="text-indigo-600 hover:underline text-sm font-semibold">
                        Modifier le culte
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900">Rapport de Service</h1>
                    <p className="text-xl text-slate-600">{service.theme}</p>
                    <p className="text-sm text-slate-400">{new Date(service.date).toLocaleDateString()}</p>
                </div>

                {/* Global Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Planned Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase">Temps Prévu</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-700">{formatDuration(totalPlannedSeconds)}</p>
                    </div>

                    {/* Actual Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-500 uppercase">Temps Réel</h3>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600">{formatDuration(totalActualSeconds)}</p>
                    </div>

                    {/* Diff Card */}
                    <div className={cn(
                        "p-6 rounded-2xl shadow-sm border border-slate-200",
                        isOverTotal ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            {isOverTotal ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            <h3 className={cn("text-sm font-bold uppercase", isOverTotal ? "text-red-600" : "text-emerald-600")}>
                                {isOverTotal ? "Dépassement" : "Économie"}
                            </h3>
                        </div>
                        <p className={cn("text-3xl font-bold", isOverTotal ? "text-red-700" : "text-emerald-700")}>
                            {isOverTotal ? "+" : "-"}{formatDuration(Math.abs(totalDiffSeconds))}
                        </p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Comparaison Visuelle (Minutes)</h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="Prévu" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Réel" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                                <th className="p-4">Élément</th>
                                <th className="p-4">Intervenant</th>
                                <th className="p-4 text-center">Prévu</th>
                                <th className="p-4 text-center">Réel</th>
                                <th className="p-4 text-right">Écart</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {service.parts.map((part) => {
                                const actualSec = part.actualDuration || 0;
                                const plannedSec = (parseInt(part.duration) || 0) * 60;
                                const diff = actualSec - plannedSec;
                                const isOver = diff > 0;

                                return (
                                    <tr key={part.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-medium text-slate-900">{part.name}</td>
                                        <td className="p-4 text-slate-500 text-sm">{part.leader}</td>
                                        <td className="p-4 text-center text-slate-500 font-mono text-sm">{part.duration}m</td>
                                        <td className="p-4 text-center font-mono font-bold text-slate-700">{formatDuration(actualSec)}</td>
                                        <td className={cn("p-4 text-right font-mono font-bold text-sm", isOver ? "text-red-500" : "text-emerald-500")}>
                                            {diff > 0 ? "+" : ""}{diff === 0 ? "-" : formatDuration(diff)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default Stats;
