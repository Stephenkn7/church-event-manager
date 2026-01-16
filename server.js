import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for local network access
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Track connected tablets
    socket.on('register_device', (deviceType) => {
        if (deviceType === 'tablet') {
            socket.deviceType = 'tablet';
            updateTabletStatus();
        }
    });

    // Join a specific service room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Receive state from controller (Tablet/PC) and broadcast to others (Projector)
    socket.on('sync_state', (data) => {
        // Broadcast to everyone in the room EXCEPT sender
        socket.to(data.roomId).emit('sync_state', data.state);
        // console.log('State synced to room:', data.roomId);
    });

    // Remote trigger for projection window
    socket.on('trigger_projection', (roomId) => {
        socket.to(roomId).emit('trigger_projection');
        console.log('Projection trigger sent to room:', roomId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.deviceType === 'tablet') {
            updateTabletStatus();
        }
    });

    function updateTabletStatus() {
        // Count sockets with deviceType === 'tablet'
        // This is a bit tricky in socket.io v4, we need to iterate connected sockets
        const sockets = io.sockets.sockets;
        let tabletCount = 0;
        sockets.forEach(s => {
            if (s.deviceType === 'tablet') tabletCount++;
        });

        io.emit('tablet_status', {
            connected: tabletCount > 0,
            count: tabletCount
        });
        console.log(`Tablets connected: ${tabletCount}`);
    }

    // Activity Sync
    socket.on('activity_update', (activities) => {
        socket.broadcast.emit('activity_update', activities);
    });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
