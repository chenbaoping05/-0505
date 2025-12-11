export enum TreeMode {
  CHAOS = 'CHAOS',
  FORMING = 'FORMING',
  FORMED = 'FORMED'
}

export interface HandGestureState {
  isUnleashed: boolean; // True if hand is open (Chaos), False if closed (Tree)
  handX: number; // -1 to 1
  handY: number; // -1 to 1
}

export interface TreeConfig {
  foliageCount: number;
  ornamentCount: number;
  polaroidCount: number;
  colors: {
    emerald: string;
    gold: string;
    lightGold: string;
    white: string;
  };
}