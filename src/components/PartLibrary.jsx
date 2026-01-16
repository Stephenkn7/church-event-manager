import React, { useState } from 'react';
import { Plus, Trash2, Book, X } from 'lucide-react';
import { useService } from '../context/ServiceContext';

const PartLibrary = ({ onSelect, onClose }) => {
    const { templates, addTemplate, deleteTemplate } = useService();
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', leader: '', duration: 10 });

    const handleCreate = (e) => {
        e.preventDefault();
        if (newTemplate.name) {
            addTemplate(newTemplate);
            setNewTemplate({ name: '', leader: '', duration: 10 });
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full p-6 overflow-y-auto transform transition-transform animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Book className="w-6 h-6 text-indigo-600" />
                        Bibliothèque
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Create New Form */}
                {isCreating ? (
                    <form onSubmit={handleCreate} className="bg-slate-50 p-4 rounded-xl border border-indigo-100 mb-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase">Nouvel Élément Type</h3>
                        <div>
                            <label className="text-xs text-slate-500 font-semibold uppercase">Nom</label>
                            <input
                                className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: Prédication"
                                value={newTemplate.name}
                                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 font-semibold uppercase">Leader (Défaut)</label>
                                <input
                                    className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Ex: Pasteur"
                                    value={newTemplate.leader}
                                    onChange={e => setNewTemplate({ ...newTemplate, leader: e.target.value })}
                                />
                            </div>
                            <div className="w-20">
                                <label className="text-xs text-slate-500 font-semibold uppercase">Durée</label>
                                <input
                                    type="number"
                                    className="w-full border-slate-200 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500 text-center"
                                    value={newTemplate.duration}
                                    onChange={e => setNewTemplate({ ...newTemplate, duration: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2">Annuler</button>
                            <button type="submit" className="text-xs bg-indigo-600 text-white px-3 py-2 rounded font-bold hover:bg-indigo-700">Créer</button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold mb-6"
                    >
                        <Plus className="w-4 h-4" />
                        Créer un nouveau modèle
                    </button>
                )}

                {/* List */}
                <div className="space-y-3">
                    {templates.map((template) => (
                        <div key={template.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="flex-1 cursor-pointer" onClick={() => onSelect(template)}>
                                <h4 className="font-bold text-slate-800">{template.name}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {template.leader || "Aucun leader"} • {template.duration} min
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSelect(template)}
                                    className="opacity-0 group-hover:opacity-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-all"
                                    title="Ajouter au culte"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            Aucun modèle disponible.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartLibrary;
