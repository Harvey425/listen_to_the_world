import { BackSide, AdditiveBlending } from 'three';

export function AtmosphereGlow() {
    return (
        <mesh scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[1, 64, 64]} />
            <shaderMaterial
                blending={AdditiveBlending}
                side={BackSide}
                transparent
                uniforms={{
                    color: { value: { r: 0.0, g: 0.6, b: 1.0 } }, // Cyan/Blueish halo
                    coefficient: { value: 0.5 },
                    power: { value: 4.0 },
                    intensity: { value: 0.6 }
                }}
                vertexShader={`
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 color;
                    uniform float coefficient;
                    uniform float power;
                    uniform float intensity;
                    varying vec3 vNormal;
                    void main() {
                        float intensityValue = pow(coefficient - dot(vNormal, vec3(0, 0, 1.0)), power);
                        gl_FragColor = vec4(color, 1.0) * intensityValue * intensity;
                    }
                `}
            />
        </mesh>
    );
}
