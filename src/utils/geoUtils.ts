
// Shared location inference logic (Ported from scripts/exportStations.js)

export const CHINA_LOCATIONS: Record<string, { lat: number, long: number, radius: number }> = {
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

export const COUNTRY_BOUNDS: Record<string, { minLat: number, maxLat: number, minLng: number, maxLng: number }> = {
    "CN": { minLat: 20, maxLat: 50, minLng: 80, maxLng: 130 },
    "China": { minLat: 20, maxLat: 50, minLng: 80, maxLng: 130 },
    "US": { minLat: 25, maxLat: 49, minLng: -125, maxLng: -70 },
    "RU": { minLat: 50, maxLat: 70, minLng: 40, maxLng: 180 },
    "BR": { minLat: -30, maxLat: 0, minLng: -70, maxLng: -35 },
    "IN": { minLat: 8, maxLat: 30, minLng: 70, maxLng: 90 },
    "AU": { minLat: -40, maxLat: -11, minLng: 113, maxLng: 153 },
    // Add more as needed
};

export function refineStationCoordinates(station: any): { lat: number, long: number, isEstimated: boolean } {
    let lat = station.geoLat || station.geo_lat; // Handle inconsistent casing
    let long = station.geoLong || station.geo_long;
    let isEstimated = false;

    // Use specific provided props if numeric
    if (typeof lat === 'number' && typeof long === 'number' && (Math.abs(lat) > 0.1 || Math.abs(long) > 0.1)) {
        return { lat, long, isEstimated: false };
    }

    // Inference Logic
    let inferred = null;
    for (const [key, loc] of Object.entries(CHINA_LOCATIONS)) {
        if ((station.name && station.name.includes(key)) || (station.state && station.state.includes(key))) {
            inferred = loc;
            break;
        }
    }

    if (inferred) {
        isEstimated = true;
        const radius = inferred.radius * Math.sqrt(Math.random());
        const angle = Math.random() * 2 * Math.PI;
        lat = inferred.lat + (radius * Math.cos(angle));
        long = inferred.long + (radius * Math.sin(angle));
        return { lat, long, isEstimated };
    }

    // Fallback: Country Bounding Box
    const countryKey = station.countrycode || station.country;
    const bounds = COUNTRY_BOUNDS[countryKey] || COUNTRY_BOUNDS["CN"]; // Default to China bounds if unknown for now/demo

    if (bounds) {
        isEstimated = true;
        const latRange = bounds.maxLat - bounds.minLat;
        const lngRange = bounds.maxLng - bounds.minLng;
        const centerLat = bounds.minLat + latRange / 2;
        const centerLng = bounds.minLng + lngRange / 2;
        const scale = 0.6;
        const scaledLatHalf = (latRange * scale) / 2;
        const scaledLngHalf = (lngRange * scale) / 2;

        lat = (centerLat - scaledLatHalf) + Math.random() * (latRange * scale);
        long = (centerLng - scaledLngHalf) + Math.random() * (lngRange * scale);
    } else {
        // Ultimate fallback
        lat = 35.0;
        long = 105.0;
    }

    return { lat, long, isEstimated };
}

// RESTORED FUNCTIONS

import { Vector3 } from 'three';

export function latLonToVector3(lat: number, lon: number, radius: number): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new Vector3(x, y, z);
}

export function findCountryByLatLon(lat: number, lon: number): string | null {
    // Simple bounds check against known refined bounds
    for (const [code, bounds] of Object.entries(COUNTRY_BOUNDS)) {
        if (lat >= bounds.minLat && lat <= bounds.maxLat &&
            lon >= bounds.minLng && lon <= bounds.maxLng) {
            return code;
        }
    }
    return null;
}
