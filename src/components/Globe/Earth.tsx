import { useRef, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Color, Vector3, Vector2 } from 'three';
import { useRadioStore } from '../../store/useRadioStore';
import { StationMarkers } from './StationMarkers';
import { CountryMesh } from './CountryMesh';
import { AtmosphereGlow } from './AtmosphereGlow';

// Assets (High Definition Blue Marble from Three-Globe)
const earthDay = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const earthNormal = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const earthSpecular = "https://unpkg.com/three-globe/example/img/earth-water.png";

// Lat/Lon to Vector3 conversion (reused)
function latLonToVector3(lat: number, lon: number, radius: number = 1): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new Vector3(x, y, z);
}

export function Earth() {
    const earthRef = useRef<Mesh>(null);

    const [colorMap, normalMap, specularMap] = useLoader(TextureLoader, [
        earthDay,
        earthNormal,
        earthSpecular
    ]);

    const { fetchStations, activeStation } = useRadioStore();

    useEffect(() => {
        fetchStations();
    }, [fetchStations]);

    // Calculate light position
    const lightPos = useMemo(() => {
        if (!activeStation) return null;
        // Float slightly above surface (1.05) to light up the area
        return latLonToVector3(activeStation.geo_lat, activeStation.geo_long, 1.1);
    }, [activeStation]);

    return (
        <group>
            {/* Sun Light - REMOVED for uniform lighting */}
            {/* <directionalLight position={sunPosition} intensity={1.5} /> */}

            {/* Uniform lighting - Increased brightness per user request */}
            <ambientLight intensity={6} />

            {/* Dynamic Active Station Beacon (Glow) */}
            {lightPos && (
                <group position={lightPos}>
                    {/* Core Light Source (Visual) */}
                    <mesh>
                        <sphereGeometry args={[0.005, 16, 16]} />
                        <meshBasicMaterial color="#00f3ff" toneMapped={false} />
                    </mesh>
                    {/* Ambient Glow using PointLight with low distance to avoid global artifacting */}
                    <pointLight
                        intensity={1.5}
                        distance={0.1}
                        decay={2}
                        color="#00f3ff"
                    />
                </group>
            )}

            {/* Earth Sphere - High Res Geometry to fix jagged edges */}
            <mesh ref={earthRef} rotation={[0, 0, 0]} raycast={() => null}>
                <sphereGeometry args={[1, 128, 128]} />
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    roughnessMap={specularMap}
                    roughness={0.7} /* Less glossy */
                    metalness={0.05} /* Less metallic */
                    emissiveMap={colorMap}
                    emissive={new Color('#111111')} /* Subtle night lights */
                    emissiveIntensity={0.5}
                    normalScale={new Vector2(0.5, 0.5)} /* Reduce normal map intensity to reduce jagged shadows */
                />
            </mesh>

            {/* Markers */}
            <StationMarkers />

            {/* Atmosphere Glow */}
            <AtmosphereGlow />

            {/* Signal Arcs - REMOVED per user request */}
            {/* <SignalArcs /> */}

            {/* Country Borders & Interaction */}
            <CountryMesh />
        </group>
    );
}
