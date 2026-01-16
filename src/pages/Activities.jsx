import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search, Save, List, X, Edit2 } from 'lucide-react';
import { useActivities } from '../context/ActivityContext';

const Activities = () => {
    const navigate = useNavigate();
    const { activities, addActivity, deleteActivity, updateActivity } = useActivities();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newActivityName, setNewActivityName] = useState("");
    const [editingActivity, setEditingActivity] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newActivityName.trim()) {
            if (editingActivity) {
                updateActivity({ ...editingActivity, name: newActivityName.trim() });
            } else {
                addActivity(newActivityName.trim());
            }
            handleCloseModal();
        }
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setNewActivityName(activity.name);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingActivity(null);
        setNewActivityName("");
    };

    const handleDelete = (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette activité ?')) {
            deleteActivity(id);
        }
    };

    const filteredActivities = activities.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Retour Accueil
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Section d'Événement</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle Activité
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une activité..."
                        className="flex-1 border-none focus:ring-0 text-slate-700 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Activities List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {filteredActivities.length > 0 ? (
                            filteredActivities.map(activity => (
                                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                            <List className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-slate-800 text-lg">{activity.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(activity)}
                                            className="text-slate-300 hover:text-indigo-500 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <List className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Aucune activité trouvée.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingActivity ? "Modifier l'activité" : "Nouvelle Activité"}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'activité</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Ex: Louange, Prédication..."
                                    value={newActivityName}
                                    onChange={(e) => setNewActivityName(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {editingActivity ? "Enregistrer" : "Ajouter"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Activities;
