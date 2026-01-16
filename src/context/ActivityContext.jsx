import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from './SocketContext';
import { supabase } from '../lib/supabase';

const ActivityContext = createContext();

const initialState = {
    activities: [],
    loading: true
};

const activityReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'LOAD_ACTIVITIES':
            return { ...state, activities: action.payload, loading: false };
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

    // Load activities from Supabase
    useEffect(() => {
        loadActivities();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('activities_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'activities' },
                (payload) => {
                    console.log('Activity change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        dispatch({ type: 'ADD_ACTIVITY', payload: payload.new });
                    } else if (payload.eventType === 'UPDATE') {
                        dispatch({ type: 'UPDATE_ACTIVITY', payload: payload.new });
                    } else if (payload.eventType === 'DELETE') {
                        dispatch({ type: 'DELETE_ACTIVITY', payload: payload.old.id });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Socket Listener for incoming updates (keep for live mode sync)
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

    const loadActivities = async () => {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                dispatch({ type: 'LOAD_ACTIVITIES', payload: data });
            } else {
                // Seed data if empty
                await seedActivities();
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const seedActivities = async () => {
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

        try {
            const { data, error } = await supabase
                .from('activities')
                .insert(seeds)
                .select();

            if (error) throw error;
            dispatch({ type: 'LOAD_ACTIVITIES', payload: data });
        } catch (error) {
            console.error('Error seeding activities:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addActivity = async (name) => {
        const newActivity = {
            id: uuidv4(),
            name
        };

        try {
            const { data, error } = await supabase
                .from('activities')
                .insert([newActivity])
                .select()
                .single();

            if (error) throw error;

            // Also emit via socket for live mode
            if (socket) {
                const updatedList = [...state.activities, data];
                socket.emit('activity_update', updatedList);
            }
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    };

    const deleteActivity = async (id) => {
        try {
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Also emit via socket for live mode
            if (socket) {
                const updatedList = state.activities.filter(a => a.id !== id);
                socket.emit('activity_update', updatedList);
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const updateActivity = async (activity) => {
        try {
            const { error } = await supabase
                .from('activities')
                .update(activity)
                .eq('id', activity.id);

            if (error) throw error;

            // Also emit via socket for live mode
            if (socket) {
                const updatedList = state.activities.map(a => a.id === activity.id ? activity : a);
                socket.emit('activity_update', updatedList);
            }
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    };

    return (
        <ActivityContext.Provider value={{
            activities: state.activities,
            loading: state.loading,
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
