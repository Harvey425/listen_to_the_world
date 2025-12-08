import { useState, useMemo } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Search, Music, Radio } from 'lucide-react';
import { getCountryName, getLocalizedStationName } from '../../utils/localization';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ScrollableTagList } from './ScrollableTagList';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function StationList() {
    const { stations, activeStation, playStation, language, filterTag, setFilterTag, searchTerm, setSearchTerm, favorites } = useRadioStore();
    const [isOpen, setIsOpen] = useState(true);

    const t = {
        en: { title: 'STATIONS', close: 'CLOSE', searchPlaceholder: 'Search name, tag, country...', noStations: 'No stations found.' },
        zh: { title: '电台列表', close: '关闭', searchPlaceholder: '搜索名称、标签、国家...', noStations: '未找到电台' }
    };

    const text = t[language];

    // Tag Definitions for UI and Search
    const TAG_MAP = [
        { id: 'jazz', label: 'Jazz', zh: '爵士' },
        { id: 'classical', label: 'Classical', zh: '古典' },
        { id: 'pop', label: 'Pop', zh: '流行' },
        { id: 'news', label: 'News', zh: '新闻' },
        { id: 'chill', label: 'Chill', zh: '放松' },
        { id: 'retro', label: 'Retro', zh: '复古' },
        { id: 'rock', label: 'Rock', zh: '摇滚' },
        { id: 'electronic', label: 'Electronic', zh: '电子' },
        { id: 'ambient', label: 'Ambient', zh: '氛围' }
    ];

    const filteredStations = useMemo(() => {
        let result = stations;

        // 1. Tag Filter
        if (filterTag) {
            if (filterTag === 'favorites') {
                result = result.filter(s => favorites.includes(s.stationuuid));
            } else {
                result = result.filter(s => s.tags && s.tags.toLowerCase().includes(filterTag));
            }
        }

        // 2. Search Filter
        if (!searchTerm) return result;
        const lowerTerm = searchTerm.toLowerCase();

        // Pre-calculate localized tag search interest
        const matchedTagIds = TAG_MAP.filter(t => t.zh.includes(lowerTerm) || t.label.toLowerCase().includes(lowerTerm)).map(t => t.id);

        return result.filter(s => {
            // A. Basic Raw Match
            if (s.name.toLowerCase().includes(lowerTerm)) return true;
            if (s.tags && s.tags.toLowerCase().includes(lowerTerm)) return true;
            if (s.country && s.country.toLowerCase().includes(lowerTerm)) return true;

            // B. Localized Country Match (e.g. "美国" -> "US")
            const countryZh = getCountryName(s.countrycode, s.country, 'zh');
            if (countryZh && countryZh.toLowerCase().includes(lowerTerm)) return true;

            // C. Localized Station Name Search
            const nameZh = getLocalizedStationName(s.name, 'zh');
            if (nameZh.toLowerCase().includes(lowerTerm)) return true;

            // D. Localized Tag Match (Indirect)
            if (s.tags && matchedTagIds.length > 0) {
                if (matchedTagIds.some(id => s.tags && s.tags.toLowerCase().includes(id!))) return true;
            }

            return false;
        });
    }, [stations, searchTerm, filterTag, favorites]);

    // Limit displayed results for performance
    const displayStations = filteredStations.slice(0, 100);

    return (
        <>
            {/* Independent Toggle Button (Visible when closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-24 left-0 z-40 pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-r-xl border border-l-0 border-white/10 text-white/70 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:pl-4 group btn-cool"
                >
                    <Search size={18} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                </button>
            )}

            <div className={cn(
                "fixed top-20 md:top-24 left-2 md:left-6 bottom-28 md:bottom-32 w-[90vw] md:w-80 z-40 transition-transform duration-500 ease-in-out pointer-events-auto",
                isOpen ? "translate-x-0" : "-translate-x-[150%]"
            )}>
                <div className="flex flex-col h-full bg-glass-heavy backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Header & Search */}
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white font-light tracking-widest text-sm flex items-center gap-2">
                                <Radio size={16} className="text-primary" />
                                {text.title} ({filteredStations.length})
                            </h2>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchTerm(''); // Reset search
                                    setFilterTag(null); // Reset tag
                                }}
                                className="text-white/30 hover:text-white text-xs uppercase"
                            >
                                {text.close}
                            </button>
                        </div>

                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                            <input
                                type="text"
                                placeholder={text.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-white/20"
                            />
                        </div>

                        {/* Mood Filter Pill List (Interactive) */}
                        <div className="-mx-1 px-1 mb-2">
                            <ScrollableTagList
                                tags={[
                                    { id: null, label: 'All', zh: '全部' },
                                    { id: 'favorites', label: 'Favorites', zh: '我的收藏' },
                                    ...TAG_MAP
                                ]}
                                activeTag={filterTag}
                                onSelect={setFilterTag}
                                language={language as 'en' | 'zh'}
                            />
                        </div>
                    </div>


                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {displayStations.map((station) => {
                            const isActive = activeStation?.stationuuid === station.stationuuid;
                            const countryName = getCountryName(station.countrycode, station.country, language);
                            const stationName = getLocalizedStationName(station.name, language);

                            return (
                                <button
                                    key={station.stationuuid}
                                    onClick={() => playStation(station)}

                                    className={cn(
                                        "w-full text-left p-3 rounded-lg group relative overflow-hidden btn-cool active:bg-white/5",
                                        isActive
                                            ? "bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                                            : "border border-transparent"
                                    )}>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start">
                                            <h3 className={cn(
                                                "font-medium text-sm truncate pr-2",
                                                isActive ? "text-white" : "text-white/80 group-hover:text-white"
                                            )}>
                                                {stationName}
                                            </h3>
                                            {isActive && <Music size={12} className="text-primary animate-pulse shrink-0" />}
                                        </div>
                                        <div className="text-xs text-white/40 mt-1 truncate flex items-center gap-2">
                                            <span className="opacity-70">{countryName}</span>
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
            </div >
        </>
    );
}
