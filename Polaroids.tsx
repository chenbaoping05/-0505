import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

interface PolaroidsProps {
  progress: number;
}

// Generate a placeholder texture canvas
const createPolaroidTexture = (index: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // White border
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, 256, 300);
    
    // "Photo" area
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 20, 216, 216);
    
    // Random abstract art
    ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
    ctx.beginPath();
    ctx.arc(128, 128, 50 + Math.random() * 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#333';
    ctx.font = '20px Playfair Display';
    ctx.textAlign = 'center';
    ctx.fillText(`Memory #${index + 1}`, 128, 280);
  }
  return new THREE.CanvasTexture(canvas);
};

const Polaroids: React.FC<PolaroidsProps> = ({ progress }) => {
  const count = CONFIG.polaroidCount;
  
  const textures = useMemo(() => Array.from({ length: count }, (_, i) => createPolaroidTexture(i)), [count]);
  
  const data = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      chaosPos: new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 20 + 5,
        (Math.random() - 0.5) * 10 + 5 
      ),
      targetPos: new THREE.Vector3(
         Math.cos(i) * 3,
         (i / count) * 12 - 4, // Spiral up the tree center
         Math.sin(i) * 3 + 2 // Push slightly front
      ),
      rotation: new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.5)
    }));
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    groupRef.current.children.forEach((child, i) => {
      const d = data[i];
      // Lerp position
      child.position.lerpVectors(d.targetPos, d.chaosPos, progress);
      
      // Look at camera mostly, but sway in chaos
      child.lookAt(state.camera.position);
      
      if (progress > 0.5) {
          // Add float in chaos
          child.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {textures.map((tex, i) => (
        <mesh key={i} rotation={data[i].rotation}>
          <planeGeometry args={[1.2, 1.4]} />
          <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

export default Polaroids;
