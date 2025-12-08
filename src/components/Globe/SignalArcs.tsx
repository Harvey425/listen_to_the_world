import { useRef } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import { useRadioStore } from '../../store/useRadioStore';
import { latLonToVector3 } from '../../utils/geoUtils';
import { useFrame } from '@react-three/fiber';

export function SignalArcs() {
    const { activeStation } = useRadioStore();
    const lineRef = useRef<any>(null);

    // Default Listener Location (Shanghai)
    const listenerLat = 31.23;
    const listenerLon = 121.47;

    useFrame((state, delta) => {
        if (lineRef.current && lineRef.current.material) {
            // Animate dash offset to simulate signal flow
            lineRef.current.material.dashOffset -= (delta * 0.5);
        }
    });

    if (!activeStation) return null;

    const start = latLonToVector3(listenerLat, listenerLon, 1.0);
    const end = latLonToVector3(activeStation.geo_lat, activeStation.geo_long, 1.0);

    // Calculate intelligent midpoint height based on distance
    const dist = start.distanceTo(end);
    const height = 1.0 + Math.max(0.2, dist * 0.8); // Higher arc for longer distances
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(height);

    return (
        <QuadraticBezierLine
            ref={lineRef}
            start={start}
            end={end}
            mid={mid}
            color="#00f3ff"
            lineWidth={2}
            dashed
            dashScale={2}
            dashOffset={0}
            dashSize={2}     // Length of the dash
            gapSize={1}      // Length of the gap
        />
    );
}
