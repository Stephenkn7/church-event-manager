import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from './SocketContext';

const ActivityContext = createContext();

const initialState = {
    activities: []
};

const activityReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD_ACTIVITIES':
            return { ...state, activities: action.payload };
        case 'ADD_ACTIVITY':
            return { ...state, activities: [...state.activities, action.payload] };
        case 'DELETE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.filter(a => a.id !== action.payload)
            };
        case 'UPDATE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.map(a => a.id === action.payload.id ? action.payload : a)
            };
        default:
            return state;
    }
};

export const ActivityProvider = ({ children }) => {
    const [state, dispatch] = useReducer(activityReducer, initialState);
    const { socket } = useSocket();

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem('churchflow_activities');
        if (saved) {
            dispatch({ type: 'LOAD_ACTIVITIES', payload: JSON.parse(saved) });
        } else {
            // Seed data if empty - Based on the standard Sunday service template
            const seeds = [
                { id: uuidv4(), name: 'PRE-CULTE (PRIERE DES SERVITEURS)' },
                { id: uuidv4(), name: 'BRIEF AVANT CULTE' },
                { id: uuidv4(), name: 'BALANCE ET DERNIER REGLAGE' },
                { id: uuidv4(), name: 'DEBUT LOUANGE ET ADORATION' },
                { id: uuidv4(), name: "ENTREE DE L'AUDITOIRE" },
                { id: uuidv4(), name: 'MODERATEUR CULTE' },
                { id: uuidv4(), name: 'LOUANGE ET ADORATION' },
                { id: uuidv4(), name: 'SAINTE CENE' },
                { id: uuidv4(), name: 'DIMES ET OFFRANDES' },
                { id: uuidv4(), name: 'ANNONCE' },
                { id: uuidv4(), name: 'INSTANT DE TRIBUS ET FDV' },
                { id: uuidv4(), name: 'MESSAGE ET MINISTERE' },
                { id: uuidv4(), name: 'DERNIERE ANNONCE ET PRESENTATION DES NOUVEAUX' },
                { id: uuidv4(), name: 'PRIERE DE FIN ET RENVOIE' },
                { id: uuidv4(), name: "TRIBUS ET REPAS D'AMOUR" },
                { id: uuidv4(), name: 'DEBRIEF CULTE' },
                { id: uuidv4(), name: 'INSTALLATION' },
                { id: uuidv4(), name: 'FORMATION' },
            ];
            dispatch({ type: 'LOAD_ACTIVITIES', payload: seeds });
        }
    }, []);

    // Socket Listener for incoming updates
    useEffect(() => {
        if (!socket) return;

        const handleActivityUpdate = (updatedActivities) => {
            console.log("Received activity update from socket", updatedActivities);
            dispatch({ type: 'LOAD_ACTIVITIES', payload: updatedActivities });
        };

        socket.on('activity_update', handleActivityUpdate);

        return () => {
            socket.off('activity_update', handleActivityUpdate);
        };
    }, [socket]);

    // Persistence
    useEffect(() => {
        if (state.activities.length > 0) {
            localStorage.setItem('churchflow_activities', JSON.stringify(state.activities));
        }
    }, [state.activities]);

    const addActivity = (name) => {
        const newActivity = {
            id: uuidv4(),
            name
        };
        const updatedList = [...state.activities, newActivity];

        dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });

        if (socket) {
            socket.emit('activity_update', updatedList);
        }
    };

    const deleteActivity = (id) => {
        const updatedList = state.activities.filter(a => a.id !== id);

        dispatch({ type: 'DELETE_ACTIVITY', payload: id });

        if (socket) {
            socket.emit('activity_update', updatedList);
        }
    };

    const updateActivity = (activity) => {
        const updatedList = state.activities.map(a => a.id === activity.id ? activity : a);

        dispatch({ type: 'UPDATE_ACTIVITY', payload: activity });

        if (socket) {
            socket.emit('activity_update', updatedList);
        }
    };

    return (
        <ActivityContext.Provider value={{
            activities: state.activities,
            addActivity,
            deleteActivity,
            updateActivity
        }}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivities = () => {
    const context = useContext(ActivityContext);
    if (!context) throw new Error('useActivities must be used within ActivityProvider');
    return context;
};
