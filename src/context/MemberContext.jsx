import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

const MemberContext = createContext();

const initialState = {
    members: [],
    loading: true
};

const memberReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'LOAD_MEMBERS':
            return { ...state, members: action.payload, loading: false };
        case 'ADD_MEMBER':
            return { ...state, members: [...state.members, action.payload] };
        case 'UPDATE_MEMBER':
            return {
                ...state,
                members: state.members.map(m => m.id === action.payload.id ? action.payload : m)
            };
        case 'DELETE_MEMBER':
            return {
                ...state,
                members: state.members.filter(m => m.id !== action.payload)
            };
        default:
            return state;
    }
};

export const MemberProvider = ({ children }) => {
    const [state, dispatch] = useReducer(memberReducer, initialState);

    // Load members from Supabase
    useEffect(() => {
        loadMembers();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('members_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'members' },
                (payload) => {
                    console.log('Member change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        dispatch({ type: 'ADD_MEMBER', payload: payload.new });
                    } else if (payload.eventType === 'UPDATE') {
                        dispatch({ type: 'UPDATE_MEMBER', payload: payload.new });
                    } else if (payload.eventType === 'DELETE') {
                        dispatch({ type: 'DELETE_MEMBER', payload: payload.old.id });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                dispatch({ type: 'LOAD_MEMBERS', payload: data });
            } else {
                // Seed data if empty
                await seedMembers();
            }
        } catch (error) {
            console.error('Error loading members:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const seedMembers = async () => {
        const seeds = [
            { id: uuidv4(), matricule: 'PAS-001', name: 'Pasteur Oyoua Bertrand', phone: '+2250101006903', function: 'Pasteur' },
            { id: uuidv4(), matricule: 'PAS-002', name: 'Pasteur Blandine Oyoua', phone: '+2250102391908', function: 'Pasteur' },
            { id: uuidv4(), matricule: 'MOD-001', name: 'Daniel Zamblé', phone: '+2250708652008', function: 'Responsable' },
            { id: uuidv4(), matricule: 'LOU-001', name: 'Stéphanie Talloh', phone: '+2250707516195', function: 'Leader' },
            { id: uuidv4(), matricule: 'RES-001', name: 'Aquilas Yao', phone: '+2250707285575', function: 'Responsable' },
            { id: uuidv4(), matricule: 'SER-001', name: 'Ange Nahi', phone: '+2250758900768', function: 'Serviteur' },
            { id: uuidv4(), matricule: 'SER-002', name: 'Syntyche Yangra', phone: '+2250759981988', function: 'Serviteur' },
        ];

        try {
            const { data, error } = await supabase
                .from('members')
                .insert(seeds)
                .select();

            if (error) throw error;
            dispatch({ type: 'LOAD_MEMBERS', payload: data });
        } catch (error) {
            console.error('Error seeding members:', error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addMember = async (memberData) => {
        const newMember = {
            id: uuidv4(),
            matricule: memberData.matricule || generateMatricule(memberData),
            ...memberData
        };

        try {
            const { data, error } = await supabase
                .from('members')
                .insert([newMember])
                .select()
                .single();

            if (error) throw error;
            // Realtime will handle the update
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const updateMember = async (member) => {
        try {
            const { error } = await supabase
                .from('members')
                .update(member)
                .eq('id', member.id);

            if (error) throw error;
            // Realtime will handle the update
        } catch (error) {
            console.error('Error updating member:', error);
        }
    };

    const deleteMember = async (id) => {
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            // Realtime will handle the update
        } catch (error) {
            console.error('Error deleting member:', error);
        }
    };

    const generateMatricule = (data) => {
        const prefix = data.function ? data.function.substring(0, 3).toUpperCase() : 'MEM';
        const random = Math.floor(100 + Math.random() * 900);
        return `${prefix}-${random}`;
    };

    return (
        <MemberContext.Provider value={{
            members: state.members,
            loading: state.loading,
            addMember,
            updateMember,
            deleteMember
        }}>
            {children}
        </MemberContext.Provider>
    );
};

export const useMembers = () => {
    const context = useContext(MemberContext);
    if (!context) throw new Error('useMembers must be used within MemberProvider');
    return context;
};
