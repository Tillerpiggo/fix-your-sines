import { BurstPattern, BurstParams, FrequencyMask } from '../types/audio';
import { ToneBurst } from './ToneBurst';

export class BurstOrchestrator {
  private audioContext: AudioContext;
  private bursts: ToneBurst[] = [];
  private baseFrequencies: number[] = [];
  private pattern: BurstPattern | null = null;
  private currentStepIndex = 0;
  private isPlaying = false;
  private stepDelay = 500; // ms between pattern steps
  private staggerDelay = 20; // ms between simultaneous bursts
  private timeoutId: number | null = null;
  
  // Burst parameters (shared across all bursts)
  private burstParams = {
    attackTime: 30,
    releaseTime: 100,
    spectralSlope: -4.5,
    volume: 0.5
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  setupBursts(panPositions: number[]): void {
    // Clear existing bursts
    this.bursts.forEach(burst => burst.dispose());
    this.bursts = [];
    
    // Create new bursts
    panPositions.forEach(pan => {
      this.bursts.push(new ToneBurst(this.audioContext, pan));
    });
  }

  setBaseFrequencies(frequencies: number[]): void {
    this.baseFrequencies = frequencies;
  }

  setBurstParams(params: Partial<typeof this.burstParams>): void {
    this.burstParams = { ...this.burstParams, ...params };
  }

  setStepDelay(delay: number): void {
    this.stepDelay = delay;
  }

  setStaggerDelay(delay: number): void {
    this.staggerDelay = delay;
  }

  loadPattern(pattern: BurstPattern): void {
    this.pattern = pattern;
    this.currentStepIndex = 0;
  }

  play(): void {
    if (!this.pattern || this.baseFrequencies.length === 0) {
      console.warn('BurstOrchestrator: Cannot play without pattern and frequencies');
      return;
    }
    
    this.isPlaying = true;
    this.executeNextStep();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private executeNextStep(): void {
    if (!this.isPlaying || !this.pattern) return;
    
    const step = this.pattern.steps[this.currentStepIndex];
    
    // Execute bursts for this step
    let staggerOffset = 0;
    this.bursts.forEach((burst, burstIndex) => {
      // Get masks for this burst (if any)
      const masks = step.masks.get(burstIndex) || [];
      
      // Apply masks to get filtered frequencies
      const frequencies = this.applyFrequencyMasks(this.baseFrequencies, masks);
      
      // Set parameters and play
      if (frequencies.length > 0) {
        const params: BurstParams = {
          frequencies,
          ...this.burstParams
        };
        
        // Schedule with stagger
        setTimeout(() => {
          burst.setParams(params);
          burst.play();
        }, staggerOffset);
        
        staggerOffset += this.staggerDelay;
      }
    });
    
    // Move to next step
    this.currentStepIndex = (this.currentStepIndex + 1) % this.pattern.steps.length;
    
    // Schedule next step
    if (this.pattern.repeat || this.currentStepIndex !== 0) {
      this.timeoutId = window.setTimeout(() => {
        this.executeNextStep();
      }, this.stepDelay);
    } else {
      this.isPlaying = false;
    }
  }

  private applyFrequencyMasks(frequencies: number[], masks: FrequencyMask[]): number[] {
    if (masks.length === 0) return frequencies;
    
    return frequencies.filter(freq => {
      // Check if frequency is excluded by any mask
      for (const mask of masks) {
        if (freq >= mask.range[0] && freq <= mask.range[1]) {
          return false; // Excluded by this mask
        }
      }
      return true; // Not excluded by any mask
    });
  }

  dispose(): void {
    this.stop();
    this.bursts.forEach(burst => burst.dispose());
    this.bursts = [];
  }
}