import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, SPARKLE_SHADER } from '../constants';

interface FoliageProps {
  progress: number; // 0 (Formed) to 1 (Chaos)
}

const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, chaosPositions, colors } = useMemo(() => {
    const count = CONFIG.foliageCount;
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const colorEmerald = new THREE.Color(CONFIG.colors.emerald);
    const colorDark = new THREE.Color('#001a10');

    for (let i = 0; i < count; i++) {
      // Formed: Cone Shape
      // Normalized height 0 to 1
      const h = Math.random();
      const y = h * 15 - 5; // Height from -5 to 10
      const maxRadius = 6 * (1 - h); // Cone radius decreases as h increases
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius;
      
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      // Chaos: Sphere/Random Cloud
      const cx = (Math.random() - 0.5) * 40;
      const cy = (Math.random() - 0.5) * 40;
      const cz = (Math.random() - 0.5) * 20 + 5; // Bias towards camera slightly
      chaos[i * 3] = cx;
      chaos[i * 3 + 1] = cy;
      chaos[i * 3 + 2] = cz;

      // Color variation
      const mixedColor = colorEmerald.clone().lerp(colorDark, Math.random() * 0.5);
      cols[i * 3] = mixedColor.r;
      cols[i * 3 + 1] = mixedColor.g;
      cols[i * 3 + 2] = mixedColor.b;
    }

    return { positions: pos, chaosPositions: chaos, colors: cols };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorGold: { value: new THREE.Color(CONFIG.colors.gold) }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smooth lerp for the visual progress
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 chaosPosition;
    varying vec3 vColor;
    varying float vBlink;

    void main() {
      vColor = color;
      
      // Interpolate position
      vec3 newPos = mix(position, chaosPosition, uProgress);
      
      // Add some "breathing" wind effect when formed
      if (uProgress < 0.5) {
        float wind = sin(uTime * 2.0 + position.y * 0.5) * 0.1 * (1.0 - uProgress);
        newPos.x += wind;
        newPos.z += wind;
      } else {
        // Turbulent float when chaos
        newPos.y += sin(uTime + chaosPosition.x) * 0.1 * uProgress;
      }

      vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuates with distance
      gl_PointSize = (40.0 * (1.0 + uProgress)) / -mvPosition.z; 
      
      // Pass blink factor based on time and random pos
      vBlink = sin(uTime * 3.0 + chaosPosition.y);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorGold;
    uniform float uProgress;
    varying vec3 vColor;
    varying float vBlink;
    ${SPARKLE_SHADER}

    void main() {
      // Circle shape
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;

      // Base emerald color
      vec3 finalColor = vColor;

      // Gold sparkles (luxury dust)
      if (vBlink > 0.8) {
         finalColor = mix(finalColor, uColorGold, 0.8);
      }
      
      // Make them glow brighter in chaos mode
      if (uProgress > 0.5) {
         finalColor += vec3(0.2, 0.2, 0.0);
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-chaosPosition"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;
