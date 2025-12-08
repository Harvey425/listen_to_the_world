import { Stars, Sparkles } from '@react-three/drei';

export function CosmicBackground() {
    return (
        <group>
            {/* Base Starfield */}
            <Stars radius={300} depth={50} count={8000} factor={4} saturation={0} fade speed={0.5} />

            {/* Subtle floating particles (Space Dust) - Larger, Brighter, Fewer */}
            <Sparkles
                count={50}
                scale={40}
                size={6}
                speed={0.2}
                opacity={0.7}
                color="#eeffff"
            />
        </group>
    );
}
