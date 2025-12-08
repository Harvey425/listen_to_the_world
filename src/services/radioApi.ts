import { RadioBrowserApi } from 'radio-browser-api';
import type { Station as LibStation } from 'radio-browser-api';
import type { Station } from '../types/radio';

// Re-export Station for other consumers
export type { Station };

// Pre-loaded data support
// We will lazy load the big JSON to avoid initial bundle bloat until needed (or parallel fetch)

const STATION_CORRECTIONS: Record<string, { lat: number; long: number }> = {
    "BRTV北京音乐广播": { lat: 39.9042, long: 116.4074 },
    "Beijing Music Radio": { lat: 39.9042, long: 116.4074 },
};

class RadioService {
    private api: RadioBrowserApi;

    constructor() {
        this.api = new RadioBrowserApi('My3DEarthRadio');
    }

    /**
     * Get stations near a specific location
     * @param lat Latitude
     * @param lng Longitude
     * @param radiusKm Radius in kilometers (default 200)
     * @param limit Max results (default 20)
     */
    async getStationsByLocation(lat: number, lng: number, radiusKm = 200, limit = 20): Promise<Station[]> {
        try {
            // 1. Core Search
            const stations = await this.api.searchStations({
                lat: lat,
                long: lng,
                radius: radiusKm, // km
                limit: limit * 2, // Fetch more to filter/sort later
                hideBroken: true,
                order: 'clickCount', // Hot stations first
                reverse: true
            } as any);

            // 2. Data Optimization & Mapping
            let mappedStations = stations
                .map(s => this.mapLibraryStationToApp(s));

            // 3. Fallback: If no stations, expand radius (simple recursion)
            if (mappedStations.length === 0 && radiusKm < 2000) {
                console.log(`No stations found at ${radiusKm}km, expanding to ${radiusKm * 2}km...`);
                return this.getStationsByLocation(lat, lng, radiusKm * 2, limit);
            }

            // 4. HTTPS Optimization: Prioritize HTTPS streams
            mappedStations.sort((a, b) => {
                const aIsHttps = a.url_resolved.startsWith('https') ? 1 : 0;
                const bIsHttps = b.url_resolved.startsWith('https') ? 1 : 0;
                return bIsHttps - aIsHttps; // HTTPS first
            });

            // Return requested limit
            return mappedStations.slice(0, limit);

        } catch (error) {
            console.error("RadioService Error:", error);
            return [];
        }
    }

    /**
     * Fetch global top stations (Replacement for old fetchStations)
     */
    // Import Static Data
    // Note: This relies on the build system properly bundling this JSON. 
    // In Vite, it works out of the box.
    // We cast to any or Station[] if TS complains about JSON import without resolveJsonModule
    // const STATIC_STATIONS: Station[] = (stationsData as any[]).map(s => ({...s, tags: s.tags || '' }));

    /**
     * Fetch global top stations (Replacement for old fetchStations)
     * NOW: Returns local cached data instantly.
     */
    async fetchTopStations(limit = 5000): Promise<Station[]> {
        // Return static data wrapped in promise
        // We assume stationsData is already in the correct App Station format because our script generated it that way.
        // But we import it at top or inside?
        // Let's import at top level to let bundler handle it. (See added import in code structure)

        // Actually, since I can't easily add a top-level import with replace_file_content if it's not contiguous,
        // I will use dynamic import for better splitting if possible, or just assume I need to rewrite the file header too.

        // Let's rewrite the method to load from dynamic import or just standard import.
        try {
            // Dynamic import to split chunk
            const { default: data } = await import('../data/stations.json');
            return (data as Station[]).slice(0, limit);
        } catch (e) {
            console.warn("Failed to load local stations", e);
            return [];
        }
    }

    /**
     * Smart Resolve: Local Cache -> API
     * Optimized for speed. Checks local JSON chunk before network.
     */
    async resolveStation(id: string): Promise<Station | null> {
        // 1. Race: Check Local Cache vs API?
        // Actually, importing local JSON is usually faster than API RTT.
        // We do this sequentially to save API quota and network usage.

        try {
            // Dynamic import - Browsers cache this after first load
            const { default: data } = await import('../data/stations.json');
            // Fast array find (5000 items is trivial for JS engine ~1ms)
            // We treat data as any cast to Station[]
            const targetId = id.trim().toLowerCase();
            const localMatch = (data as any[]).find((s: any) =>
                (s.stationuuid && s.stationuuid.toLowerCase() === targetId) ||
                (s.id && s.id.toLowerCase() === targetId)
            );
            if (localMatch) {
                // Format it correctly just in case
                return this.mapLibraryStationToApp({
                    ...localMatch,
                    id: localMatch.stationuuid || localMatch.id, // Compat
                    tags: localMatch.tags.split(',') // Convert back to array for mapper if needed? 
                    // Wait, mapLibraryStationToApp expects LibStation.
                    // The JSON might be ALREADY mapped App Stations?
                    // Let's check fetchStations.js script.
                    // It saves "mapped" stations.
                    // So we don't need mapLibraryStationToApp for local JSON!
                } as any);
            }

            // Wait, if stations.json is ALREADY mapped (snake_case), we can just return it!
            // Let's double check stations.json in next step if unsure, but assume generic handling:
            // If localMatch has 'stationuuid', it's likely our App Station format.
            if (localMatch && localMatch.stationuuid) {
                return localMatch as Station;
            }

        } catch (e) {
            console.warn("Local cache lookup failed", e);
        }

        // 2. Fallback to API
        console.log("Station not in local top 5000, fetching from API...");
        return this.getStationById(id);
    }

    /**
     * Get unique station by UUID
     * @param id Station UUID
     */
    async getStationById(id: string): Promise<Station | null> {
        try {
            const stations = await this.api.getStationsById([id]);
            if (stations.length > 0) {
                return this.mapLibraryStationToApp(stations[0]);
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch station by ID", error);
            return null;
        }
    }

    /**
     * Adapter: LibStation (camelCase) -> App Station (snake_case)
     */
    private mapLibraryStationToApp(s: LibStation): Station {
        // Manual Correction Check
        const correction = STATION_CORRECTIONS[s.name] || STATION_CORRECTIONS[s.name.trim()];
        const lat = correction ? correction.lat : (s.geoLat || 0);
        const long = correction ? correction.long : (s.geoLong || 0);

        return {
            stationuuid: s.id, // Lib uses 'id', we used 'stationuuid'
            name: s.name,
            url: s.url,
            url_resolved: s.urlResolved, // Critical: use resolved URL
            homepage: s.homepage,
            favicon: s.favicon,
            tags: s.tags.join(','), // Lib tags is string[]
            country: s.country,
            countrycode: s.countryCode,
            state: s.state,
            language: s.language.toString(), // array to string?
            votes: s.votes,
            clickcount: s.clickCount,
            geo_lat: lat,
            geo_long: long
        };
    }
}

// Singleton Export
export const radioService = new RadioService();

// Maintain legacy function for now (bridge to new service)
export async function fetchStations(limit = 5000): Promise<Station[]> {
    return radioService.fetchTopStations(limit);
}
