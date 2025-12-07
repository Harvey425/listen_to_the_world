import { useEffect, useState, useRef } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Mic, MicOff, Type } from 'lucide-react';

const CAPTION_TEMPLATES = {
    news: [
        "Breaking news: Updates coming in from {country}...",
        "Current events: Stay tuned for the top stories of the hour.",
        "Live report: Weather conditions in the capital remain clear.",
        "World news: Developing story from the region..."
    ],
    music: [
        "Now playing: The latest hits on {station}.",
        "Musical journey: bringing you the best rhythm.",
        "Up next: A classic track you haven't heard in years.",
        "Feel the beat, feel the world."
    ],
    talk: [
        "Discussion: Joining us today is a special guest...",
        "Phone lines are open, give us a call.",
        "Topic of the day: How technology changes our lives.",
        "Stay with us for more conversation."
    ],
    general: [
        "Broadcasting live from {country}...",
        "You are listening to {station}.",
        "Global sounds, local stories.",
        "Connecting the world, one station at a time.",
        "Signal clear. Enjoy the broadcast."
    ]
};

export function CaptionOverlay() {
    const { isPlaying, activeStation, isLiveCaptionOn, toggleLiveCaption } = useRadioStore();
    const [displayedText, setDisplayedText] = useState('');
    const [currentPhrase, setCurrentPhrase] = useState('');
    const [charIndex, setCharIndex] = useState(0);

    // 1. Content Generator
    useEffect(() => {
        if (!isLiveCaptionOn || !isPlaying || !activeStation) {
            setCurrentPhrase('');
            setDisplayedText('');
            return;
        }

        let timeout: any;

        const generatePhrase = () => {
            const tags = (activeStation.tags || '').toLowerCase();
            let category = 'general';

            if (tags.includes('news') || tags.includes('info')) category = 'news';
            else if (tags.includes('talk') || tags.includes('sport')) category = 'talk';
            else if (tags.includes('music') || tags.includes('pop') || tags.includes('rock')) category = 'music';

            const templates = CAPTION_TEMPLATES[category as keyof typeof CAPTION_TEMPLATES] || CAPTION_TEMPLATES.general;
            const rawTemplate = templates[Math.floor(Math.random() * templates.length)];

            // Format
            const text = rawTemplate
                .replace('{country}', activeStation.country || 'Location')
                .replace('{station}', activeStation.name || 'Station');

            setCurrentPhrase(text);
            setCharIndex(0);
            setDisplayedText('');

            // Generate next phrase after this one finishes + pause
            // Estimate duration based on length * speed (e.g. 50ms per char) + 2000ms pause
            const duration = text.length * 50 + 3000;
            timeout = setTimeout(generatePhrase, duration);
        };

        generatePhrase();

        return () => clearTimeout(timeout);
    }, [isLiveCaptionOn, isPlaying, activeStation]);

    // 2. Typewriter Effect
    useEffect(() => {
        if (!currentPhrase) return;

        if (charIndex < currentPhrase.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + currentPhrase[charIndex]);
                setCharIndex(prev => prev + 1);
            }, 50); // Typing speed
            return () => clearTimeout(timer);
        }
    }, [charIndex, currentPhrase]);

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-40 pointer-events-auto">
            <button
                onClick={toggleLiveCaption}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs uppercase tracking-widest ${isLiveCaptionOn
                    ? "bg-white/10 border-primary/50 text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                    : "bg-black/40 border-white/10 text-white/50 hover:bg-white/5"
                    }`}
            >
                {isLiveCaptionOn ? <Mic size={14} className="text-primary animate-pulse" /> : <MicOff size={14} />}
                {isLiveCaptionOn ? "Live Captions ON" : "Live Captions OFF"}
            </button>

            {isLiveCaptionOn && isPlaying && displayedText && (
                <div className="max-w-2xl text-center mt-4">
                    <p className="text-xl md:text-3xl font-light text-white/90 drop-shadow-md font-mono leading-relaxed bg-black/30 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/5">
                        {displayedText}
                        <span className="inline-block w-2 h-6 bg-primary ml-1 animate-pulse align-middle" />
                    </p>
                </div>
            )}
        </div>
    );
}
