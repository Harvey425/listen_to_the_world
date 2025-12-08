import { RadioBrowserApi } from 'radio-browser-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for fetch in older Node environments
if (!globalThis.fetch) {
    console.warn("Native fetch not found. Ensure use Node 18+");
}

const api = new RadioBrowserApi('My3DEarthRadioIndexer');

// Resolve paths (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_PATH = path.resolve(__dirname, '../src/data/stations.json');

// Corrections map (shared with app logic)
const STATION_CORRECTIONS = {
    "BRTV北京音乐广播": { lat: 39.9042, long: 116.4074 },
    "Beijing Music Radio": { lat: 39.9042, long: 116.4074 },
};

async function main() {
    try {
        console.log('🌍 Fetching top 5,000 stations from Radio Browser API...');

        // Fetch high quality stations
        const stations = await api.searchStations({
            limit: 5000,
            order: 'clickCount',
            reverse: true,
            hideBroken: true,
            hasGeoInfo: true // We need lat/long for the globe
        });

        console.log(`📦 Fetched ${stations.length} stations. Processing...`);

        // Map and Clean
        const cleanStations = stations.map(s => {
            // Apply Corrections
            const correction = STATION_CORRECTIONS[s.name] || STATION_CORRECTIONS[s.name.trim()];
            const lat = correction ? correction.lat : (s.geoLat || 0);
            const long = correction ? correction.long : (s.geoLong || 0);

            return {
                stationuuid: s.id,
                name: s.name.trim(),
                url: s.url,
                url_resolved: s.urlResolved,
                homepage: s.homepage,
                favicon: s.favicon,
                tags: s.tags.join(','),
                country: s.country,
                countrycode: s.countryCode,
                state: s.state,
                clickcount: s.clickCount,
                votes: s.votes,
                geo_lat: lat,
                geo_long: long
            };
        });

        // Filter out bad data (no url, or 0,0 coords if strict)
        // We allow 0,0 for now as some valid stations might lack precise geo, 
        // but for a 3D globe app, we prioritize ones with location.
        const validStations = cleanStations.filter(s =>
            s.url_resolved &&
            s.name &&
            !(s.geo_lat === 0 && s.geo_long === 0) // Exclude Null Island entries if possible to keep globe clean
        );

        console.log(`✨ Processed ${validStations.length} valid stations.`);

        // Ensure Directory Exists
        const dir = path.dirname(TARGET_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write JSON
        fs.writeFileSync(TARGET_PATH, JSON.stringify(validStations, null, 2), 'utf-8');

        console.log(`✅ Successfully saved to: ${TARGET_PATH}`);

    } catch (error) {
        console.error("❌ Error fetching stations:", error);
        process.exit(1);
    }
}

main();
