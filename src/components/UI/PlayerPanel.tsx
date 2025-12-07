import { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Play, Pause, Volume2, Shuffle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function PlayerPanel() {
    const { activeStation, isPlaying, togglePlay, playRandomStation, language } = useRadioStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(0.8);
    const [error, setError] = useState(false);
    const fadeInterval = useRef<any>(null);

    // Audio Fading Logic
    useEffect(() => {
        if (!activeStation || !audioRef.current) return;

        const audio = audioRef.current;
        const TARGET_VOLUME = volume;
        const FADE_STEP = 0.05;
        const FADE_TIME = 50; // ms

        // Clear any existing fade
        if (fadeInterval.current) clearInterval(fadeInterval.current);

        const applyNewStation = () => {
            audio.src = activeStation.url_resolved || activeStation.url;
            audio.volume = 0; // Start at 0
            audio.play().then(() => {
                setError(false);
                // Fade In
                fadeInterval.current = setInterval(() => {
                    if (audio.volume < TARGET_VOLUME) {
                        audio.volume = Math.min(TARGET_VOLUME, audio.volume + FADE_STEP);
                    } else {
                        clearInterval(fadeInterval.current);
                    }
                }, FADE_TIME);
            }).catch(e => {
                console.error("Playback failed", e);
                setError(true);
            });
        };

        // If already playing, Fade Out first
        if (!audio.paused && audio.currentTime > 0) {
            fadeInterval.current = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(0, audio.volume - FADE_STEP);
                } else {
                    clearInterval(fadeInterval.current);
                    applyNewStation();
                }
            }, FADE_TIME);
        } else {
            // First play, just fade in
            applyNewStation();
        }

        return () => {
            if (fadeInterval.current) clearInterval(fadeInterval.current);
        };
    }, [activeStation]); // Only triggered when station changes

    // Sync play/pause state
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                // Ensure volume is restored if it was faded out (edge case)
                if (audioRef.current.volume === 0) audioRef.current.volume = volume;
                audioRef.current.play().catch(() => { });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Volume Control
    useEffect(() => {
        if (audioRef.current) {
            // Update current volume but also our state target
            // Using direct assignment here might conflict with fading if fading is active
            // Ideally we wait for fade to finish, but for simplicity:
            audioRef.current.volume = volume;
        }
    }, [volume]);

    if (!activeStation) return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
            <button
                onClick={playRandomStation}
                className="bg-primary/20 backdrop-blur-md px-6 py-3 rounded-full text-primary font-bold border border-primary/50 hover:bg-primary/30 transition-all flex items-center gap-2"
            >
                <Shuffle size={18} />
                {language === 'zh' ? '随机播放' : 'Start Listening'}
            </button>
        </div>
    );

    return (
        <div className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md",
            "bg-glass-heavy backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl",
            "flex flex-col gap-4 text-white z-50 transition-all duration-500 transform translate-y-0"
        )}>
            {/* Hidden Audio */}
            <audio ref={audioRef} onError={() => setError(true)} />

            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                    <h2 className="text-lg font-bold truncate tracking-wide">{activeStation.name}</h2>
                    <p className="text-xs text-primary/80 uppercase tracking-widest mt-1">
                        {activeStation.country} • {activeStation.tags}
                    </p>
                </div>
                {error && <span className="text-red-500 text-xs font-mono">STREAM ERROR</span>}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4">
                    {/* Random Button */}
                    <button
                        onClick={playRandomStation}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        title="Random Station"
                    >
                        <Shuffle size={18} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                    </button>
                </div>

                {/* Visualizer Placeholder */}
                <div className="flex-1 mx-4 h-8 bg-black/20 rounded flex items-center justify-center overflow-hidden relative">
                    {/* Fake waveform animation */}
                    {isPlaying && (
                        <div className="flex items-end justify-center gap-1 h-full w-full px-2 py-1">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-primary rounded-t-sm animate-pulse"
                                    style={{
                                        height: `${Math.random() * 100}%`,
                                        animationDuration: `${0.5 + Math.random() * 0.5}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    {!isPlaying && <div className="h-[1px] w-full bg-white/10" />}
                </div>

                <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-white/50" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-20 accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
