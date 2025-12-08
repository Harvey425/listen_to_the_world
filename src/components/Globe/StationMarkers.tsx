import { useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { CanvasTexture, BufferGeometry, Float32BufferAttribute } from 'three';
import { useRadioStore } from '../../store/useRadioStore';
import { latLonToVector3 } from '../../utils/geoUtils';

// Generate a round texture for the points
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    const texture = new CanvasTexture(canvas);
    return texture;
}

export function StationMarkers() {
    const { stations, playStation, activeStation, selectedCountry, filterTag, searchTerm } = useRadioStore();
    const { raycaster } = useThree();
    const map = useMemo(() => createCircleTexture(), []);

    // Tighter threshold
    raycaster.params.Points.threshold = 0.015;

    const visibleStations = useMemo(() => {
        let result = stations;

        // 1. Tag Filter
        if (filterTag) {
            result = result.filter(s => s.tags && s.tags.toLowerCase().includes(filterTag));
        }

        // 2. Search Filter (Global Globe Filtering)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lowerTerm) ||
                (s.tags && s.tags.toLowerCase().includes(lowerTerm)) ||
                (s.country && s.country.toLowerCase().includes(lowerTerm))
            );
        }

        return result;
    }, [stations, selectedCountry, filterTag, searchTerm]);

    const geometry = useMemo(() => {
        const geo = new BufferGeometry();
        const positions: number[] = [];
        const colors: number[] = [];

        visibleStations.forEach(station => {
            const { geo_lat, geo_long } = station;
            const pos = latLonToVector3(geo_lat, geo_long, 1.005);
            positions.push(pos.x, pos.y, pos.z);

            // Color logic: active vs normal
            const isActive = activeStation?.stationuuid === station.stationuuid;

            if (isActive) {
                // Active: Golden / Orange (High contrast with Cyan)
                colors.push(1.0, 0.6, 0.1);
            } else {
                // Inactive: Bioluminescent Cyan (Cyber-Minimalism)
                colors.push(0.0, 0.9, 1.0);
            }
        });

        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
        return geo;
    }, [visibleStations, activeStation]);

    // Active Station 3D Beacon (Height & Size)
    // We render this separately to give it "3D Height" as requested
    const activeBeacon = useMemo(() => {
        if (!activeStation) return null;

        const { geo_lat, geo_long } = activeStation;
        const surfacePos = latLonToVector3(geo_lat, geo_long, 1.0);
        const highPos = latLonToVector3(geo_lat, geo_long, 1.15); // Significant height

        return (
            <group>
                {/* Visual Line connecting surface to beacon */}
                <Line
                    points={[surfacePos, highPos]}
                    color="#ff9919"
                    lineWidth={1.5}
                    transparent
                    opacity={0.6}
                />

                {/* The Beacon Sphere */}
                <mesh position={highPos}>
                    <sphereGeometry args={[0.02, 16, 16]} />
                    <meshBasicMaterial color="#ff9919" toneMapped={false} />
                </mesh>

                {/* Outer Glow Halo */}
                <mesh position={highPos}>
                    <sphereGeometry args={[0.04, 16, 16]} />
                    <meshBasicMaterial color="#ff9919" transparent opacity={0.2} toneMapped={false} depthWrite={false} />
                </mesh>
            </group>
        );
    }, [activeStation]);


    // Handler for clicks
    const handleClick = (e: any) => {
        e.stopPropagation();
        const index = e.index; // Points usage
        if (index !== undefined && visibleStations[index]) {
            playStation(visibleStations[index]);
        }
    };

    const [hovered, setHovered] = useState<number | null>(null);
    const onPointerMove = (e: any) => {
        e.stopPropagation();
        const index = e.index;
        if (index !== undefined && index !== hovered) {
            setHovered(index);
            document.body.style.cursor = 'pointer';
        }
    };

    const onPointerOut = () => {
        setHovered(null);
        document.body.style.cursor = 'auto';
    };

    if (visibleStations.length === 0) return null;

    // Get hovered station position for tooltip
    let hoveredStationComp = null;
    if (hovered !== null && visibleStations[hovered]) {
        const s = visibleStations[hovered];
        const pos = latLonToVector3(s.geo_lat, s.geo_long, 1.005);
        hoveredStationComp = (
            <Html position={pos} center zIndexRange={[100, 0]}>
                <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none transform -translate-y-[140%]">
                    <span className="text-[10px] font-light text-white/90 tracking-wider">
                        {s.name}
                    </span>
                </div>
            </Html>
        );
    }

    return (
        <group>
            {/* The Cloud of Stations */}
            <points
                geometry={geometry}
                onClick={handleClick}
                onPointerOver={onPointerMove}
                onPointerOut={onPointerOut}
            >
                <pointsMaterial
                    size={0.02}
                    map={map}
                    transparent
                    vertexColors
                    alphaTest={0.5}
                    sizeAttenuation
                    depthWrite={false}
                    toneMapped={false}
                />
            </points>

            {/* Tooltip */}
            {hoveredStationComp}

            {/* Active Beacon 3D Element */}
            {activeBeacon}
        </group>
    );
}
