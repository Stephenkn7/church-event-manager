import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MemberContext = createContext();

const initialState = {
    members: []
};

const memberReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD_MEMBERS':
            return { ...state, members: action.payload };
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

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem('churchflow_members');
        if (saved) {
            dispatch({ type: 'LOAD_MEMBERS', payload: JSON.parse(saved) });
        } else {
            // Seed data if empty
            const seeds = [
                { id: uuidv4(), matricule: 'PAS-001', name: 'Pasteur Oyoua Bertrand', phone: '+2250101006903', function: 'Pasteur' },
                { id: uuidv4(), matricule: 'PAS-002', name: 'Pasteur Blandine Oyoua', phone: '+2250102391908', function: 'Pasteur' },
                { id: uuidv4(), matricule: 'MOD-001', name: 'Daniel Zamblé', phone: '+2250708652008', function: 'Responsable' },
                { id: uuidv4(), matricule: 'LOU-001', name: 'Stéphanie Talloh', phone: '+2250707516195', function: 'Leader' },
                { id: uuidv4(), matricule: 'RES-001', name: 'Aquilas Yao', phone: '+2250707285575', function: 'Responsable' },
                { id: uuidv4(), matricule: 'SER-001', name: 'Ange Nahi', phone: '+2250758900768', function: 'Serviteur' },
                { id: uuidv4(), matricule: 'SER-002', name: 'Syntyche Yangra', phone: '+2250759981988', function: 'Serviteur' },
            ];
            dispatch({ type: 'LOAD_MEMBERS', payload: seeds });
        }
    }, []);

    // Persistence
    useEffect(() => {
        if (state.members.length > 0) {
            localStorage.setItem('churchflow_members', JSON.stringify(state.members));
        }
    }, [state.members]);

    const addMember = (memberData) => {
        const newMember = {
            id: uuidv4(),
            matricule: memberData.matricule || generateMatricule(memberData),
            ...memberData
        };
        dispatch({ type: 'ADD_MEMBER', payload: newMember });
    };

    const updateMember = (member) => {
        dispatch({ type: 'UPDATE_MEMBER', payload: member });
    };

    const deleteMember = (id) => {
        dispatch({ type: 'DELETE_MEMBER', payload: id });
    };

    // Helper to generate IDs like "PAS-123"
    const generateMatricule = (data) => {
        const prefix = data.function ? data.function.substring(0, 3).toUpperCase() : 'MEM';
        const random = Math.floor(100 + Math.random() * 900);
        return `${prefix}-${random}`;
    };

    return (
        <MemberContext.Provider value={{
            members: state.members,
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
