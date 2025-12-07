import { useRef, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Color, Vector3 } from 'three';
import { useRadioStore } from '../../store/useRadioStore';
import { StationMarkers } from './StationMarkers';
import { CountryMesh } from './CountryMesh';

// Assets
import earthDay from '../../assets/textures/earth_day.jpg';
import earthNormal from '../../assets/textures/earth_normal.jpg';
import earthSpecular from '../../assets/textures/earth_specular.jpg';

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

            {/* Uniform lighting */}
            <ambientLight intensity={2.5} />

            {/* Dynamic Active Station Light */}
            {lightPos && (
                <pointLight
                    position={lightPos}
                    intensity={2.0}
                    distance={0.5}
                    decay={2}
                    color="#00f3ff"
                />
            )}

            {/* Earth Sphere */}
            <mesh ref={earthRef} rotation={[0, 0, 0]} raycast={() => null}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    roughnessMap={specularMap}
                    roughness={0.5}
                    metalness={0.1}
                    emissiveMap={colorMap}
                    emissive={new Color('#00f3ff')}
                    emissiveIntensity={0.02} /* Reduced slightly */
                />
            </mesh>

            {/* Markers */}
            <StationMarkers />

            {/* Country Borders & Interaction */}
            <CountryMesh />
        </group>
    );
}
