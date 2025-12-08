import { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { getCountryName, getLocalizedStationName } from '../../utils/localization';
import { Play, Pause, Shuffle, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Heart } from 'lucide-react';
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
    const { activeStation, isPlaying, togglePlay, playRandomStation, language, weather } = useRadioStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
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
        let source: MediaElementAudioSourceNode | null = null;
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
                if (!source) {
                    source = audioCtx.createMediaElementSource(audio);
                    const analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 64;
                    source.connect(analyser);
                    analyser.connect(audioCtx.destination);

                    analyserRef.current = analyser;
                    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
                }
            } catch (e) {
                console.warn("Audio Context setup failed", e);
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
            audio.src = activeStation.url_resolved || activeStation.url;
            audio.volume = 0;
            audio.play().catch(e => {
                console.warn("Play failed", e);
                if (audio.crossOrigin === "anonymous") {
                    console.log("CORS failed, retrying without CORS...");
                    setUseCors(false);
                    audio.crossOrigin = null;
                    audio.src = activeStation.url_resolved || activeStation.url;
                    audio.play().catch(_e2 => setError(true));
                } else {
                    setError(true);
                }
            });

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
            <button
                onClick={playRandomStation}
                className="bg-primary/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold border border-primary/50 hover:bg-primary/30 transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
                <Shuffle size={18} />
                {language === 'zh' ? '随机播放' : 'Start Listening'}
            </button>
        </div>
    );

    return (
        <div className={cn(
            "fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-md",
            "rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden backdrop-blur-md",
            "flex flex-col gap-3 md:gap-4 text-white z-50 transition-all duration-500 components-weather-card",
            "border border-white/20"
        )}>
            {weather && <WeatherOverlay weatherCode={weather.weathercode} timeOfDay={timeOfDay} />}
            <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

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
                            <div className="flex items-center gap-3 mr-4 overflow-hidden">
                                {activeStation.favicon && (
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/20 shadow-lg">
                                        <img
                                            src={activeStation.favicon}
                                            alt={activeStation.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <h2 className="text-base md:text-lg font-bold truncate tracking-wide leading-tight">
                                        {getLocalizedStationName(activeStation.name, language)}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] md:text-xs text-primary/80 uppercase tracking-widest leading-none truncate">
                                            {getCountryName(activeStation.countrycode, activeStation.country, language)} • {activeStation.tags}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                {weather && (
                                    <div className="flex items-start gap-3">
                                        <span className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] pt-0.5">
                                            {getWeatherIconComponent(weather.weathercode)}
                                        </span>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-base md:text-lg font-bold leading-none text-white/95">
                                                {activeStation && ['US', 'BS', 'BZ', 'KY', 'PW'].includes(activeStation.countrycode)
                                                    ? `${Math.round((weather.temperature * 9 / 5) + 32)}°F`
                                                    : `${weather.temperature}°C`}
                                            </span>
                                            <span className="text-[10px] text-white/50 leading-none tracking-wider">{weather.description}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-1 md:mt-2">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={playRandomStation} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95">
                            <Shuffle size={18} />
                        </button>
                        <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/5 hover:border-white/20 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
                        </button>
                    </div>

                    <div className="flex-1 mx-3 md:mx-5 flex flex-col items-center justify-center relative group">
                        <div className="h-8 md:h-10 w-full bg-black/40 rounded-lg flex items-center justify-center overflow-hidden relative border border-white/5 shadow-inner">
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
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-red-400 transition-all hover:scale-105 active:scale-95">
                                <Heart size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
