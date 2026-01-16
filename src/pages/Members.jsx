import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, User, Phone, Briefcase, Search, Save, X } from 'lucide-react';
import { useMembers } from '../context/MemberContext';

const Members = () => {
    const navigate = useNavigate();
    const { members, addMember, updateMember, deleteMember } = useMembers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        function: 'Serviteur'
    });

    const functionOptions = ['Pasteur', 'Responsable', 'Leader', 'Serviteur', 'Membre'];

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                phone: member.phone,
                function: member.function
            });
        } else {
            setEditingMember(null);
            setFormData({
                name: '',
                phone: '',
                function: 'Serviteur'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingMember) {
            updateMember({
                ...editingMember,
                ...formData
            });
        } else {
            addMember(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cet intervenant ?')) {
            deleteMember(id);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Retour Accueil
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion des Intervenants</h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou matricule..."
                        className="flex-1 border-none focus:ring-0 text-slate-700 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Member Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${member.function === 'Pasteur' ? 'bg-purple-100 text-purple-700' :
                                            member.function === 'Responsable' ? 'bg-blue-100 text-blue-700' :
                                                member.function === 'Leader' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                        {member.function}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(member)} className="text-slate-400 hover:text-indigo-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(member.id)} className="text-slate-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                                <p className="text-slate-500 text-sm font-mono mb-4">{member.matricule}</p>

                                {member.phone && (
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <Phone className="w-4 h-4 mr-2" />
                                        {member.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingMember ? 'Modifier Intervenant' : 'Nouvel Intervenant'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom Complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="Ex: Jean Kouassi"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Fonction</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white"
                                        value={formData.function}
                                        onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                                    >
                                        {functionOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="01 02 03 04 05"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;
