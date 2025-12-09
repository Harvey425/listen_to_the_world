import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useRadioStore } from '../../store/useRadioStore';
import { getCountryName, getLocalizedStationName } from '../../utils/localization';
import { Play, Pause, Shuffle, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Heart, ExternalLink } from 'lucide-react';
import { WeatherOverlay } from '../Effects/WeatherOverlay';
import { AnimatePresence, motion } from 'framer-motion';
import { ShareButton } from './ShareButton';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper to get Lucide icon
const getWeatherIconComponent = (code: number) => {
    if (code === 0) return <Sun size={24} className="text-yellow-400 fill-yellow-400/20" />;
    if (code >= 1 && code <= 3) return <Cloud size={24} className="text-gray-200 fill-white/10" />;
    if (code === 45 || code === 48) return <CloudFog size={24} className="text-blue-200/80" />;
    if (code >= 51 && code <= 67) return <CloudDrizzle size={24} className="text-blue-300" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={24} className="text-white" />;
    if (code >= 80 && code <= 82) return <CloudRain size={24} className="text-blue-400" />;
    if (code >= 85 && code <= 86) return <CloudSnow size={24} className="text-white" />;
    if (code >= 95) return <CloudLightning size={24} className="text-yellow-300" />;
    return <Sun size={24} className="text-gray-400" />; // Fallback
};

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function PlayerPanel() {
    const { activeStation, isPlaying, togglePlay, playRandomStation, language, weather, favorites, toggleFavorite, setAudioElement } = useRadioStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Register audio element for global control
    useEffect(() => {
        setAudioElement(audioRef.current);
    }, [setAudioElement]);
    const [volume, setVolume] = useState(0.8);
    const [_error, setError] = useState(false);
    const [localTimeStr, setLocalTimeStr] = useState<string>('');
    const fadeInterval = useRef<any>(null);

    // Audio Analyzer Refs
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const barsRef = useRef<HTMLDivElement[]>([]);
    const [useCors, setUseCors] = useState(true);

    // Audio Analysis Setup
    useEffect(() => {
        if (!isPlaying || !audioRef.current) return;

        const audio = audioRef.current;
        let audioCtx: AudioContext | null = null;
        // sourceRef is used instead of local source variable
        let animationFrameId: number;

        const initAudio = () => {
            if (!window.AudioContext && !(window as any).webkitAudioContext) return;
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            try {
                if (!sourceRef.current) {
                    const source = audioCtx.createMediaElementSource(audio);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 64;
                    source.connect(analyser);
                    analyser.connect(audioCtx.destination);

                    sourceRef.current = source;
                    analyserRef.current = analyser;
                    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
                }
            } catch (e) {
                // Ignore "already connected" error if it happens race-condition style
                const err = e as Error;
                if (!err.message?.includes('already connected')) {
                    console.warn("Audio Context setup failed", e);
                }
            }
        };

        const renderFrame = () => {
            if (analyserRef.current && dataArrayRef.current && isPlaying) {
                analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
                const hasData = dataArrayRef.current.some(v => v > 0);

                if (hasData) {
                    for (let i = 0; i < 8; i++) {
                        const val = dataArrayRef.current[i * 2];
                        const heightPercent = Math.max(10, (val / 255) * 100);
                        if (barsRef.current[i]) {
                            barsRef.current[i].style.height = `${heightPercent}%`;
                            barsRef.current[i].style.boxShadow = `0 0 ${val / 20}px rgba(0,243,255,0.6)`;
                        }
                    }
                } else {
                    const time = Date.now() / 200;
                    for (let i = 0; i < 8; i++) {
                        const h = 20 + Math.abs(Math.sin(time + i)) * 60 + Math.random() * 10;
                        if (barsRef.current[i]) {
                            barsRef.current[i].style.height = `${h}%`;
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(renderFrame);
        };

        if (isPlaying) {
            initAudio();
            renderFrame();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, activeStation]);

    // Audio Fading & Playback
    useEffect(() => {
        if (!activeStation || !audioRef.current) return;
        const audio = audioRef.current;

        setUseCors(true);
        audio.crossOrigin = "anonymous";

        const applyNewStation = () => {
            const url = activeStation.url_resolved || activeStation.url;
            const isHls = url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl');

            // Clean previous HLS
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // HLS Logic
            if (isHls && Hls.isSupported()) {
                const hls = new Hls();
                hlsRef.current = hls;
                hls.loadSource(url);
                hls.attachMedia(audio);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (isPlaying) audio.play().catch(e => console.warn("HLS Play failed", e));
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        console.warn("HLS Fatal Error", data);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                break;
                        }
                    }
                });
            } else if (audio.canPlayType('application/vnd.apple.mpegurl') && (isHls || url.includes('.m3u8'))) {
                // Native HLS (Safari)
                audio.src = url;
                if (isPlaying) audio.play().catch(e => console.warn("Native HLS Play failed", e));
            } else {
                // Standard MP3/stream
                audio.src = url;
                audio.volume = 0;
                if (isPlaying) {
                    audio.play().catch(e => {
                        console.warn("Play failed", e);
                        if (audio.crossOrigin === "anonymous") {
                            console.log("CORS failed, retrying without CORS...");
                            setUseCors(false);
                            audio.crossOrigin = null;
                            audio.src = url;
                            audio.play().catch(_e2 => setError(true));
                        } else {
                            setError(true);
                        }
                    });
                }
            }


            let vol = 0;
            if (fadeInterval.current) clearInterval(fadeInterval.current);
            fadeInterval.current = setInterval(() => {
                vol += 0.05;
                if (vol >= 0.8) {
                    vol = 0.8;
                    clearInterval(fadeInterval.current);
                }
                if (audioRef.current) audioRef.current.volume = vol;
                setVolume(vol);
            }, 50);
        };

        applyNewStation();

        return () => {
            if (fadeInterval.current) clearInterval(fadeInterval.current);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [activeStation]);

    // Sync play/pause
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                if (audioRef.current.volume === 0) audioRef.current.volume = volume;
                audioRef.current.play().catch(() => { });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Live Clock
    useEffect(() => {
        if (!weather) {
            setLocalTimeStr('');
            return;
        }
        const updateTime = () => {
            if (!weather) return;
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const targetTime = new Date(utc + (weather.utcOffsetSeconds * 1000));
            const hours = targetTime.getHours().toString().padStart(2, '0');
            const minutes = targetTime.getMinutes().toString().padStart(2, '0');
            setLocalTimeStr(`${hours}:${minutes}`);
        };
        updateTime();
        const timer = setInterval(updateTime, 10000);
        return () => clearInterval(timer);
    }, [weather]);

    // Time of Day
    const timeOfDay: 'dawn' | 'day' | 'dusk' | 'night' = (() => {
        if (!weather) return 'day';
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const targetTime = new Date(utc + (weather.utcOffsetSeconds * 1000));
        const hour = targetTime.getHours();
        if (hour >= 5 && hour < 7) return 'dawn';
        if (hour >= 7 && hour < 17) return 'day';
        if (hour >= 17 && hour < 20) return 'dusk';
        return 'night';
    })();

    if (!activeStation) return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center pointer-events-auto">
            {/* Premium Idle Shuffle Button with Shimmer Effect */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0, 243, 255, 0.2), 0 0 40px rgba(0, 123, 255, 0.1); }
                    50% { box-shadow: 0 0 30px rgba(0, 243, 255, 0.4), 0 0 60px rgba(0, 123, 255, 0.2); }
                }
                .btn-shimmer {
                    background: linear-gradient(
                        90deg, 
                        transparent 0%, 
                        rgba(255,255,255,0.08) 20%, 
                        rgba(255,255,255,0.15) 50%, 
                        rgba(255,255,255,0.08) 80%, 
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 3s ease-in-out infinite;
                }
                .btn-pulse-ring {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
            `}</style>
            <button
                onClick={playRandomStation}
                className="relative overflow-hidden bg-white/5 backdrop-blur-xl px-8 py-4 rounded-full text-white font-medium border border-white/30 hover:bg-white/15 transition-all flex items-center gap-3 text-base shadow-2xl shadow-black/30 active:scale-[0.98] hover:shadow-primary/20 hover:border-primary/50 tracking-tight group btn-pulse-ring"
            >
                {/* Shimmer overlay */}
                <span className="absolute inset-0 btn-shimmer rounded-full pointer-events-none" />

                <Shuffle size={20} className="opacity-80 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-500" />
                <span className="relative z-10">{language === 'zh' ? '随机播放' : 'Start Listening'}</span>
            </button>
        </div>
    );

    return (
        <div className={cn(
            "fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-md",
            "p-4 md:p-6", // Removed overflow-hidden to allow glow to breathe
            "glass-premium", // New Aurora Glow
            "flex flex-col gap-3 md:gap-4 text-white z-50 transition-all duration-500 components-weather-card",
            !activeStation && "translate-y-[200%] opacity-0",
            activeStation && "translate-y-0 opacity-100"
        )}>
            <div className="rounded-[2rem] overflow-hidden absolute inset-0 z-0">
                {/* Inner clipper for background textures if needed, matching parent radius */}
            </div>
            {weather && <WeatherOverlay weatherCode={weather.weathercode} timeOfDay={timeOfDay} />}
            {/* Subtle noise texture overlay if possible, or just gradient hint */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0 rounded-[2rem]" />

            <div className="relative z-10 flex flex-col gap-3 md:gap-4">
                <audio
                    ref={audioRef}
                    crossOrigin={useCors ? "anonymous" : undefined}
                    onError={(e) => {
                        const target = e.currentTarget;
                        if (useCors) {
                            console.log("CORS playback failed, falling back to basic stream...");
                            setUseCors(false);
                            const currentSrc = target.src;
                            target.src = '';
                            target.src = currentSrc;
                            target.play();
                        } else {
                            setError(true);
                        }
                    }}
                />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStation.stationuuid}
                        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col gap-3 md:gap-4"
                    >
                        <div className="flex justify-between items-center">
                            {/* Interactive Header Area: Logo + Title */}
                            <div
                                onClick={() => activeStation.homepage && window.open(activeStation.homepage, '_blank')}
                                className={cn(
                                    "flex items-center gap-3 mr-4 overflow-hidden rounded-xl p-2 -ml-2 transition-all duration-300 select-none",
                                    activeStation.homepage ? "cursor-pointer hover:bg-white/5 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] group border border-transparent hover:border-white/5" : ""
                                )}
                                title={activeStation.homepage ? "Visit Station Homepage" : undefined}
                            >
                                {activeStation.favicon && (
                                    <div className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/20 shadow-lg transition-all duration-300",
                                        activeStation.homepage && "group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:border-white/30"
                                    )}>
                                        <img
                                            src={activeStation.favicon}
                                            alt={activeStation.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                                <div className="overflow-hidden flex flex-col justify-center">
                                    <h2 className={cn(
                                        "text-base md:text-lg font-bold truncate tracking-tight leading-tight transition-colors duration-300",
                                        activeStation.homepage && "group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                    )}>
                                        {getLocalizedStationName(activeStation.name, language)}
                                        {activeStation.homepage && (
                                            <ExternalLink size={12} className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-0.5 text-white/50" />
                                        )}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-widest leading-none truncate group-hover:text-white/80 transition-colors">
                                            {getCountryName(activeStation.countrycode, activeStation.country, language)} • {activeStation.tags}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                {weather && (
                                    <div className="flex items-start gap-3">
                                        <span className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pt-0.5 opacity-90">
                                            {getWeatherIconComponent(weather.weathercode)}
                                        </span>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-base md:text-lg font-bold leading-none text-white/95 tracking-tight">
                                                {activeStation && ['US', 'BS', 'BZ', 'KY', 'PW'].includes(activeStation.countrycode)
                                                    ? `${Math.round((weather.temperature * 9 / 5) + 32)}°F`
                                                    : `${weather.temperature}°C`}
                                            </span>
                                            <span className="text-[10px] text-white/50 leading-none tracking-wide">{weather.description}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-1 md:mt-2">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={playRandomStation} className="relative overflow-hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-[0.96] border border-white/20 hover:border-primary/50 btn-pulse-ring group">
                            <span className="absolute inset-0 btn-shimmer rounded-full pointer-events-none" />
                            <Shuffle size={18} className="relative z-10 group-hover:rotate-180 transition-all duration-500" />
                        </button>
                        <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all active:scale-[0.96] shadow-lg shadow-black/20 hover:shadow-white/5">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                        </button>
                    </div>

                    <div className="flex-1 mx-3 md:mx-5 flex flex-col items-center justify-center relative group">
                        <div className="h-8 md:h-10 w-full bg-black/20 rounded-xl flex items-center justify-center overflow-hidden relative border border-white/5 shadow-inner">
                            {/* Audio Visualizer */}
                            <div className="flex items-end justify-center w-full h-full gap-1 p-1">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        ref={(el) => { if (el) barsRef.current[i] = el; }}
                                        className="w-1 md:w-1.5 bg-primary/80 rounded-t-sm transition-all duration-75"
                                        style={{ height: '20%', boxShadow: '0 0 5px rgba(0,243,255,0.4)' }}
                                    />
                                ))}
                            </div>
                        </div>
                        {localTimeStr && (
                            <span className="absolute -bottom-4 text-[10px] font-mono font-medium text-primary/60 tracking-widest leading-none transition-opacity group-hover:text-primary">
                                {localTimeStr}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Actions (Moved from Center) */}
                        {/* Actions (Moved from Center) */}
                        <div className="flex items-center gap-3">
                            <ShareButton />
                            <button
                                onClick={() => activeStation && toggleFavorite(activeStation.stationuuid)}
                                className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95",
                                    activeStation && favorites.includes(activeStation.stationuuid) ? "text-red-500" : "text-white/70 hover:text-red-400"
                                )}>
                                <Heart size={18} fill={activeStation && favorites.includes(activeStation.stationuuid) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
