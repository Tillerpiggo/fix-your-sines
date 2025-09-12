export interface FrequencyMask {
  range: [number, number];
}

export interface PatternStep {
  masks: Map<number, FrequencyMask[]>;  // burstIndex -> masks for that burst
}

export interface BurstPattern {
  steps: PatternStep[];
  repeat: boolean;
}

export interface BurstParams {
  frequencies: number[];
  attackTime: number;
  releaseTime: number;
  spectralSlope: number;
  volume: number;
}