import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import Polaroids from './Polaroids';
import { HandGestureState } from '../types';

interface SceneProps {
  gestureState: HandGestureState;
}

const Rig = ({ gestureState }: { gestureState: HandGestureState }) => {
  useFrame((state) => {
    // Smoothly interpolate camera position based on hand tracking
    // Base position is [0, 4, 20]
    const targetX = gestureState.handX * 5; // Move left/right
    const targetY = 4 + (gestureState.handY * 3); // Move up/down
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.lookAt(0, 3, 0);
  });
  return null;
}

const Scene: React.FC<SceneProps> = ({ gestureState }) => {
  const [progress, setProgress] = React.useState(0); // 0 = Formed, 1 = Chaos

  // Smoothly animate the transition based on unleash state
  useFrame((state, delta) => {
    const target = gestureState.isUnleashed ? 1 : 0;
    // Faster transition to chaos, slower return to form
    const speed = gestureState.isUnleashed ? 2.5 : 1.0; 
    let newProg = THREE.MathUtils.damp(progress, target, speed, delta);
    setProgress(newProg);
  });

  return (
    <>
      <color attach="background" args={['#010503']} />
      
      <Rig gestureState={gestureState} />
      
      {/* Lighting */}
      <Environment preset="lobby" background={false} />
      <ambientLight intensity={0.5} color="#004028" />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
      <pointLight position={[-10, 5, 10]} intensity={0.5} color="#fff" />
      
      {/* Tree Components */}
      <group position={[0, -2, 0]}>
        <Foliage progress={progress} />
        <Ornaments progress={progress} />
        <Polaroids progress={progress} />
      </group>

      {/* Post Processing for Trump-style Luxury */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

export default Scene;
