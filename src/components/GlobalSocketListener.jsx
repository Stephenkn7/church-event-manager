import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const GlobalSocketListener = () => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleTrigger = (roomId) => {
            console.log("Remote Projection Triggered for room:", roomId);
            const url = `/projection/${roomId}`;
            // Use a specific name to allow focusing existing window
            window.open(url, `projection_${roomId}`, 'width=1280,height=720');
        };

        socket.on('trigger_projection', handleTrigger);

        return () => {
            socket.off('trigger_projection', handleTrigger);
        };
    }, [socket]);

    return null;
};

export default GlobalSocketListener;
