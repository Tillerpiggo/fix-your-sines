import { BurstPattern, BurstParams, FrequencyMask } from '../types/audio';
import { NoiseBurst } from './NoiseBurst';
import { ToneBurst } from './ToneBurst';

export class NoiseOrchestrator {
  private audioContext: AudioContext;
  private noiseBursts: NoiseBurst[] = [];
  private toneBursts: ToneBurst[] = [];
  private baseFrequencies: number[] = [];
  private isPlaying = false;
  private stepDelay = 500; // ms between pattern steps
  private staggerDelay = 20; // ms between simultaneous bursts
  private timeoutId: number | null = null;
  private currentStep = 0; // Track current step for alternating
  private maskCenter = 2500; // Center frequency for the mask
  private maskBandwidth = 0.58; // Bandwidth in octaves
  
  // Burst parameters (shared across all bursts)
  private burstParams = {
    attackTime: 10,
    releaseTime: 100,
    spectralSlope: -4.5,
    volume: 0.5
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  setupBursts(panPositions: number[]): void {
    // Clear existing bursts
    this.noiseBursts.forEach(burst => burst.dispose());
    this.noiseBursts = [];
    this.toneBursts.forEach(burst => burst.dispose());
    this.toneBursts = [];
    
    // Create new noise and tone bursts for each position
    panPositions.forEach(pan => {
      this.noiseBursts.push(new NoiseBurst(this.audioContext, pan));
      this.toneBursts.push(new ToneBurst(this.audioContext, pan));
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

  play(): void {
    if (this.baseFrequencies.length === 0) {
      console.warn('NoiseOrchestrator: Cannot play without frequencies');
      return;
    }
    
    this.isPlaying = true;
    this.currentStep = 0;
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
    if (!this.isPlaying) return;
    
    // Calculate bounds for the mask band
    const halfBandwidth = this.maskBandwidth / 2;
    const lowerBound = this.maskCenter / Math.pow(2, halfBandwidth);
    const upperBound = this.maskCenter * Math.pow(2, halfBandwidth);
    
    // Get frequencies within the mask band
    const maskedFrequencies = this.baseFrequencies.filter(
      freq => freq >= lowerBound && freq <= upperBound
    );
    
    // Alternate between noise-only and noise+sine
    const playSineTone = this.currentStep % 2 === 1;
    
    // Execute bursts for this step
    let staggerOffset = 0;
    
    // Play noise with a notch at the mask band frequencies
    this.noiseBursts.forEach((burst, index) => {
      const params: BurstParams = {
        frequencies: maskedFrequencies, // Only notch at frequencies in the mask band
        ...this.burstParams
      };
      
      // Schedule with stagger
      setTimeout(() => {
        burst.setParams(params);
        burst.play();
      }, staggerOffset);
    });
    
    // On odd steps, play sine tones at the masked frequencies (filling the notch)
    if (playSineTone) {
      this.toneBursts.forEach((burst, index) => {
        const params: BurstParams = {
          frequencies: maskedFrequencies, // Play tones at the notched frequencies
          ...this.burstParams
        };
        
        // Schedule with same timing as noise
        setTimeout(() => {
          burst.setParams(params);
          burst.play();
        }, staggerOffset);
      });
    }
    
    staggerOffset += this.staggerDelay;
    
    // Move to next step
    this.currentStep++;
    
    // Schedule next step
    this.timeoutId = window.setTimeout(() => {
      this.executeNextStep();
    }, this.stepDelay);
  }

  dispose(): void {
    this.stop();
    this.noiseBursts.forEach(burst => burst.dispose());
    this.noiseBursts = [];
    this.toneBursts.forEach(burst => burst.dispose());
    this.toneBursts = [];
  }
}