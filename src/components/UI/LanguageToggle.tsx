import { useRadioStore } from '../../store/useRadioStore';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
    const { language, setLanguage } = useRadioStore();

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-full px-3 py-1.5 transition-all text-white/80 hover:text-white"
        >
            <Globe size={14} />
            <span className="text-xs tracking-wider uppercase font-medium">
                {language === 'en' ? 'EN' : '中文'}
            </span>
        </button>
    );
}
