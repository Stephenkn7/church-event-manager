import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSocket } from '../context/SocketContext';
import { Clock, AlertTriangle } from 'lucide-react';

const Projection = () => {
    const { id } = useParams();
    const socket = useSocket();
    const [liveState, setLiveState] = useState(null);
    const [showMessage, setShowMessage] = useState(false);
    const [currentMessage, setCurrentMessage] = useState("");
    const [lastProcessedMessageId, setLastProcessedMessageId] = useState(null);
    const [lastProcessedHideId, setLastProcessedHideId] = useState(null);
    const [lastProcessedCloseId, setLastProcessedCloseId] = useState(null);

    useEffect(() => {
        const STORAGE_KEY = `churchflow_live_state_${id}`;

        const loadState = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    setLiveState(JSON.parse(raw));
                }
            } catch (e) {
                console.error("Failed to load live state", e);
            }
        };

        // Initial load
        loadState();

        // Listen for storage events (updates from other tabs)
        const handleStorage = (e) => {
            if (e.key === STORAGE_KEY) {
                loadState();
            }
        };

        // Also poll every 500ms just in case (for smoother feel if storage event lags)
        const interval = setInterval(loadState, 500);

        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [id]);

    // Socket Listener
    useEffect(() => {
        if (socket && id) {
            socket.emit('join_room', id);

            const handleSync = (newState) => {
                if (newState) setLiveState(newState);
            };

            socket.on('sync_state', handleSync);

            return () => {
                socket.off('sync_state', handleSync);
            };
        }
    }, [socket, id]);

    useEffect(() => {
        if (liveState?.isFinished) {
            window.close();
        }

        // Check for new message
        if (liveState?.lastMessageId && liveState.lastMessageId !== lastProcessedMessageId) {
            setCurrentMessage(liveState.lastMessageContent || liveState.message);
            setLastProcessedMessageId(liveState.lastMessageId);
            setShowMessage(true);

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                setShowMessage(false);
            }, 5000);

            return () => clearTimeout(timer);
        }

        // Check for force hide
        if (liveState?.forceHideMessageId && liveState.forceHideMessageId !== lastProcessedHideId) {
            setLastProcessedHideId(liveState.forceHideMessageId);
            setShowMessage(false);
        }

        // Check for close signal
        if (liveState?.closeProjectionId && liveState.closeProjectionId !== lastProcessedCloseId) {
            setLastProcessedCloseId(liveState.closeProjectionId);
            window.close();
        }
    }, [liveState, lastProcessedMessageId, lastProcessedHideId, lastProcessedCloseId]);

    if (!liveState) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-slate-500 font-mono">
                EN ATTENTE DU SIGNAL...
            </div>
        );
    }

    const { currentPart, nextPart, timer, isOvertime, isActive, theme, progressPercentage } = liveState;

    // Timer Color Logic
    let timerColorClass = "text-white";
    let timerAnimationClass = "";

    if (isOvertime) {
        timerColorClass = "text-red-600";
        timerAnimationClass = "animate-pulse";
    } else {
        if (progressPercentage <= 10) {
            timerColorClass = "text-red-500";
            timerAnimationClass = "animate-pulse"; // or shake
        } else if (progressPercentage <= 25) {
            timerColorClass = "text-orange-500";
        } else {
            timerColorClass = "text-white";
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden cursor-none">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between opacity-50">
                <h1 className="text-xl font-bold uppercase tracking-widest">{theme}</h1>
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", isActive ? "bg-red-500 animate-pulse" : "bg-slate-600")} />
                    <span className="text-sm font-mono">LIVE</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-12">

                {/* Glow Effect */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] blur-[150px] rounded-full transition-colors duration-1000",
                    isOvertime ? "bg-red-600/20" : (isActive ? "bg-indigo-600/20" : "bg-slate-800/20")
                )} />

                <div className="relative z-10 text-center w-full max-w-5xl space-y-12">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tight leading-tight">
                        {currentPart?.name || "En Pause"}
                    </h2>

                    <p className="text-4xl text-slate-300 font-medium pb-8 border-b border-slate-800/50">
                        {currentPart?.leader}
                    </p>

                    <div className={cn(
                        "transition-colors duration-300",
                        timerAnimationClass
                    )}>
                        {showMessage ? (
                            <div className="animate-in zoom-in fade-in slide-in-from-bottom-4 duration-500 bg-indigo-900/80 backdrop-blur-md rounded-3xl p-8 border border-indigo-500/50 shadow-2xl mx-auto max-w-4xl">
                                <div className="flex items-center justify-center gap-4 mb-4 text-indigo-300 uppercase tracking-widest text-sm font-bold">
                                    <AlertTriangle className="w-5 h-5" />
                                    Message de la régie
                                </div>
                                <p className="text-5xl md:text-7xl font-bold text-white leading-tight break-words">
                                    {currentMessage}
                                </p>
                            </div>
                        ) : (
                            <div className={cn(
                                "text-[15rem] leading-none font-mono font-bold tracking-tighter tabular-nums",
                                timerColorClass
                            )}>
                                {isOvertime && "-"}{timer}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Next Up */}
            <div className="h-48 bg-slate-900 border-t border-slate-800 p-8 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-2">À SUIVRE</span>
                    {nextPart ? (
                        <div className="flex flex-col">
                            <span className="text-4xl font-bold text-white">{nextPart.name}</span>
                            <span className="text-xl text-slate-400 mt-1">{nextPart.leader}</span>
                        </div>
                    ) : (
                        <span className="text-2xl text-slate-500 italic">Fin du service</span>
                    )}
                </div>
                <div className="text-right opacity-50">
                    <Clock className="w-12 h-12 mb-2 ml-auto" />
                    <span className="text-2xl font-mono">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Projection;
