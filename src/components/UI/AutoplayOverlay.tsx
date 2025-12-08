import { motion } from 'framer-motion';
import { Play, Radio, X } from 'lucide-react';
import type { Station } from '../../types/radio';
import { useRadioStore } from '../../store/useRadioStore';
import { useMemo } from 'react';
import { LanguageToggle } from './LanguageToggle';

interface AutoplayOverlayProps {
    station: Station | null;
    isSearching?: boolean;
    onPlay: () => void;
    onClose: () => void;
}

export function AutoplayOverlay({ station, isSearching, onPlay, onClose }: AutoplayOverlayProps) {
    const { language } = useRadioStore();

    const t = useMemo(() => ({
        en: {
            incoming: "Incoming Signal",
            searching: "Acquiring Signal...",
            tuneIn: "TUNE IN",
        },
        zh: {
            incoming: "接收到信号",
            searching: "正在对接信号...",
            tuneIn: "接听信号",
        }
    }), [language]);

    // Show if station exists OR searching
    if (!station && !isSearching) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/80 border border-primary/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.2)] text-center max-w-md mx-4 relative overflow-hidden min-w-[300px]"
            >
                {/* Language Toggle */}
                <div className="absolute top-4 left-4 z-20">
                    <LanguageToggle />
                </div>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Animated Scanline Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse border border-primary/50">
                        <Radio size={32} className="text-primary" />
                    </div>

                    {isSearching ? (
                        <div className="space-y-2 py-4">
                            <h2 className="text-white/60 text-sm tracking-[0.2em] font-mono uppercase animate-pulse">
                                {t[language].searching}
                            </h2>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-white/60 text-sm tracking-[0.2em] font-mono uppercase">{t[language].incoming}</h2>
                                <h1 className="text-2xl font-bold text-white leading-tight">
                                    {station?.name}
                                </h1>
                                <p className="text-white/50 text-sm">
                                    {station?.country}
                                </p>
                            </div>

                            <button
                                onClick={onPlay}
                                className="group relative px-8 py-3 bg-primary text-black font-bold tracking-widest hover:bg-white transition-colors rounded overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Play size={18} fill="currentColor" /> {t[language].tuneIn}
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
