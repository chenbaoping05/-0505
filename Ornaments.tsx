import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

interface OrnamentsProps {
  progress: number;
}

const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = CONFIG.ornamentCount;
  
  // Physics & Position Data
  const data = useMemo(() => {
    const targetPos: THREE.Vector3[] = [];
    const chaosPos: THREE.Vector3[] = [];
    const rotationSpeed: number[] = [];
    const colors: THREE.Color[] = [];
    
    const palette = [
      new THREE.Color(CONFIG.colors.gold),
      new THREE.Color(CONFIG.colors.lightGold),
      new THREE.Color('#C41E3A'), // Cardinal Red for luxury contrast
    ];

    for (let i = 0; i < count; i++) {
      // Target: Spiral on cone
      const h = Math.random();
      const y = h * 14 - 4; 
      const maxRadius = 5.5 * (1 - h) + 0.5; // Slightly outside foliage
      const angle = (h * 20) + (i * 0.5); // Spiral
      const x = Math.cos(angle) * maxRadius;
      const z = Math.sin(angle) * maxRadius;
      targetPos.push(new THREE.Vector3(x, y, z));

      // Chaos: Random space
      chaosPos.push(new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      ));
      
      rotationSpeed.push(Math.random() * 0.02);
      colors.push(palette[Math.floor(Math.random() * palette.length)]);
    }
    return { targetPos, chaosPos, rotationSpeed, colors };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update loop
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // We use a local progress that lags slightly for "weight" simulation
    // But for simplicity in this generated code, we interp directly on positions
    
    for (let i = 0; i < count; i++) {
      const target = data.targetPos[i];
      const chaos = data.chaosPos[i];
      
      // Interpolate
      dummy.position.lerpVectors(target, chaos, progress);
      
      // Rotate for bling
      dummy.rotation.x += data.rotationSpeed[i];
      dummy.rotation.y += data.rotationSpeed[i];
      
      // Scale pop effect when forming
      const s = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
      dummy.scale.set(s, s, s);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, data.colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        emissive={CONFIG.colors.gold}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};

export default Ornaments;
