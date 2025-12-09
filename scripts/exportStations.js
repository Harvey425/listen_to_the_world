
import { RadioBrowserApi } from 'radio-browser-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix for fetch in older Node environments
if (!globalThis.fetch) {
    console.warn("Native fetch not found. Ensure use Node 18+");
}

const api = new RadioBrowserApi('My3DEarthRadio');

// --- Geolocation Correction Data ---

// 1. Specific Manual Overrides (Highest Priority)
// For stations with totally wrong data (e.g. China station at 0,0)
const STATION_OVERRIDES = {
    // Luquan District FM87.3 Rhino Radio (Shijiazhuang, Hebei)
    "鹿泉区FM87.3犀牛电台": { lat: 38.08, long: 114.31 },
    "鹿泉区FM87.3犀牛电台 ": { lat: 38.08, long: 114.31 }, // Handle potential trailing space
    // Beijing Traffic Radio (often 0,0)
    "北京交通广播": { lat: 39.90, long: 116.40 },
    "FM 103.9 北京交通广播": { lat: 39.90, long: 116.40 },
    // BRTV Music
    "BRTV北京音乐广播": { lat: 39.90, long: 116.40 },
    // Add more here as discovered
};

// 2. Country Bounding Boxes (Approximate Main Landmass)
// Used to generate random coordinates within the country if original data is missing.
// Lat: -90 to 90, Long: -180 to 180
const COUNTRY_BOUNDS = {
    "China": { minLat: 20, maxLat: 50, minLng: 80, maxLng: 130 }, // Main populated area approx
    "CN": { minLat: 20, maxLat: 50, minLng: 80, maxLng: 130 },
    "The United States Of America": { minLat: 25, maxLat: 49, minLng: -125, maxLng: -67 }, // Continental US
    "US": { minLat: 25, maxLat: 49, minLng: -125, maxLng: -67 },
    "USA": { minLat: 25, maxLat: 49, minLng: -125, maxLng: -67 },
    "United Kingdom": { minLat: 50, maxLat: 59, minLng: -8, maxLng: 2 },
    "UK": { minLat: 50, maxLat: 59, minLng: -8, maxLng: 2 },
    "GB": { minLat: 50, maxLat: 59, minLng: -8, maxLng: 2 },
    "Russia": { minLat: 50, maxLat: 70, minLng: 30, maxLng: 140 }, // Focus on populated western/central parts
    "RU": { minLat: 50, maxLat: 70, minLng: 30, maxLng: 140 },
    "Japan": { minLat: 31, maxLat: 46, minLng: 129, maxLng: 146 },
    "JP": { minLat: 31, maxLat: 46, minLng: 129, maxLng: 146 },
    "Germany": { minLat: 47, maxLat: 55, minLng: 6, maxLng: 15 },
    "DE": { minLat: 47, maxLat: 55, minLng: 6, maxLng: 15 },
    "France": { minLat: 42, maxLat: 51, minLng: -5, maxLng: 8 },
    "FR": { minLat: 42, maxLat: 51, minLng: -5, maxLng: 8 },
    "India": { minLat: 8, maxLat: 35, minLng: 68, maxLng: 97 },
    "IN": { minLat: 8, maxLat: 35, minLng: 68, maxLng: 97 },
    "Brazil": { minLat: -30, maxLat: 0, minLng: -70, maxLng: -35 }, // Main populated
    "BR": { minLat: -30, maxLat: 0, minLng: -70, maxLng: -35 },
    "Australia": { minLat: -40, maxLat: -11, minLng: 113, maxLng: 154 },
    "AU": { minLat: -40, maxLat: -11, minLng: 113, maxLng: 154 },
    "Canada": { minLat: 45, maxLat: 60, minLng: -130, maxLng: -60 }, // Populated band
    "CA": { minLat: 45, maxLat: 60, minLng: -130, maxLng: -60 },
    "Italy": { minLat: 37, maxLat: 47, minLng: 7, maxLng: 18 },
    "IT": { minLat: 37, maxLat: 47, minLng: 7, maxLng: 18 },
    "Spain": { minLat: 36, maxLat: 44, minLng: -9, maxLng: 3 },
    "ES": { minLat: 36, maxLat: 44, minLng: -9, maxLng: 3 },
    "Mexico": { minLat: 15, maxLat: 32, minLng: -116, maxLng: -87 },
    "MX": { minLat: 15, maxLat: 32, minLng: -116, maxLng: -87 }
};


// Track stations with missing coordinates
const missingGeoStations = [];

