import { create } from 'zustand';
import { fetchStations } from '../services/radioApi';
import type { Station } from '../services/radioApi';

interface RadioState {
    stations: Station[];
    loading: boolean;
    activeStation: Station | null;
    isPlaying: boolean;

    fetchStations: () => Promise<void>;
    playRandomStation: () => void;
    stopStation: () => void;
    togglePlay: () => void;

    // Advanced Navigation & UI
    language: 'en' | 'zh';
    setLanguage: (lang: 'en' | 'zh') => void;
    selectedCountry: string | null;
    hoveredCountry: string | null;
    hoveredStationName: string | null;
    isLiveCaptionOn: boolean;
    setSelectedCountry: (country: string | null) => void;
    setHoveredCountry: (country: string | null) => void;
    setHoveredStationName: (name: string | null) => void;
    toggleLiveCaption: () => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
    stations: [],
    loading: false,
    activeStation: null,
    isPlaying: false,

    // Advanced Navigation & UI
    language: 'zh',
    selectedCountry: null,
    hoveredCountry: null,
    hoveredStationName: null,
    isLiveCaptionOn: false,

    setLanguage: (lang) => set({ language: lang }),
    setSelectedCountry: (country) => set({ selectedCountry: country }),
    setHoveredCountry: (country) => set({ hoveredCountry: country }),
    setHoveredStationName: (name) => set({ hoveredStationName: name }),
    toggleLiveCaption: () => set((state) => ({ isLiveCaptionOn: !state.isLiveCaptionOn })),

    fetchStations: async () => {
        set({ loading: true });
        try {
            const stations = await fetchStations();
            set({ stations, loading: false });
        } catch (e) {
            set({ loading: false });
        }
    },

    playStation: (station: Station) => {
        set({ activeStation: station, isPlaying: true });
    },

    playRandomStation: () => {
        const { stations } = get();
        if (stations.length > 0) {
            const randomIndex = Math.floor(Math.random() * stations.length);
            const station = stations[randomIndex];
            set({
                activeStation: station,
                isPlaying: true,
                selectedCountry: station.countrycode // Auto-select country
            });
        }
    },

    stopStation: () => {
        set({ isPlaying: false });
    },

    togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
    }
}));
