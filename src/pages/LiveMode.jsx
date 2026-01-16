import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '../context/ServiceContext';
import { useSocket } from '../context/SocketContext';
import { Play, Pause, SkipForward, CheckCircle, Clock, Cast, AlertTriangle, X, Send, MessageSquare, Trash2, StopCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const LiveMode = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { services, updateService } = useService();
    const socket = useSocket();

    const [service, setService] = useState(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // In seconds

    // Modal state for Unforeseen events
    const [showUnforeseenModal, setShowUnforeseenModal] = useState(false);
    const [unforeseenName, setUnforeseenName] = useState("");

    // Operator Message State
    const [operatorMessage, setOperatorMessage] = useState("");
    const [lastMessageId, setLastMessageId] = useState(null);
    const [forceHideMessageId, setForceHideMessageId] = useState(null);
    const [isProjectionOpen, setIsProjectionOpen] = useState(false);
    const [closeProjectionId, setCloseProjectionId] = useState(null);

    const timerRef = useRef(null);

    useEffect(() => {
        const foundService = services.find(s => s.id === id);
        if (foundService) {
            setService(JSON.parse(JSON.stringify(foundService)));
        } else {
            navigate('/');
        }
    }, [id, services, navigate]);

    // Join Socket Room
    useEffect(() => {
        if (socket && id) {
            socket.emit('join_room', id);
        }
    }, [socket, id]);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive]);

    // Broadcast state to projection window
    useEffect(() => {
        if (!service) return;

        const currentPart = service.parts[currentPartIndex];
        const nextPart = service.parts[currentPartIndex + 1];
        const plannedSeconds = (parseInt(currentPart?.duration) || 0) * 60;
        const remainingSeconds = plannedSeconds - elapsedTime;
        const isOvertime = remainingSeconds < 0;

        // Calculate progress percentage (0 to 100, where 100 is start, 0 is end)
        let progressPercentage = 0;
        if (plannedSeconds > 0) {
            progressPercentage = Math.max(0, Math.min(100, (remainingSeconds / plannedSeconds) * 100));
        }

        const liveState = {
            currentPart,
            nextPart,
            timer: formatTime(remainingSeconds),
            isOvertime,
            isActive,
            theme: service.theme,
            progressPercentage,
            // Message state
            message: operatorMessage, // Current typing content (not used in projection usually)
            lastMessageId: lastMessageId, // ID to trigger the popup
            lastMessageContent: operatorMessage, // The content sent with the ID
            isFinished: false, // Will be true when ending service
            forceHideMessageId, // Signal to force hide message
            closeProjectionId // Signal to close projection window
        };

        localStorage.setItem(`churchflow_live_state_${id}`, JSON.stringify(liveState));
        if (socket) {
            socket.emit('sync_state', { roomId: id, state: liveState });
        }
    }, [service, currentPartIndex, elapsedTime, isActive, id, lastMessageId, forceHideMessageId, closeProjectionId, socket]); // Add dependencies

    if (!service) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

    const currentPart = service.parts[currentPartIndex];
    const plannedSeconds = (parseInt(currentPart?.duration) || 0) * 60;
    const remainingSeconds = plannedSeconds - elapsedTime;
    const isOvertime = remainingSeconds < 0;

    const formatTime = (seconds) => {
        const absSeconds = Math.abs(seconds);
        const m = Math.floor(absSeconds / 60);
        const s = absSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        // Save actual duration for current part
        const updatedParts = [...service.parts];
        updatedParts[currentPartIndex].actualDuration = elapsedTime;

        const updatedService = { ...service, parts: updatedParts };
        setService(updatedService);
        // Persist to store (optional, or wait until end)
        updateService(updatedService);

        // Stop timer, reset
        setIsActive(true);
        setElapsedTime(0);

        // Move to next or finish
        if (currentPartIndex < service.parts.length - 1) {
            setCurrentPartIndex(prev => prev + 1);
        } else {
            // FINISH SERVICE
            // 1. Persist finished status to main storage
            const completedService = { ...service, isFinished: true, status: 'finished' };
            setService(completedService);
            updateService(completedService);

            // 2. Clear Live State / Update it to finished
            const finalState = {
                currentPart: null,
                nextPart: null,
                timer: "0:00",
                isOvertime: false,
                isActive: false,
                theme: service.theme,
                isFinished: true,
                message: "",
                lastMessageId: null,
                forceHideMessageId: null,
                closeProjectionId: Date.now() // Trigger close on finish
            };
            localStorage.setItem(`churchflow_live_state_${id}`, JSON.stringify(finalState));
            setIsProjectionOpen(false);
            navigate(`/stats/${id}`);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const handleOpenUnforeseenModal = () => {
        setUnforeseenName(""); // Reset
        setShowUnforeseenModal(true);
    };

    const confirmAddUnforeseen = (e) => {
        e.preventDefault();

        const finalName = unforeseenName.trim() || "⚠️ IMPRÉVU";

        const newPart = {
            id: Date.now().toString(),
            name: finalName,
            leader: "",
            duration: 0,
            type: "unforeseen",
            actualDuration: 0
        };

        const updatedParts = [...service.parts];
        updatedParts.splice(currentPartIndex + 1, 0, newPart);

        const updatedService = { ...service, parts: updatedParts };
        setService(updatedService);
        updateService(updatedService);
        setShowUnforeseenModal(false);
    };
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!operatorMessage.trim()) return;
        setLastMessageId(Date.now());
        // Note: The Effect will pick up the new ID and broadcast it
        // We clear the input after a short delay or keep it? 
        // Let's keep it but maybe show a "Sent!" indicator?
        // or just rely on the projection showing it.
        // Let's clear it for fresh entry.
        // Actually, we need to pass the content IN the effect when the ID changes.
        // The effect sends `operatorMessage` as `lastMessageContent`.
        // So we shouldn't clear it immediately if we rely on that state.
        // Better pattern: store `sentMessageContent` separate or just let the effect handle it.
        // We'll let the effect run, then clear input? No, if we clear input, the effect runs again with empty message.
        // We need a separate state for "Message to be broadcasted".

        // Actually, simpler: just update `lastMessageId` is enough to trigger the effect.
        // We will clear the input after sending to allow new messages?
        // If we clear `operatorMessage`, the effect will re-run and send empty message content? 
        // Yes. So we need to NOT rely on `operatorMessage` for the broadcast content if we want to clear the UI.

        // For simplicity in this iteration: We won't clear the input immediately, 
        // or we use a ref for the broadcasted message. But keeping it simple:
        // User types -> state updates. User hits send -> ID updates. 
        // Projection sees new ID -> shows content associated with it.
        // If we want to type a new message, we just type over.
    };

    const handleClearMessage = () => {
        setForceHideMessageId(Date.now());
    };
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative">

            {/* Top Bar */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div>
                    <h1 className="text-xl font-bold text-slate-100">{service.theme}</h1>
                    <p className="text-slate-400 text-sm">Live Service Monitor</p>
                </div>
                <div className="text-right flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (isProjectionOpen) {
                                setCloseProjectionId(Date.now());
                                setIsProjectionOpen(false);
                            } else {
                                window.open(`/projection/${id}`, '_blank', 'width=1280,height=720');
                                setIsProjectionOpen(true);
                                setCloseProjectionId(null); // Reset close signal
                                if (socket) {
                                    socket.emit('trigger_projection', id);
                                }
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm",
                            isProjectionOpen
                                ? "bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-100"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        )}
                    >
                        {isProjectionOpen ? (
                            <>
                                <StopCircle className="w-4 h-4" />
                                Stop Projection
                            </>
                        ) : (
                            <>
                                <Cast className="w-4 h-4" />
                                Ouvrir Projection
                            </>
                        )}
                    </button>
                    <div className="text-3xl font-mono font-bold tracking-widest text-slate-100">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px_1fr_320px]">

                {/* Left: Schedule List */}
                <div className="hidden lg:block border-r border-slate-800 overflow-y-auto bg-slate-900/50">
                    {service.parts.map((part, index) => (
                        <div
                            key={part.id}
                            className={cn(
                                "p-4 border-b border-slate-800 transition-colors",
                                index === currentPartIndex ? "bg-indigo-900/40 border-l-4 border-l-indigo-500" : "opacity-60",
                                index < currentPartIndex && "opacity-40"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm text-slate-300">
                                    {index + 1}. {part.name}
                                </span>
                                {index < currentPartIndex && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-slate-500">
                                <span>{part.leader}</span>
                                <span>{part.duration}m</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center: Main Display */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">

                    {/* Background glow effects */}
                    <div className={cn(
                        "absolute w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 opacity-20",
                        isActive ? (isOvertime ? "bg-red-600" : "bg-indigo-600") : "bg-slate-700"
                    )} />

                    <div className="relative z-10 text-center space-y-8 w-full max-w-2xl">

                        {/* Current Part Info */}
                        <div className="space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                                En cours
                            </span>
                            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight truncate px-4">
                                {currentPart?.name}
                            </h2>
                            <p className="text-2xl text-slate-400 font-medium">
                                {currentPart?.leader}
                            </p>
                        </div>

                        {/* Timer */}
                        <div className={cn(
                            "text-[10rem] md:text-[12rem] font-black font-mono leading-none tracking-tighter transition-colors tabular-nums",
                            isOvertime ? "text-red-500" : (isActive ? "text-white" : "text-slate-500")
                        )}>
                            {isOvertime && "-"}{formatTime(remainingSeconds)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={toggleTimer}
                                className={cn(
                                    "p-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-2xl",
                                    isActive ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                                )}
                            >
                                {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center px-8 py-5 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all hover:border-slate-500 group"
                            >
                                <span className="font-bold text-lg mr-3">
                                    {currentPartIndex < service.parts.length - 1 ? "Élément Suivant" : "Terminer le Culte"}
                                </span>
                                <SkipForward className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Unforeseen Button */}
                        <div className="pt-8">
                            <button
                                onClick={handleOpenUnforeseenModal}
                                className="flex items-center gap-2 px-6 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-xl text-red-400 hover:text-red-300 transition-all mx-auto text-sm font-bold uppercase tracking-wide"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                Ajouter un Imprévu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Operator Controls (New) */}
                <div className="hidden lg:flex flex-col border-l border-slate-800 bg-slate-900/50 p-6 w-80">
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Communication
                    </h3>

                    <form onSubmit={handleSendMessage} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message à l'intervenant</label>
                        <textarea
                            value={operatorMessage}
                            onChange={(e) => setOperatorMessage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3 resize-none h-24"
                            placeholder="Écrivez un message court..."
                        ></textarea>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={!operatorMessage.trim()}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                            >
                                <Send className="w-3 h-3" />
                                Projeter (5s)
                            </button>
                            <button
                                type="button"
                                onClick={handleClearMessage}
                                className="px-3 py-2 bg-slate-700 hover:bg-red-900/50 hover:text-red-400 border border-slate-600 rounded-lg text-slate-300 transition-colors"
                                title="Retirer le message"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                            "Projeter" affiche 5s. "Retirer" efface immédiatement.
                        </p>
                    </form>
                </div>
            </div>



            {/* Bottom Bar: Next Up */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">À suivre</span>
                    {service.parts[currentPartIndex + 1] ? (
                        <div className="flex items-center gap-3">
                            <div className="font-semibold text-slate-200">{service.parts[currentPartIndex + 1].name}</div>
                            <div className="text-sm text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {service.parts[currentPartIndex + 1].leader}
                            </div>
                        </div>
                    ) : (
                        <span className="text-slate-500 italic">Fin du service</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Durée Planifiée: {currentPart?.duration}m</span>
                </div>
            </div>

            {/* MODAL: Add Unforeseen */}
            {
                showUnforeseenModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                    Ajouter un Imprévu
                                </h3>
                                <button onClick={() => setShowUnforeseenModal(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={confirmAddUnforeseen} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Description de l'événement</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Panne Micro, Annonce Spéciale..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        value={unforeseenName}
                                        onChange={(e) => setUnforeseenName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowUnforeseenModal(false)}
                                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold transition-colors"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default LiveMode;