// 3. City/Province Inference (Keyword Matching)
// For accurate placement within a country if specific coordinates are missing.
const CHINA_LOCATIONS = {
    "驻马店": { lat: 32.99, long: 114.02, radius: 0.5 },
    "河南": { lat: 33.88, long: 113.61, radius: 2.0 },
    "北京": { lat: 39.90, long: 116.40, radius: 0.5 },
    "上海": { lat: 31.23, long: 121.47, radius: 0.3 },
    "天津": { lat: 39.34, long: 117.36, radius: 0.4 },
    "重庆": { lat: 29.56, long: 106.55, radius: 1.0 },
    "河北": { lat: 38.03, long: 114.51, radius: 2.0 },
    "山西": { lat: 37.87, long: 112.54, radius: 2.0 },
    "辽宁": { lat: 41.80, long: 123.43, radius: 2.0 },
    "吉林": { lat: 43.81, long: 125.32, radius: 2.0 },
    "黑龙江": { lat: 45.74, long: 126.66, radius: 2.5 },
    "江苏": { lat: 32.06, long: 118.79, radius: 1.5 },
    "浙江": { lat: 30.27, long: 120.15, radius: 1.5 },
    "安徽": { lat: 31.82, long: 117.22, radius: 1.5 },
    "福建": { lat: 26.07, long: 119.29, radius: 1.5 },
    "江西": { lat: 28.68, long: 116.00, radius: 1.5 },
    "山东": { lat: 36.65, long: 117.12, radius: 1.8 },
    "湖北": { lat: 30.59, long: 114.30, radius: 1.5 },
    "湖南": { lat: 28.22, long: 112.93, radius: 1.5 },
    "广东": { lat: 23.12, long: 113.26, radius: 1.5 },
    "海南": { lat: 19.19, long: 109.74, radius: 0.8 },
    "四川": { lat: 30.57, long: 104.06, radius: 2.5 },
    "贵州": { lat: 26.64, long: 106.63, radius: 1.5 },
    "云南": { lat: 24.88, long: 102.83, radius: 2.5 },
    "陕西": { lat: 34.34, long: 108.93, radius: 2.0 },
    "甘肃": { lat: 36.06, long: 103.83, radius: 2.5 },
    "青海": { lat: 36.62, long: 101.77, radius: 3.0 },
    "内蒙古": { lat: 40.84, long: 111.75, radius: 4.0 },
    "广西": { lat: 23.11, long: 108.36, radius: 1.5 },
    "西藏": { lat: 29.65, long: 91.11, radius: 4.0 },
    "宁夏": { lat: 38.48, long: 106.23, radius: 0.8 },
    "新疆": { lat: 43.79, long: 87.62, radius: 5.0 },
    "香港": { lat: 22.31, long: 114.16, radius: 0.1 },
    "澳门": { lat: 22.19, long: 113.54, radius: 0.05 },
    "台北": { lat: 25.03, long: 121.56, radius: 0.1 },
    "台湾": { lat: 23.69, long: 120.96, radius: 1.0 }
};


// Helper to map library station to App Station format
function mapStation(s) {
    let lat = s.geoLat;
    let long = s.geoLong;
    let is_geo_estimated = false;

    // Detect if original data is missing
    if (!lat && !long) {
        missingGeoStations.push({
            name: s.name,
            id: s.id,
            url: s.url,
            country: s.country,
            tags: s.tags.join(',')
        });
    }

    // 1. Check Specific Overrides
    const override = STATION_OVERRIDES[s.name] || STATION_OVERRIDES[s.name.trim()];
    if (override) {
        lat = override.lat;
        long = override.long;
        // Overrides generally accurate
    }
    // 2. If Invalid, Try City/Province Inference (Keyword Match)
    else if (!lat && !long) {
        let inferred = null;
        // Check China Locations
        for (const [key, loc] of Object.entries(CHINA_LOCATIONS)) {
            if (s.name.includes(key) || (s.state && s.state.includes(key))) {
                inferred = loc;
                break; // Stop at first match (maybe prioritize city over province?)
                // Since keys object order isn't guaranteed, we rely on "Specific First" if we cared,
                // but usually "Zhumadian" is unique enough. 
            }
        }

        if (inferred) {
            is_geo_estimated = true;
            // Use Circular Jitter around inferred location
            const radius = inferred.radius * Math.sqrt(Math.random());
            lat = 0;
            long = 0;
            // User requested removing simulation logic.
            // If location is missing, it will stay missing (0,0).
        }

        return {
            stationuuid: s.id,
            name: s.name,
            url: s.url,
            const dir = path.dirname(outputPath);
            if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, outputContent, 'utf-8');

        console.log(`\n✅ Success! Exported ${stations.length} stations to:`);
        console.log(outputPath);

        // --- Export Missing Geo Report ---
        if (missingGeoStations.length > 0) {
            console.log(`\n⚠️ Found ${missingGeoStations.length} stations with missing coordinates.`);
            const csvHeader = 'Name,UUID,Country,URL,Tags\n';
            const csvRows = missingGeoStations.map(s => {
                const escape = (str) => {
                    if (!str) return '""';
                    return `"${String(str).replace(/"/g, '""')}"`;
                };
                return `${escape(s.name)},${escape(s.id)},${escape(s.country)},${escape(s.url)},${escape(s.tags)}`;
            }).join('\n');

            const reportPath = path.resolve(__dirname, '../missing_geo_stations.csv');
            fs.writeFileSync(reportPath, csvHeader + csvRows, 'utf-8');
            console.log(`📝 Missing coordinates report saved to: ${reportPath}`);
        }

    } catch (error) {
        console.error("Error exporting stations:", error);
    }
}

main();
