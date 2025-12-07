import { useState, useMemo } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Search, Music, Radio } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function StationList() {
    const { stations, activeStation, playStation, language } = useRadioStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(true);

    const t = {
        en: { title: 'STATIONS', close: 'CLOSE', searchPlaceholder: 'Search name, tag, country...', noStations: 'No stations found.' },
        zh: { title: '电台列表', close: '关闭', searchPlaceholder: '搜索名称、标签、国家...', noStations: '未找到电台' }
    };

    const text = t[language];

    const filteredStations = useMemo(() => {
        if (!searchTerm) return stations;
        const lowerTerm = searchTerm.toLowerCase();
        return stations.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            (s.tags && s.tags.toLowerCase().includes(lowerTerm)) ||
            (s.country && s.country.toLowerCase().includes(lowerTerm))
        );
    }, [stations, searchTerm]);

    // Limit displayed results for performance if list is huge
    const displayStations = filteredStations.slice(0, 100);

    return (
        <div className={cn(
            "fixed top-24 left-6 bottom-32 w-80 z-40 transition-transform duration-500 ease-in-out pointer-events-auto",
            isOpen ? "translate-x-0" : "-translate-x-[110%]"
        )}>
            {/* Toggle Button (visible when closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="absolute top-0 -right-12 bg-black/40 backdrop-blur-md p-2 rounded-r-lg border border-l-0 border-white/10 text-white/70 hover:bg-white/10"
                >
                    <Search size={20} />
                </button>
            )}

            <div className="flex flex-col h-full bg-glass-heavy backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Header & Search */}
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white font-light tracking-widest text-sm flex items-center gap-2">
                            <Radio size={16} className="text-primary" />
                            {text.title} ({filteredStations.length})
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/30 hover:text-white text-xs uppercase"
                        >
                            {text.close}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                        <input
                            type="text"
                            placeholder={text.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-white/20"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {displayStations.map((station) => {
                        const isActive = activeStation?.stationuuid === station.stationuuid;
                        return (
                            <button
                                key={station.stationuuid}
                                onClick={() => playStation(station)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/20 border border-primary/30"
                                        : "hover:bg-white/5 border border-transparent hover:border-white/5"
                                )}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <h3 className={cn(
                                            "font-medium text-sm truncate pr-2",
                                            isActive ? "text-white" : "text-white/80 group-hover:text-white"
                                        )}>
                                            {station.name}
                                        </h3>
                                        {isActive && <Music size={12} className="text-primary animate-pulse shrink-0" />}
                                    </div>
                                    <div className="text-xs text-white/40 mt-1 truncate flex items-center gap-2">
                                        {station.country && <span className="opacity-70">{station.country}</span>}
                                        {station.tags && <span>• {station.tags.split(',').slice(0, 2).join(', ')}</span>}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {displayStations.length === 0 && (
                        <div className="text-center py-10 text-white/30 text-xs">
                            {text.noStations}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
