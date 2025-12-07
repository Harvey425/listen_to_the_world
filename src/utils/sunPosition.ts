import { Vector3 } from 'three';

export function getSunPosition(date: Date = new Date()): Vector3 {
    const PI = Math.PI;
    const rad = PI / 180;

    // Get UTC hours
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60;

    // Calculate sun longitude (approximate)
    // Earth rotates 15 degrees per hour.
    // At 12:00 UTC, Sun is near Prime Meridian (0).
    // At 00:00 UTC, Sun is near 180.
    // Longitude = (Hours - 12) * -15 (Negative because Earth rotates East, Sun appears to move West)
    const phi = (hours - 12) * -15 * rad;

    // Calculate sun latitude (declination) based on day of year
    // Approximate day of year
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Tilt is 23.44 degrees.
    // Solstices: Day 172 (Summer), Day 355 (Winter)
    // Simple formulation: -23.44 * cos(360/365 * (d + 10))
    const theta = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * rad) * rad;

    // Convert spherical to cartesian
    // We assume Earth radius 1 for direction, but Light should be far away.
    // Using a large distance for the light position.
    const distance = 50;

    // Three.js Coordinate system: Y is up (North), Z is +? 
    // Customary: Z axis passes through Prime Meridian? 
    // Let's assume standard UV mapping: 
    // (0,0) texture coordinate usually matches Z+ or X- depending on sphere generation.
    // Three.js SphereGeometry: UV seam is at x-axis usually? 
    // We will adjust visually. 
    // Standard conversion: 
    // x = r * cos(lat) * sin(long)
    // y = r * sin(lat)
    // z = r * cos(lat) * cos(long)

    const x = distance * Math.cos(theta) * Math.sin(phi);
    const y = distance * Math.sin(theta);
    const z = distance * Math.cos(theta) * Math.cos(phi);

    return new Vector3(x, y, z);
}
