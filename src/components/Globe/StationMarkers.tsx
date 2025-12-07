import { useRef, useLayoutEffect, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Object3D, Color, InstancedMesh, CanvasTexture, BufferGeometry, Float32BufferAttribute, Points, Vector3 } from 'three';
import { useRadioStore } from '../../store/useRadioStore';
import { latLonToVector3 } from '../../utils/geoUtils';

const TEMP_OBJECT = new Object3D();

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
    const { stations, playStation, activeStation, selectedCountry } = useRadioStore();
    const pointsRef = useRef<Points>(null);
    const { raycaster } = useThree();
    const map = useMemo(() => createCircleTexture(), []);

    // Tighter threshold for "only show when very close"
    raycaster.params.Points.threshold = 0.015;  // If selectedCountry is null, we show NO stations (or maybe all? User said "Only ... after click")
    // User request: "Cancel square gray box... only when mouse clicks a country, then show that country's stations"
    // So default: Hide all? Or show all invisible?
    // "Initially... only show country name, click -> zoom -> show dots"
    // So stations are hidden by default!

    // We can just filter the list passed to the rendering logic.
    // However, StationMarkers uses InstancedMesh or Points.
    // Re-creating the buffer every time might be slow if we switch countries often.
    // But for 5000 points it's okay.

    const visibleStations = useMemo(() => {
        if (!selectedCountry) return []; // Hide all if no country selected
        // Filter by ISO Code (s.countrycode from Radio Browser should match ISO_A2 from GeoJSON)
        return stations.filter(s => s.countrycode === selectedCountry);
    }, [stations, selectedCountry]);

    const geometry = useMemo(() => {
        const geo = new BufferGeometry();
        const positions = [];
        const colors = [];
        const colorValid = new Color('#00f3ff');

        visibleStations.forEach(station => {
            const { geo_lat, geo_long } = station;
            const pos = latLonToVector3(geo_lat, geo_long, 1.005);
            positions.push(pos.x, pos.y, pos.z);

            // Color logic: active vs normal
            const isActive = activeStation?.stationuuid === station.stationuuid;

            if (isActive) {
                // Active: Bright White
                colors.push(1.0, 1.0, 1.0);
            } else {
                // Inactive: Warm Gold/Orange (to contrast with Blue/Cyan selection)
                // RGB for polished orange: ~ 1.0, 0.6, 0.2
                colors.push(1.0, 0.65, 0.2);
            }
        });

        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
        return geo;
    }, [visibleStations, activeStation]);

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
    // We recalculate position here only for the SINGLE hovered item, which is cheap.
    let hoveredStationComp = null;
    if (hovered !== null && visibleStations[hovered]) {
        const s = visibleStations[hovered];
        // Match marker radius exactly (1.005) to prevent parallax "flying" drift
        const pos = latLonToVector3(s.geo_lat, s.geo_long, 1.005);
        hoveredStationComp = (
            <Html position={pos} center zIndexRange={[100, 0]}>
                {/* Translate Y to sit just above the point. 
                    -translate-y-[120%] moves it up so the bottom of the tag is just above the center. 
                */}
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
            {hoveredStationComp}
        </group>
    );
}
