import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

const ServiceContext = createContext();

const initialState = {
    services: [],
    currentService: null,
    templates: [], // Component templates (Part library)
    serviceTemplates: [], // Full Service Templates (Modèles de Service)
    loading: true
};

const serviceReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'LOAD_SERVICES':
            return { ...state, services: action.payload, loading: false };
        case 'SET_CURRENT_SERVICE':
            return { ...state, currentService: action.payload };
        case 'CREATE_SERVICE':
            return {
                ...state,
                services: [...state.services, action.payload],
                currentService: action.payload
            };
        case 'UPDATE_SERVICE':
            const updatedServices = state.services.map(s =>
                s.id === action.payload.id ? action.payload : s
            );
            return {
                ...state,
                services: updatedServices,
                currentService: action.payload
            };
        case 'DELETE_SERVICE':
            return {
                ...state,
                services: state.services.filter(s => s.id !== action.payload)
            };
        case 'LOAD_TEMPLATES':
            return { ...state, templates: action.payload };
        case 'ADD_TEMPLATE':
            return { ...state, templates: [...state.templates, action.payload] };
        case 'DELETE_TEMPLATE':
            return { ...state, templates: state.templates.filter(t => t.id !== action.payload) };

        // Service Templates Actions
        case 'LOAD_SERVICE_TEMPLATES':
            return { ...state, serviceTemplates: action.payload };
        case 'ADD_SERVICE_TEMPLATE':
            return { ...state, serviceTemplates: [...state.serviceTemplates, action.payload] };
        case 'UPDATE_SERVICE_TEMPLATE':
            return {
                ...state,
                serviceTemplates: state.serviceTemplates.map(t => t.id === action.payload.id ? action.payload : t)
            };
        case 'DELETE_SERVICE_TEMPLATE':
            return { ...state, serviceTemplates: state.serviceTemplates.filter(t => t.id !== action.payload) };

        default:
            return state;
    }
};

