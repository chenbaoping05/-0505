import { TreeConfig } from './types';

export const CONFIG: TreeConfig = {
  foliageCount: 15000,
  ornamentCount: 150,
  polaroidCount: 20,
  colors: {
    emerald: '#004028', // Deep Emerald
    gold: '#FFD700',    // High-gloss Gold
    lightGold: '#FFF8DC',
    white: '#FFFFFF',
  },
};

// Shader chunk for gold dust effect
export const SPARKLE_SHADER = `
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(fract(sin(dot(i + vec3(0, 0, 0), vec3(12.9898, 78.233, 37.719))) * 43758.5453),
                       fract(sin(dot(i + vec3(1, 0, 0), vec3(12.9898, 78.233, 37.719))) * 43758.5453), f.x),
                   mix(fract(sin(dot(i + vec3(0, 1, 0), vec3(12.9898, 78.233, 37.719))) * 43758.5453),
                       fract(sin(dot(i + vec3(1, 1, 0), vec3(12.9898, 78.233, 37.719))) * 43758.5453), f.x), f.y),
               mix(mix(fract(sin(dot(i + vec3(0, 0, 1), vec3(12.9898, 78.233, 37.719))) * 43758.5453),
                       fract(sin(dot(i + vec3(1, 0, 1), vec3(12.9898, 78.233, 37.719))) * 43758.5453), f.x),
                   mix(fract(sin(dot(i + vec3(0, 1, 1), vec3(12.9898, 78.233, 37.719))) * 43758.5453),
                       fract(sin(dot(i + vec3(1, 1, 1), vec3(12.9898, 78.233, 37.719))) * 43758.5453), f.x), f.y), f.z);
  }
`;
