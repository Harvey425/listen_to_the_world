import { Vector3 } from 'three';

// 1. Lat/Lon to Vector3
export function latLonToVector3(lat: number, lon: number, radius: number = 1): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new Vector3(x, y, z);
}

// 2. Point in Polygon (Ray Casting algorithm)
// polygon: array of [lon, lat]
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// 3. Find Country by Lat/Lon
// features: GeoJSON Features array
export function findCountryByLatLon(lat: number, lon: number, features: any[]): any | null {
    // Optimization: Check bounding box first if available, 
    // but for 170 countries, linear scan of isPointInPolygon might be slow per frame.
    // We should use this only on click or throttle hover.

    for (const feature of features) {
        const { geometry } = feature;
        if (!geometry) continue;

        if (geometry.type === 'Polygon') {
            if (isPointInPolygon([lon, lat], geometry.coordinates[0])) {
                return feature;
            }
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (isPointInPolygon([lon, lat], polygon[0])) {
                    return feature;
                }
            }
        }
    }
    return null;
}
