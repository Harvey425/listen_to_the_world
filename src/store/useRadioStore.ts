import { create } from 'zustand';
import { fetchStations, radioService } from '../services/radioApi';
import type { Station } from '../types/radio';
import { fetchWeather, type WeatherData } from '../services/weatherApi';

interface RadioState {
    stations: Station[];
    loading: boolean;
    activeStation: Station | null;
    isPlaying: boolean;

    fetchStations: () => Promise<void>;
    playLocation: (lat: number, lng: number) => Promise<void>;
    playStation: (station: Station) => Promise<void>;
    playRandomStation: () => void;
    stopStation: () => void;
    togglePlay: () => void;

    // Advanced Navigation & UI
    language: 'en' | 'zh';
    setLanguage: (lang: 'en' | 'zh') => void;
    selectedCountry: string | null;
    hoveredCountry: string | null;
    hoveredCountryCode: string | null;
    hoveredStationName: string | null;
    setSelectedCountry: (country: string | null) => void;
    setHoveredCountry: (name: string | null, code: string | null) => void;
    setHoveredStationName: (name: string | null) => void;
    filterTag: string | null;
    setFilterTag: (tag: string | null) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    weather: WeatherData | null;

    // Deep Link Support
    resolveStationById: (id: string) => Promise<Station | null>;
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
    hoveredCountryCode: null,
    hoveredStationName: null,

    filterTag: null,
    searchTerm: '',
    weather: null,

    setLanguage: (lang) => set({ language: lang }),
    setSelectedCountry: (country) => set({ selectedCountry: country }),
    setHoveredCountry: (name, code) => set({ hoveredCountry: name, hoveredCountryCode: code }),
    setHoveredStationName: (name) => set({ hoveredStationName: name }),

    setFilterTag: (tag: string | null) => set({ filterTag: tag }),
    setSearchTerm: (term: string) => set({ searchTerm: term }),

    fetchStations: async () => {

        set({ loading: true });
        try {
            const stations = await fetchStations();
            set({ stations, loading: false });
        } catch (e) {
            set({ loading: false });
        }
    },

    playLocation: async (lat: number, lng: number) => {
        set({ loading: true });
        try {
            const stations = await radioService.getStationsByLocation(lat, lng);
            if (stations.length > 0) {
                const station = stations[0];
                set({
                    stations, // Update list to show nearby stations
                    activeStation: station,
                    isPlaying: true,
                    weather: null,
                    loading: false
                });

                // Fetch weather for new station
                const { language } = get();
                if (station.geo_lat && station.geo_long) {
                    fetchWeather(station.geo_lat, station.geo_long, language).then(weather => {
                        if (get().activeStation?.stationuuid === station.stationuuid) {
                            set({ weather });
                        }
                    });
                }
            } else {
                console.warn("No stations found near location");
                set({ loading: false });
            }
        } catch (e) {
            console.error("Failed to play location", e);
            set({ loading: false });
        }
    },

    playStation: async (station: Station) => {
        set({ activeStation: station, isPlaying: true, weather: null }); // Reset weather while loading

        // Fetch weather asynchronously (non-blocking)
        const { language } = get();
        // Ensure lat/long exists and is valid number
        if (station.geo_lat && station.geo_long) {
            const weather = await fetchWeather(station.geo_lat, station.geo_long, language);

            // Check if user hasn't switched station while fetching
            if (get().activeStation?.stationuuid === station.stationuuid) {
                set({ weather });
            }
        }
    },

    playRandomStation: () => {
        const { stations } = get();
        if (stations.length > 0) {
            // Prioritize HTTPS stations (less likely to be blocked/broken)
            const httpsStations = stations.filter(s => s.url_resolved.startsWith('https'));
            const pool = httpsStations.length > 0 ? httpsStations : stations;

            const randomIndex = Math.floor(Math.random() * pool.length);
            const station = pool[randomIndex];

            set({
                activeStation: station,
                isPlaying: true,
                selectedCountry: station.countrycode, // Auto-select country
                weather: null
            });

            // Fetch weather
            const { language } = get();
            if (station.geo_lat && station.geo_long) {
                fetchWeather(station.geo_lat, station.geo_long, language).then(weather => {
                    if (get().activeStation?.stationuuid === station.stationuuid) {
                        set({ weather });
                    }
                });
            }
        }
    },

    stopStation: () => {
        set({ isPlaying: false });
    },

    togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
    },

    resolveStationById: async (id: string) => {
        const { language } = get();

        // Delegate to Service (Smart Cache -> API)
        // This decouples store state from data availability
        set({ loading: true });

        try {
            const station = await radioService.resolveStation(id);

            if (station) {
                set({
                    activeStation: station,
                    isPlaying: false, // Wait for overlay
                    selectedCountry: station.countrycode,
                    loading: false
                });

                // Fetch weather
                if (station.geo_lat && station.geo_long) {
                    fetchWeather(station.geo_lat, station.geo_long, language).then(w => {
                        if (get().activeStation?.stationuuid === id) set({ weather: w });
                    });
                }
                return station;
            }
        } catch (e) {
            console.error("Resolve failed", e);
        }

        set({ loading: false });
        return null;
    }
}));
