import { useEffect, useState, useRef } from 'react';
import { findCountryByLatLon } from '../../utils/geoUtils';
import { useRadioStore } from '../../store/useRadioStore';

export function CountryMesh() {
    const { setHoveredCountry, setSelectedCountry, selectedCountry } = useRadioStore();
    const [geoJson, setGeoJson] = useState<any>(null);

    // Load GeoJSON
    // Note: in a real app better to usage useLoader check
    // We used curl to save it to src/assets/geo/countries.json
    // But Vite assets usage: import url.

    // We will assume we can fetch it or ignore if missing for now
    // Actually we need to import the file URL if it's in assets
    // Let's rely on fetch for simplicity or useLoader(FileLoader)

    useEffect(() => {
        fetch('/src/assets/geo/countries.json')
            .then(res => res.json())
            .then(data => setGeoJson(data))
            .catch(err => console.error("Failed to load countries:", err));
    }, []);

    // Setup Interaction Listener on a simplified sphere ?
    // No, we can hook into Earth's events if we pass handle functions?
    // Or we make a transparent sphere here specifically for country picking

    const hoveredCodeRef = useRef<string | null>(null);

    const lastMoveTime = useRef(0);

    const onPointerMove = (e: any) => {
        // Throttle to run every 50ms max to prevent performance issues
        const now = Date.now();
        if (now - lastMoveTime.current < 50) return;
        lastMoveTime.current = now;

        // e.point is Vector3 (World Space)
        if (!geoJson) return;

        // Convert Point on Sphere to Lat/Lon
        // Assuming sphere radius 1.
        const point = e.point.clone().normalize();
        const phi = Math.acos(point.y);
        const theta = Math.atan2(point.z, -point.x);

        const lat = 90 - (phi * 180 / Math.PI);
        const lon = (theta * 180 / Math.PI) - 180;

        // Use bounding box lookup for code, then find feature
        const countryCode = findCountryByLatLon(lat, lon);
        const country = countryCode
            ? geoJson.features.find((f: any) =>
                f.properties.ISO_A2 === countryCode ||
                f.properties.ISO_A2_EH === countryCode ||
                // Fallback for some datasets using NAME/ADMIN match if standard?
                // But our bounds map uses Codes.
                (f.properties.ISO_A2 === 'CN' && countryCode === 'CN')
            )
            : null;

        if (country) {
            const name = country.properties.NAME || country.properties.name || country.properties.ADMIN;
            const code = country.properties.ISO_A2 || country.properties.ISO_A2_EH; // ISO Code

            // Only update if changed to avoid expensive re-renders
            if (hoveredCodeRef.current !== code) {
                setHoveredCountry(name, code);
                hoveredCodeRef.current = code;
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredCodeRef.current !== null) {
                setHoveredCountry(null, null);
                hoveredCodeRef.current = null;
                document.body.style.cursor = 'auto';
            }
        }
    };

    const onClick = (e: any) => {
        e.stopPropagation();

        // Calculate click target directly to ensure reliability (don't rely solely on hoverRef)
        if (!geoJson) return;
        const point = e.point.clone().normalize();
        const phi = Math.acos(point.y);
        const theta = Math.atan2(point.z, -point.x);
        const lat = 90 - (phi * 180 / Math.PI);
        const lon = (theta * 180 / Math.PI) - 180;

        const countryCode = findCountryByLatLon(lat, lon);
        const country = countryCode
            ? geoJson.features.find((f: any) => f.properties.ISO_A2 === countryCode || f.properties.ISO_A2_EH === countryCode)
            : null;

        const clickedCode = country ? (country.properties.ISO_A2 || country.properties.ISO_A2_EH) : null;

        if (clickedCode) {
            // Toggle selection
            setSelectedCountry(clickedCode === selectedCountry ? null : clickedCode);
        } else {
            setSelectedCountry(null); // Click ocean to deselect
        }
    };

    return (
        <group>
            {/* Interaction Sphere (Invisible) */}
            <mesh visible={false} onPointerMove={onPointerMove} onClick={onClick}>
                <sphereGeometry args={[1.001, 64, 64]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Country Borders */}
            {/* Country Borders - REMOVED to avoid political controversy */}
            {/* lines.map(...) code removed */}
        </group>
    );
}
