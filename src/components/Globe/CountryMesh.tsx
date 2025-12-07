import { useEffect, useState, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { latLonToVector3, findCountryByLatLon } from '../../utils/geoUtils';
import { useRadioStore } from '../../store/useRadioStore';

export function CountryMesh() {
    const { setHoveredCountry, setSelectedCountry, selectedCountry, hoveredCountry } = useRadioStore();
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

    // Create Lines
    const lines = useMemo(() => {
        if (!geoJson) return [];

        const validLines: any[] = [];

        geoJson.features.forEach((feature: any) => {
            const { geometry } = feature;
            if (!geometry) return;

            const processPolygon = (coords: number[][]) => {
                const points = coords.map(p => latLonToVector3(p[1], p[0], 1.002)); // Slightly above earth
                const name = feature.properties.NAME || feature.properties.name || feature.properties.ADMIN;
                const code = feature.properties.ISO_A2 || feature.properties.ISO_A2_EH;
                validLines.push({ points, id: name, code }); // Store Code
            };

            if (geometry.type === 'Polygon') {
                processPolygon(geometry.coordinates[0]);
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach((poly: any) => processPolygon(poly[0]));
            }
        });

        return validLines;
    }, [geoJson]);

    // Setup Interaction Listener on a simplified sphere ?
    // No, we can hook into Earth's events if we pass handle functions?
    // Or we make a transparent sphere here specifically for country picking

    const hoveredCodeRef = useRef<string | null>(null);

    const onPointerMove = (e: any) => {
        // e.point is Vector3 (World Space)
        if (!geoJson) return;

        // Convert Point on Sphere to Lat/Lon
        // Assuming sphere radius 1.
        const point = e.point.clone().normalize();
        const phi = Math.acos(point.y);
        const theta = Math.atan2(point.z, -point.x);

        const lat = 90 - (phi * 180 / Math.PI);
        const lon = (theta * 180 / Math.PI) - 180;

        const country = findCountryByLatLon(lat, lon, geoJson.features);
        if (country) {
            const name = country.properties.NAME || country.properties.name || country.properties.ADMIN;
            const code = country.properties.ISO_A2 || country.properties.ISO_A2_EH; // ISO Code

            setHoveredCountry(name);
            hoveredCodeRef.current = code;
            document.body.style.cursor = 'pointer';
        } else {
            setHoveredCountry(null);
            hoveredCodeRef.current = null;
            document.body.style.cursor = 'auto';
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
        const country = findCountryByLatLon(lat, lon, geoJson.features);

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
            {lines.map((line, idx) => {
                // We need to match line.id (Name) with selectedCountry (Code)?
                // Ah, line.id is currently NAME.
                // Issue: If selectedCountry is CODE, this visual highlight logic breaks:
                // selectedCountry === line.id
                // We need line to store CODE as ID.
                return (
                    <Line
                        key={idx}
                        points={line.points}
                        color={
                            // We can't easily match Code here if line.id is Name.
                            // Let's rely on hoveredCountry (Name) for hover effect.
                            // For Selection effect (Cyan), we need to check if selectedCountry (Code) matches this line's Code.
                            // So we must store Code in 'lines'.
                            (selectedCountry && line.code === selectedCountry) ? '#00f3ff' :
                                (hoveredCountry && line.id === hoveredCountry) ? '#ffffff' : '#444444'
                        }
                        lineWidth={1}
                        transparent
                        opacity={(selectedCountry && line.code === selectedCountry) ? 1 : 0.3}
                    />
                );
            })}
        </group>
    );
}
