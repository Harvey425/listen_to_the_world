import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useRadioStore } from '../store/useRadioStore';

function latLonToVector3(lat: number, lon: number, radius: number): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new Vector3(x, y, z);
}

export function CameraManager() {
    const { activeStation } = useRadioStore();
    const { camera, controls } = useThree();

    // Animation state
    const isAnimating = useRef(false);
    const progress = useRef(0);
    const startPos = useRef<Vector3>(new Vector3());
    const targetPos = useRef<Vector3>(new Vector3());

    // Constants
    const DURATION = 2.0; // Seconds
    const BASE_ALTITUDE = 2.0;
    const HIGH_ALTITUDE = 3.5; // Jump height

    useEffect(() => {
        if (activeStation) {
            const { geo_lat, geo_long } = activeStation;

            // 1. Set start position from current camera
            startPos.current.copy(camera.position);

            // 2. Calculate target position (final resting spot)
            const endVec = latLonToVector3(geo_lat, geo_long, BASE_ALTITUDE);
            targetPos.current.copy(endVec);

            // 3. Reset animation
            progress.current = 0;
            isAnimating.current = true;
        }
    }, [activeStation, camera]);

    // Set initial control properties
    useEffect(() => {
        if (controls) {
            // @ts-ignore
            controls.enablePan = false;
            // @ts-ignore
            controls.enableZoom = true;
            // @ts-ignore
            controls.minDistance = 1.2;
            // @ts-ignore
            controls.maxDistance = 4;
            // @ts-ignore
            controls.autoRotate = false;
            // @ts-ignore
            controls.rotateSpeed = 0.5;
        }
    }, [controls]);

    useFrame((_, delta) => {
        if (!isAnimating.current) return;

        // Update progress
        progress.current += delta / DURATION;

        if (progress.current >= 1) {
            progress.current = 1;
            isAnimating.current = false;
        }

        // Ease function (SmoothStep or Quad)
        // t is 0 to 1
        const t = progress.current;
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // EaseInOutQuad

        // Slerp Rotation (orbit)
        // We clone startPos to not mutate it
        const currentVec = startPos.current.clone().normalize();
        const targetNorm = targetPos.current.clone().normalize();

        // Slerp logic: interpolate direction
        // q = start.slerp(end, easeT) (conceptually, but using vectors)
        // ThreeJS Vector3 lerp is linear, we need slight trick or just slerp if available?
        // Actually Vector3 doesn't have slerp. Quaternion does. 
        // But we can approximate or use: v.lerp(t).normalize().multiplyScalar(radius)

        // Better: linear lerp direction then normalize, it's close enough for Earth orbit
        // or properly: 
        const interpolatedDir = new Vector3().copy(currentVec).lerp(targetNorm, easeT).normalize();

        // Calculate Altitude (Arc)
        // Parabola: 4 * (t - t^2) peaks at 0.5
        const heightBoost = Math.sin(t * Math.PI) * (HIGH_ALTITUDE - BASE_ALTITUDE);
        const currentRadius = BASE_ALTITUDE + heightBoost;

        // Apply
        camera.position.copy(interpolatedDir.multiplyScalar(currentRadius));
        camera.lookAt(0, 0, 0);

        // Update controls target to keep it valid (locked to center usually)
        if (controls) {
            // @ts-ignore
            if (controls.target) controls.target.set(0, 0, 0);
        }
    });

    return null;
}
