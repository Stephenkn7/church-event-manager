import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Trash2, Edit2, ArrowLeft, Clock } from 'lucide-react';
import { useService } from '../context/ServiceContext';

const Templates = () => {
    const navigate = useNavigate();
    const { serviceTemplates, addServiceTemplate, deleteServiceTemplate } = useService();

    const handleCreateTemplate = () => {
        const name = prompt("Nom du nouveau modèle (Ex: Culte Spécial Noël):");
        if (!name) return;

        const newTemplate = {
            theme: name,
            parts: [],
            duration: 0
        };
        addServiceTemplate(newTemplate);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm("Supprimer ce modèle ?")) {
            deleteServiceTemplate(id);
        }
    };

    const handleEdit = (id) => {
        // We reuse the builder but pass a query param or special route ideally
        // For simplicity now, we might need to adjust the builder to handle "Template Mode"
        // OR we just create a service from it and save it back as a template?
        // Let's stick to the plan: Reuse Builder. 
        // But Builder relies on `services` state. 
        // We probably need a specialized route like `/builder/template/:id`
        // For now, let's just show the list and allow creation -> which adds to the list.
        // Editing is tricky without refactoring Builder significantly.

        // INTERIM SOLUTION: 
        // We will just allow creating NEW services from these templates in the Home screen.
        // To EDIT a template, we can't easily do it with the current Builder without updates.
        // Let's alert the user for now or implement a basic part editor here?
        // BETTER: Let's assume we will route to `/builder/template/:id` and handle it there.
        navigate(`/builder/template/${id}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Retour Accueil
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Modèles d'Événement</h1>
                    <button
                        onClick={handleCreateTemplate}
                        className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau Modèle
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serviceTemplates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => handleEdit(template.id)}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-100 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <LayoutTemplate className="w-6 h-6" />
                                </div>
                                <button onClick={(e) => handleDelete(template.id, e)} className="text-slate-300 hover:text-red-500 p-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2">{template.theme}</h3>

                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 mr-2"></div>
                                    {template.parts?.length || 0} éléments
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {Math.floor((template.parts?.reduce((sum, p) => sum + (parseInt(p.duration) || 0), 0) || 0) / 60)}h
                                </div>
                            </div>
                        </div>
                    ))}

                    {serviceTemplates.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Aucun modèle d'événement créé.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Templates;
