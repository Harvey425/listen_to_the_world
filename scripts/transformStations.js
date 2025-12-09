
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEW_DATA_FILE = path.resolve(__dirname, '../../stations_complete.json');
const CURRENT_DATA_FILE = path.resolve(__dirname, '../src/data/stations.json');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/stations.json'); // Overwrite

// Helper to calculate a pseudo-score if votes are missing, or just random/default
// User asked to "display from high to low in Recommended".
// Since we list confidence, maybe we can use that? Or just 0.
// Let's assume 0 for now unless we find something.

try {
    // 1. Load Current Data (to preserve metadata like votes, codes)
    let currentStationMap = new Map();
    if (fs.existsSync(CURRENT_DATA_FILE)) {
        const currentData = JSON.parse(fs.readFileSync(CURRENT_DATA_FILE, 'utf8'));
        currentData.forEach(s => {
            currentStationMap.set(s.stationuuid, {
                votes: s.votes || 0,
                countrycode: s.countrycode || "",
                favicon: s.favicon || "",
                homepage: s.homepage || ""
            });
        });
        console.log(`Loaded ${currentStationMap.size} existing stations for metadata preservation.`);
    }

    // 2. Load New Data
    const rawData = fs.readFileSync(NEW_DATA_FILE, 'utf8');
    const newStations = JSON.parse(rawData);

    // 3. Merge
    const mappedStations = newStations.map(s => {
        const metadata = currentStationMap.get(s.UUID) || { votes: 0, countrycode: "", favicon: "", homepage: "" };

        return {
            stationuuid: s.UUID,
            name: s.Name,
            url: s.URL,
            url_resolved: s.URL, // Ensure this exists for store logic
            homepage: metadata.homepage,
            favicon: metadata.favicon,
            country: s.Country,
            countrycode: metadata.countrycode, // Critical for UI filtering
            geo_lat: typeof s.latitude === 'string' ? parseFloat(s.latitude) : s.latitude,
            geo_long: typeof s.longitude === 'string' ? parseFloat(s.longitude) : s.longitude,
            tags: s.Tags ? s.Tags.toLowerCase() : "",
            votes: metadata.votes, // Preserve sort order capability
            is_geo_estimated: false // Explicitly valid
        };
    });

    // 4. Write
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappedStations, null, 2));
    console.log(`Successfully merged and updated ${mappedStations.length} stations.`);

} catch (e) {
    console.error("Error processing stations:", e);
}
