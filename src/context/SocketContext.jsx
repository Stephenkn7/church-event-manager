import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isTabletConnected, setIsTabletConnected] = useState(false);
    const [deviceRole, setDeviceRole] = useState(() => localStorage.getItem('churchflow_device_role') || 'desktop');

    useEffect(() => {
        // Connect to the socket server
        const newSocket = io(`http://${window.location.hostname}:3001`);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            // Register based on current state (which is initialized from localStorage)
            // accessing state inside here might be stale if not careful, but 'connect' happens once mostly or uses closure
            // Better to read from localStorage directly or ref, but let's use the helper function logic below
            const currentRole = localStorage.getItem('churchflow_device_role') || 'desktop';
            newSocket.emit('register_device', currentRole);
        });

        newSocket.on('tablet_status', (status) => {
            console.log('Tablet status update:', status);
            setIsTabletConnected(status.connected);
        });

        return () => newSocket.close();
    }, []);

    const registerAsTablet = () => {
        setDeviceRole('tablet');
        localStorage.setItem('churchflow_device_role', 'tablet');
        if (socket) {
            socket.emit('register_device', 'tablet');
            // Optional: Reload to ensure clean state if other components rely on it
            window.location.reload();
        }
    };

    const registerAsDesktop = () => {
        setDeviceRole('desktop');
        localStorage.removeItem('churchflow_device_role');
        if (socket) {
            socket.emit('register_device', 'desktop');
            window.location.reload();
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isTabletConnected, deviceRole, registerAsTablet, registerAsDesktop }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
