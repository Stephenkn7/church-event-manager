import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ServiceContext = createContext();

const initialState = {
    services: [],
    currentService: null,
    templates: [], // Component templates (Part library)
    serviceTemplates: [] // Full Service Templates (Modèles de Service)
};

const serviceReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD_SERVICES':
            return { ...state, services: action.payload };
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

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('churchflow_services');
        if (saved) {
            dispatch({ type: 'LOAD_SERVICES', payload: JSON.parse(saved) });
        } else {
            // Init with the user's template if no data exists
            const initialService = {
                id: uuidv4(),
                theme: "LÈVE TOI ET BRILLE",
                date: "2026-01-11",
                date: "2026-01-11",
                startTime: "07:00",
                parts: [
                    { id: 1, name: 'Pre-Culte (Prière des Serviteurs)', leader: 'Dirigeant', duration: 30 },
                    { id: 2, name: 'Brief Avant Culte (Com, Event, Formation...)', leader: 'Staff', duration: 10 },
                    { id: 3, name: 'Balance et Dernier Réglage', leader: 'Technique / Louange', duration: 35 },
                    { id: 4, name: "Entrée de l'Auditoire", leader: 'Accueil', duration: 10 },
                    { id: 5, name: 'Modérateur Culte', leader: 'Daniel Zamblé', duration: 10 },
                    { id: 6, name: 'Louange et Adoration', leader: 'Stéphanie Talloh', duration: 45 },
                    { id: 7, name: 'Sainte Cène', leader: 'Past Blandine', duration: 10 },
                    { id: 8, name: 'Dîmes et Offrandes', leader: 'Ange Nahi', duration: 10 },
                    { id: 9, name: 'Annonces', leader: 'Syntyche Yangra', duration: 10 },
                    { id: 10, name: 'Instant de Tribus et FDV', leader: 'Tribu Juda', duration: 10 },
                    { id: 11, name: 'Message et Ministère', leader: 'Pasteur Oyoua Bertrand', duration: 60 },
                    { id: 12, name: 'Dernière Annonce et Présentation', leader: 'Syntyche Yangra', duration: 5 },
                    { id: 13, name: 'Prière de Fin et Renvoie', leader: 'Modérateur', duration: 5 },
                    { id: 14, name: "Tribus et Repas d'Amour", leader: 'Toutes les tribus', duration: 30 },
                    { id: 15, name: 'Debrief Culte', leader: 'Staff', duration: 10 },
                    { id: 16, name: 'Installation', leader: 'Logistique', duration: 10 },
                    { id: 17, name: 'Formation', leader: 'Formateurs', duration: 60 },
                ],
                status: 'draft',
                createdAt: new Date().toISOString()
            };
            dispatch({ type: 'CREATE_SERVICE', payload: initialService });
        }

        // Load templates
        const savedTemplates = localStorage.getItem('churchflow_templates');
        if (savedTemplates) {
            dispatch({ type: 'LOAD_TEMPLATES', payload: JSON.parse(savedTemplates) });
        } else {
            // Default templates
            const defaultTemplates = [
                { id: uuidv4(), name: 'Louange', leader: 'Groupe de Louange', duration: 20 },
                { id: uuidv4(), name: 'Adoration', leader: 'Groupe de Louange', duration: 15 },
                { id: uuidv4(), name: 'Message', leader: 'Prédicateur', duration: 45 },
                { id: uuidv4(), name: 'Annonces', leader: 'Secrétariat', duration: 5 },
            ];
            dispatch({ type: 'LOAD_TEMPLATES', payload: defaultTemplates });
        }

        // Load Service Templates
        const savedServiceTemplates = localStorage.getItem('churchflow_service_templates');
        if (savedServiceTemplates) {
            dispatch({ type: 'LOAD_SERVICE_TEMPLATES', payload: JSON.parse(savedServiceTemplates) });
        } else {
            // Default service template based on the standard Sunday service
            const defaultServiceTemplates = [
                {
                    id: uuidv4(),
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
                    ],
                    createdAt: new Date().toISOString()
                }
            ];
            dispatch({ type: 'LOAD_SERVICE_TEMPLATES', payload: defaultServiceTemplates });
        }
    }, []);

    // Save to localStorage whenever services change
    useEffect(() => {
        if (state.services.length > 0) {
            localStorage.setItem('churchflow_services', JSON.stringify(state.services));
        }
    }, [state.services]);

    // Save templates
    useEffect(() => {
        if (state.templates.length > 0) {
            localStorage.setItem('churchflow_templates', JSON.stringify(state.templates));
        }
    }, [state.templates]);

    // Save Service Templates
    useEffect(() => {
        if (state.serviceTemplates.length > 0) {
            localStorage.setItem('churchflow_service_templates', JSON.stringify(state.serviceTemplates));
        }
    }, [state.serviceTemplates]);

    const createNewService = (template = null) => {
        const newService = {
            id: uuidv4(),
            theme: template?.theme || "Nouvel Événement",
            date: new Date().toISOString().split('T')[0],
            startTime: "09:00",
            startTime: "09:00",
            parts: template?.parts || [],
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        dispatch({ type: 'CREATE_SERVICE', payload: newService });
        return newService;
    };

    const updateService = (updatedService) => {
        dispatch({ type: 'UPDATE_SERVICE', payload: updatedService });
    };

    const setCurrentService = (serviceId) => {
        const service = state.services.find(s => s.id === serviceId);
        if (service) {
            dispatch({ type: 'SET_CURRENT_SERVICE', payload: service });
        }
    };

    const deleteService = (serviceId) => {
        dispatch({ type: 'DELETE_SERVICE', payload: serviceId });
    }

    const addTemplate = (template) => {
        dispatch({ type: 'ADD_TEMPLATE', payload: { ...template, id: uuidv4() } });
    };

    const deleteTemplate = (id) => {
        dispatch({ type: 'DELETE_TEMPLATE', payload: id });
    };

    // Service Template Functions
    const addServiceTemplate = (template) => {
        dispatch({ type: 'ADD_SERVICE_TEMPLATE', payload: { ...template, id: uuidv4() } });
    };

    const updateServiceTemplate = (template) => {
        dispatch({ type: 'UPDATE_SERVICE_TEMPLATE', payload: template });
    };

    const deleteServiceTemplate = (id) => {
        dispatch({ type: 'DELETE_SERVICE_TEMPLATE', payload: id });
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
