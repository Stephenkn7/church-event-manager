import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, FileText, User, Play, Save, ArrowLeft, Book, LayoutTemplate } from 'lucide-react';
import { useService } from '../context/ServiceContext';
import { useMembers } from '../context/MemberContext';
import { useActivities } from '../context/ActivityContext';
import PartLibrary from '../components/PartLibrary';
import ExportButton from '../components/ExportButton';

const Builder = () => {
    const { id, templateId } = useParams();
    const navigate = useNavigate();
    const { services, updateService, deleteService, serviceTemplates, updateServiceTemplate } = useService();
    const { members } = useMembers();
    const { activities } = useActivities();

    const isTemplateMode = !!templateId;
    const currentId = isTemplateMode ? templateId : id;

    const [localService, setLocalService] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);

    useEffect(() => {
        let foundService;
        if (isTemplateMode) {
            foundService = serviceTemplates.find(t => t.id === templateId);
        } else {
            foundService = services.find(s => s.id === id);
        }

        if (foundService) {
            if (!isTemplateMode && foundService.isFinished) {
                navigate(`/stats/${id}`);
                return;
            }
            setLocalService(JSON.parse(JSON.stringify(foundService))); // Deep copy to avoid direct mutation
        } else {
            navigate(isTemplateMode ? '/templates' : '/');
        }
    }, [id, templateId, services, serviceTemplates, navigate, isTemplateMode]);

    const handleSave = () => {
        if (isTemplateMode) {
            updateServiceTemplate(localService);
        } else {
            updateService(localService);
        }
        setIsDirty(false);
    };

    const handleGoLive = () => {
        if (isDirty) handleSave();
        navigate(`/live/${id}`);
    };

    const handleDeleteService = () => {
        if (isTemplateMode) return; // Templates handled in list view for now
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement définitivement ?")) {
            deleteService(id);
            navigate('/');
        }
    };

    // Helper to update top-level fields
    const updateInfo = (field, value) => {
        setLocalService(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    // Helper to update specific parts
    const updatePart = (partId, field, value) => {
        setLocalService(prev => ({
            ...prev,
            parts: prev.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
        }));
        setIsDirty(true);
    };

    const addPart = () => {
        const newPart = {
            id: Date.now(),
            name: '',
            leader: '',
            duration: 10,
        };
        setLocalService(prev => ({ ...prev, parts: [...prev.parts, newPart] }));
        setIsDirty(true);
    };

    const removePart = (partId) => {
        if (localService.parts.length > 1) {
            setLocalService(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== partId) }));
            setIsDirty(true);
        }
    };

    const addFromLibrary = (template) => {
        const newPart = {
            id: Date.now(),
            name: template.name,
            leader: template.leader,
            duration: template.duration
        };
        setLocalService(prev => ({ ...prev, parts: [...prev.parts, newPart] }));
        setIsDirty(true);
        setShowLibrary(false);
    };

    if (!localService) return <div className="p-10 text-center">Chargement...</div>;

    // Time Calculation Helper
    const getRunningTime = (startIndex) => {
        let totalMinutes = 0;
        for (let i = 0; i < startIndex; i++) {
            // Handle string/number inputs for duration
            totalMinutes += (parseInt(localService.parts[i].duration) || 0);
        }

        // Parse start time (e.g. "07:00")
        if (!localService.startTime) return "00:00";
        const [startH, startM] = localService.startTime.split(':').map(Number);

        const date = new Date();
        date.setHours(startH, startM + totalMinutes, 0);

        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');
    };

    const totalMinutes = localService.parts.reduce((sum, part) => sum + (parseInt(part.duration) || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 pb-32">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Nav Bar */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(isTemplateMode ? '/templates' : '/')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        {isTemplateMode ? 'Retour Modèles' : 'Retour Accueil'}
                    </button>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleSave}
                            disabled={!isDirty}
                            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${isDirty ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100 hover:bg-indigo-50' : 'text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isDirty ? 'Enregistrer' : 'Enregistré'}
                        </button>
                        {!isTemplateMode && (
                            <ExportButton service={localService} />
                        )}
                        <button
                            onClick={() => setShowLibrary(true)}
                            className="flex items-center px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            <Book className="w-4 h-4 mr-2" />
                            Bibliothèque
                        </button>
                        {!isTemplateMode && (
                            <button
                                onClick={handleGoLive}
                                className="flex items-center px-5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                            >
                                <Play className="w-4 h-4 mr-2 fill-current" />
                                GO LIVE
                            </button>
                        )}
                    </div>
                </div>

                {/* Header / Meta Data Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                {isTemplateMode ? (
                                    <>
                                        <LayoutTemplate className="w-8 h-8 text-amber-500" />
                                        Éditeur de Modèle
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-8 h-8 text-indigo-600" />
                                        Éditeur d'Événement
                                    </>
                                )}
                            </h1>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-4">
                            {!isTemplateMode && (
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Date de l'événement</span>
                                    <input
                                        type="date"
                                        value={localService.date}
                                        onChange={(e) => updateInfo('date', e.target.value)}
                                        className="font-medium text-slate-700 bg-transparent border-none p-0 focus:ring-0 text-right cursor-pointer hover:text-indigo-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="col-span-1 md:col-span-2 lg:col-span-4">
                            <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Thème</label>
                            <input
                                type="text"
                                value={localService.theme}
                                onChange={(e) => updateInfo('theme', e.target.value)}
                                className="w-full text-xl font-bold text-slate-800 border-0 border-b-2 border-slate-100 focus:border-indigo-500 focus:ring-0 px-0 py-1 placeholder-slate-300 transition-colors"
                                placeholder="Entrez le thème..."
                            />
                        </div>
                    </div>
                </div>

                {/* Builder Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

                    {/* Controls Bar */}
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {!isTemplateMode && (
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Début</span>
                                    <input
                                        type="time"
                                        value={localService.startTime}
                                        onChange={(e) => updateInfo('startTime', e.target.value)}
                                        className="border-none p-0 h-auto text-sm font-bold text-slate-700 focus:ring-0 bg-transparent w-16"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                            {localService.parts.length} Éléments
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-slate-100/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-1 text-center">Horaire</div>
                        <div className={`col-span-${isTemplateMode ? '9' : '6'}`}>Programme</div>
                        {!isTemplateMode && <div className="col-span-3">Intervenant</div>}
                        <div className="col-span-1 text-center">Durée</div>
                        <div className="col-span-1 text-center"></div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {localService.parts.map((part, index) => {
                            const rowTime = getRunningTime(index);
                            return (
                                <div
                                    key={part.id}
                                    className="group relative sm:grid sm:grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-slate-50 transition-colors duration-150 ease-in-out"
                                >
                                    {/* Time */}
                                    <div className="hidden sm:flex col-span-1 justify-center items-center">
                                        <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            {rowTime}
                                        </span>
                                    </div>

                                    {/* Name Input */}
                                    <div className={`col-span-12 sm:col-span-${isTemplateMode ? '9' : '6'} mb-2 sm:mb-0`}>
                                        <div className="flex items-center gap-3">
                                            <span className="sm:hidden font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded mb-1 inline-block">{rowTime}</span>
                                            <input
                                                list={`activities-${part.id}`}
                                                type="text"
                                                value={part.name}
                                                onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                                                placeholder="Activité..."
                                                className="w-full bg-transparent border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 text-slate-900 placeholder-slate-400 font-medium text-base px-0 py-1 transition-all"
                                            />
                                            <datalist id={`activities-${part.id}`}>
                                                {activities.map(a => (
                                                    <option key={a.id} value={a.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* Leader Input */}
                                    {!isTemplateMode && (
                                        <div className="col-span-12 sm:col-span-3 mb-2 sm:mb-0">
                                            <input
                                                list={`leaders-${part.id}`}
                                                type="text"
                                                value={part.leader}
                                                onChange={(e) => updatePart(part.id, 'leader', e.target.value)}
                                                placeholder="Intervenant"
                                                className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-sm text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-300"
                                            />
                                            <datalist id={`leaders-${part.id}`}>
                                                {members.map(m => (
                                                    <option key={m.id} value={m.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    )}

                                    {/* Duration Input */}
                                    <div className="col-span-6 sm:col-span-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={part.duration}
                                                onChange={(e) => updatePart(part.id, 'duration', parseInt(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border-none rounded py-1 pl-1 pr-6 text-center font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="absolute right-2 top-1 text-xs text-slate-400 pointer-events-none">m</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-6 sm:col-span-1 flex justify-end sm:justify-center">
                                        <button
                                            onClick={() => removePart(part.id)}
                                            className="text-slate-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Button */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                        {!isTemplateMode && (
                            <button
                                onClick={handleDeleteService}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-all text-sm font-semibold flex items-center"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer l'événement
                            </button>
                        )}

                        <button
                            onClick={addPart}
                            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter une section</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="sticky bottom-6 z-10 mx-auto max-w-lg">
                <div className="bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700/50 transition-transform hover:scale-105 duration-300">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Durée Totale</span>
                        <div className="font-bold text-xl flex items-baseline gap-1">
                            {totalHours} <span className="text-sm font-normal text-slate-500">h</span> {remainingMinutes} <span className="text-sm font-normal text-slate-500">min</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-700 mx-4"></div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Fin Estimée</span>
                        <span className="font-bold text-xl text-emerald-400">{getRunningTime(localService.parts.length)}</span>
                    </div>
                </div>
            </div>

            {showLibrary && (
                <PartLibrary
                    onClose={() => setShowLibrary(false)}
                    onSelect={addFromLibrary}
                />
            )}
        </div>
    );
};

export default Builder;
