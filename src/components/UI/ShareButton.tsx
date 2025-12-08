import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useRadioStore } from '../../store/useRadioStore';
import { motion, AnimatePresence } from 'framer-motion';
import { encodeStationId } from '../../utils/shareProtocol';

export function ShareButton({ className }: { className?: string }) {
    const { activeStation } = useRadioStore();
    const [copied, setCopied] = useState(false);

    if (!activeStation) return null;

    const handleShare = () => {
        // Use Starlight Protocol to encrypt/encode the ID
        const code = encodeStationId(activeStation.stationuuid);
        const url = `${window.location.origin}?s=${code}`;

        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative">
            <button
                onClick={handleShare}
                className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white hover:scale-105 active:scale-95 ${className || ''}`}
                title="Share Station"
            >
                {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>

            <AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-white/10 backdrop-blur-md"
                    >
                        Link Copied!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