export const ServiceProvider = ({ children }) => {
    const [state, dispatch] = useReducer(serviceReducer, initialState);

    // Load from Supabase on mount
    useEffect(() => {
        loadServices();
        loadTemplates();
        loadServiceTemplates();

        // Subscribe to realtime changes for services
        const servicesSubscription = supabase
            .channel('services_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'services' },
                (payload) => {
                    console.log('Service change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        dispatch({ type: 'CREATE_SERVICE', payload: payload.new });
                    } else if (payload.eventType === 'UPDATE') {
                        dispatch({ type: 'UPDATE_SERVICE', payload: payload.new });
                    } else if (payload.eventType === 'DELETE') {
                        dispatch({ type: 'DELETE_SERVICE', payload: payload.old.id });
                    }
                }
            )
            .subscribe();

        // Subscribe to realtime changes for templates
        const templatesSubscription = supabase
            .channel('templates_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'templates' },
                (payload) => {
                    console.log('Template change received:', payload);
                    if (payload.new?.type === 'component') {
                        if (payload.eventType === 'INSERT') {
                            dispatch({ type: 'ADD_TEMPLATE', payload: payload.new });
                        } else if (payload.eventType === 'DELETE') {
                            dispatch({ type: 'DELETE_TEMPLATE', payload: payload.old.id });
                        }
                    } else if (payload.new?.type === 'service' || payload.old?.type === 'service') {
                        if (payload.eventType === 'INSERT') {
                            dispatch({ type: 'ADD_SERVICE_TEMPLATE', payload: payload.new });
                        } else if (payload.eventType === 'UPDATE') {
                            dispatch({ type: 'UPDATE_SERVICE_TEMPLATE', payload: payload.new });
                        } else if (payload.eventType === 'DELETE') {
                            dispatch({ type: 'DELETE_SERVICE_TEMPLATE', payload: payload.old.id });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            servicesSubscription.unsubscribe();
            templatesSubscription.unsubscribe();
        };
    }, []);

    const loadServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            dispatch({ type: 'LOAD_SERVICES', payload: data || [] });
        } catch (error) {
            console.error('Error loading services:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('type', 'component')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                dispatch({ type: 'LOAD_TEMPLATES', payload: data });
            } else {
                // Seed default component templates
                await seedComponentTemplates();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const loadServiceTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('type', 'service')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                dispatch({ type: 'LOAD_SERVICE_TEMPLATES', payload: data });
            } else {
                // Seed default service template
                await seedServiceTemplates();
            }
        } catch (error) {
            console.error('Error loading service templates:', error);
        }
    };

    const seedComponentTemplates = async () => {
        const defaultTemplates = [
            { id: uuidv4(), type: 'component', name: 'Louange', leader: 'Groupe de Louange', duration: 20 },
            { id: uuidv4(), type: 'component', name: 'Adoration', leader: 'Groupe de Louange', duration: 15 },
            { id: uuidv4(), type: 'component', name: 'Message', leader: 'Prédicateur', duration: 45 },
            { id: uuidv4(), type: 'component', name: 'Annonces', leader: 'Secrétariat', duration: 5 },
        ];

        try {
            const { data, error } = await supabase
                .from('templates')
                .insert(defaultTemplates)
                .select();

            if (error) throw error;
            dispatch({ type: 'LOAD_TEMPLATES', payload: data });
        } catch (error) {
            console.error('Error seeding component templates:', error);
        }
    };

    const seedServiceTemplates = async () => {
        const defaultServiceTemplate = {
            id: uuidv4(),
            type: 'service',
            theme: 'Culte du Dimanche - LÈVE TOI ET BRILLE',
            parts: [
                { id: 1, name: 'PRE-CULTE (PRIERE DES SERVITEURS)', leader: 'Aquilas Yao', duration: 30 },
                { id: 2, name: 'BRIEF AVANT CULTE', leader: 'Pasteur Blandine Oyoua', duration: 10 },
                { id: 3, name: 'BALANCE ET DERNIER REGLAGE', leader: 'Équipe Technique', duration: 45 },
                { id: 4, name: 'DEBUT LOUANGE ET ADORATION', leader: 'Équipe Louange', duration: 0 },
                { id: 5, name: "ENTREE DE L'AUDITOIRE", leader: 'Équipe Accueil', duration: 10 },
                { id: 6, name: 'MODERATEUR CULTE', leader: 'Daniel Zamblé', duration: 10 },
                { id: 7, name: 'LOUANGE ET ADORATION', leader: 'Stéphanie Talloh', duration: 45 },
                { id: 8, name: 'SAINTE CENE', leader: 'Pasteur Blandine Oyoua', duration: 10 },
                { id: 9, name: 'DIMES ET OFFRANDES', leader: 'Ange Nahi', duration: 10 },
                { id: 10, name: 'ANNONCE', leader: 'Syntyche Yangra', duration: 10 },
                { id: 11, name: 'INSTANT DE TRIBUS ET FDV (TRIBU JUDA)', leader: 'Tribu Juda', duration: 10 },
                { id: 12, name: 'MESSAGE ET MINISTERE', leader: 'Pasteur Oyoua Bertrand', duration: 60 },
                { id: 13, name: 'DERNIERE ANNONCE ET PRESENTATION DES NOUVEAUX', leader: 'Syntyche Yangra', duration: 5 },
                { id: 14, name: 'PRIERE DE FIN ET RENVOIE', leader: 'Daniel Zamblé', duration: 5 },
                { id: 15, name: "TRIBUS ET REPAS D'AMOUR", leader: 'Toutes les Tribus', duration: 30 },
                { id: 16, name: 'DEBRIEF CULTE', leader: 'Équipe Dirigeante', duration: 10 },
                { id: 17, name: 'INSTALLATION', leader: 'Équipe Logistique', duration: 10 },
                { id: 18, name: 'FORMATION', leader: 'Formateurs', duration: 60 },
            ]
        };

        try {
            const { data, error } = await supabase
                .from('templates')
                .insert([defaultServiceTemplate])
                .select();

            if (error) throw error;
            dispatch({ type: 'LOAD_SERVICE_TEMPLATES', payload: data });
        } catch (error) {
            console.error('Error seeding service templates:', error);
        }
    };

    const createNewService = async (template = null) => {
        const newService = {
            id: uuidv4(),
            theme: template?.theme || "Nouvel Événement",
            date: new Date().toISOString().split('T')[0],
            start_time: "09:00",
            parts: template?.parts || [],
            status: 'draft'
        };

        try {
            const { data, error } = await supabase
                .from('services')
                .insert([newService])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating service:', error);
            return null;
        }
    };

    const updateService = async (updatedService) => {
        try {
            const { error } = await supabase
                .from('services')
                .update(updatedService)
                .eq('id', updatedService.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

    const setCurrentService = (serviceId) => {
        const service = state.services.find(s => s.id === serviceId);
        if (service) {
            dispatch({ type: 'SET_CURRENT_SERVICE', payload: service });
        }
    };

    const deleteService = async (serviceId) => {
        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const addTemplate = async (template) => {
        const newTemplate = {
            id: uuidv4(),
            type: 'component',
            ...template
        };

        try {
            const { data, error } = await supabase
                .from('templates')
                .insert([newTemplate])
                .select()
                .single();

            if (error) throw error;
        } catch (error) {
            console.error('Error adding template:', error);
        }
    };

    const deleteTemplate = async (id) => {
        try {
            const { error } = await supabase
                .from('templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    // Service Template Functions
    const addServiceTemplate = async (template) => {
        const newTemplate = {
            id: uuidv4(),
            type: 'service',
            ...template
        };

        try {
            const { data, error } = await supabase
                .from('templates')
                .insert([newTemplate])
                .select()
                .single();

            if (error) throw error;
        } catch (error) {
            console.error('Error adding service template:', error);
        }
    };

    const updateServiceTemplate = async (template) => {
        try {
            const { error } = await supabase
                .from('templates')
                .update(template)
                .eq('id', template.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating service template:', error);
        }
    };

    const deleteServiceTemplate = async (id) => {
        try {
            const { error } = await supabase
                .from('templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting service template:', error);
        }
    };

    return (
        <ServiceContext.Provider value={{
            ...state,
            createNewService,
            updateService,
            setCurrentService,
            deleteService,
            addTemplate,
            deleteTemplate,
            addServiceTemplate,
            updateServiceTemplate,
            deleteServiceTemplate
        }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useService = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useService must be used within a ServiceProvider');
    }
    return context;
};
