import { useState, useMemo } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Search, Music, Radio } from 'lucide-react';
import { getCountryName, getLocalizedStationName } from '../../utils/localization';
import { getLocalizedTag, getLocalizedLanguage } from '../../utils/translations';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ScrollableTagList } from './ScrollableTagList';
import { AnimatePresence, motion } from 'framer-motion';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function StationList() {
    const { stations, activeStation, playStation, language, filterTag, setFilterTag, searchTerm, setSearchTerm, favorites } = useRadioStore();
    // Default open on desktop, closed on mobile
    const [isOpen, setIsOpen] = useState(() => window.innerWidth > 768);

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
            } else if (filterTag === 'recommended') {
                // Top 500 by votes, explicit location only
                result = result
                    .filter(s => !s.is_geo_estimated && s.geo_lat !== 0)
                    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                    .slice(0, 500);
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
            if (s.language && s.language.toLowerCase().includes(lowerTerm)) return true;
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

            // E. Deep Localized Search (Tags/Language generic)
            // If user types "爵士" -> Check against GENRE_MAP translation of station's tags
            if (language === 'zh' || lowerTerm.match(/[\u4e00-\u9fa5]/)) {
                // Check if station tags (localized) match search
                const localizedTags = (s.tags || '').split(',').map(t => getLocalizedTag(t, 'zh'));
                if (localizedTags.some(t => t.includes(lowerTerm))) return true;

                // Check language localized
                const localizedLang = getLocalizedLanguage(s.language || '', 'zh');
                if (localizedLang.includes(lowerTerm)) return true;
            }

            return false;
        });
    }, [stations, searchTerm, filterTag, favorites, language]);

    // Limit displayed results for performance
    const displayStations = filteredStations.slice(0, 100);

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed top-24 left-0 z-40 pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-r-xl border border-l-0 border-white/10 text-white/70 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:pl-4 group btn-cool"
                    >
                        <Search size={18} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                        className="fixed top-20 md:top-24 left-2 md:left-6 bottom-48 md:bottom-32 w-[90vw] md:w-80 z-40 pointer-events-auto"
                    >
                        <div className="flex flex-col h-full glass-premium rounded-2xl overflow-hidden relative">
                            {/* Header & Search */}
                            <div className="p-4 border-b border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-white font-medium tracking-wide text-sm flex items-center gap-2 opacity-90">
                                        <Radio size={16} className="text-primary/80" />
                                        {text.title} <span className="text-white/40 font-normal">({filteredStations.length})</span>
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setSearchTerm(''); // Reset search
                                            setFilterTag(null); // Reset tag
                                        }}
                                        className="text-white/40 hover:text-white text-xs uppercase tracking-wider font-medium transition-colors"
                                    >
                                        {text.close}
                                    </button>
                                </div >

                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                                    <input
                                        type="text"
                                        placeholder={text.searchPlaceholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/10 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-black/20 placeholder:text-white/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Mood Filter Pill List (Interactive) */}
                                <div className="mt-4 mb-1">
                                    <ScrollableTagList
                                        tags={[
                                            { id: 'favorites', label: 'Favorites', zh: '收藏' },
                                            { id: null, label: 'All', zh: '全部' },
                                            { id: 'recommended', label: 'Recommended', zh: '推荐' },
                                            ...TAG_MAP
                                        ]}
                                        activeTag={filterTag}
                                        onSelect={setFilterTag}
                                        language={language as 'en' | 'zh'}
                                    />
                                </div>
                            </div >


                            {/* List */}
                            < div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1" >
                                {
                                    displayStations.map((station) => {
                                        const isActive = activeStation?.stationuuid === station.stationuuid;
                                        const countryName = getCountryName(station.countrycode, station.country, language);
                                        const stationName = getLocalizedStationName(station.name, language);

                                        return (
                                            <button
                                                key={station.stationuuid}
                                                onClick={() => playStation(station)}

                                                className={cn(
                                                    "w-full text-left p-3 rounded-xl group relative overflow-hidden btn-cool active:bg-white/5 outline-none",
                                                    isActive
                                                        ? "bg-white/10 border border-white/10 shadow-lg shadow-black/10" // Cleaner active state
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
                                                        {station.language && <span className="text-white/30">• {getLocalizedLanguage(station.language, language as 'zh' | 'en')}</span>}
                                                        {station.votes !== undefined && station.votes > 0 && <span className="text-white/30">• {station.votes} {language === 'zh' ? '票' : 'votes'}</span>}
                                                        {station.tags && <span className="text-white/30">• {station.tags.split(',').slice(0, 2).map(t => getLocalizedTag(t, language as 'zh' | 'en')).join(', ')}</span>}

                                                        {/* Location Warning Badge Removed per user request */}

                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                }


                                {
                                    displayStations.length === 0 && (
                                        <div className="text-center py-10 text-white/30 text-xs">
                                            {text.noStations}
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
