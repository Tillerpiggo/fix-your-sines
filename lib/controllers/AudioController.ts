import { BurstOrchestrator } from '../audio/BurstOrchestrator';
import { BandpassedNoiseOrchestrator } from '../audio/BandpassedNoiseOrchestrator';
import { BurstPattern } from '../types/audio';
import { generateBaseFrequencies } from '../../config/defaultPattern';

export type AudioMode = 'tone' | 'bandpassed-noise';

export interface SoundstagePosition {
  panIndex: number;
  frequency: number;
}

export class AudioController {
  private audioContext: AudioContext | null = null;
  private orchestrator: BurstOrchestrator | null = null;
  private noiseOrchestrator: BandpassedNoiseOrchestrator | null = null;
  private audioMode: AudioMode = 'bandpassed-noise'; // Default to noise for testing
  private isPlaying = false;
  private currentMaskCenter = 500; // Default center frequency (500Hz for testing)
  private currentBandwidth = 2.0; // Default bandwidth in octaves (wider notch)
  private currentPanCount = 1; // Default to mono for debugging
  private currentStaggerDelay = 50; // Default stagger delay
  private currentFrequencyCount = 100; // Default frequency count
  private customPositions: SoundstagePosition[] | null = null;
  private useCustomPattern = false;

  private async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.orchestrator = new BurstOrchestrator(this.audioContext);
      this.noiseOrchestrator = new BandpassedNoiseOrchestrator(this.audioContext);
      this.setupPanning();
      
      // Configure with default settings
      const frequencies = generateBaseFrequencies(40, 14000, this.currentFrequencyCount);
      this.orchestrator.setBaseFrequencies(frequencies);
      this.orchestrator.setBurstParams({
        attackTime: 100,  // 100ms attack time
        releaseTime: 100,
        spectralSlope: -4.5,
        volume: 0.5
      });
      this.orchestrator.setStepDelay(500);
      this.orchestrator.setStaggerDelay(this.currentStaggerDelay);
      
      // Configure noise orchestrator
      this.noiseOrchestrator.setBaseFrequencies(frequencies);
      this.noiseOrchestrator.setBurstParams({
        attackTime: 100,  // 100ms attack time
        releaseTime: 100,
        spectralSlope: -4.5,
        volume: 1.0  // Max volume for noise
      });
      this.noiseOrchestrator.setStepDelay(500);
      this.noiseOrchestrator.setStaggerDelay(this.currentStaggerDelay);
      
      this.updatePattern();
    }
  }
  
  private setupPanning(): void {
    if (!this.orchestrator || !this.noiseOrchestrator) return;
    
    const panPositions: number[] = [];
    if (this.currentPanCount === 1) {
      panPositions.push(0); // Center only
    } else {
      for (let i = 0; i < this.currentPanCount; i++) {
        // Evenly distribute from -1 to 1
        const position = -1 + (2 * i / (this.currentPanCount - 1));
        panPositions.push(position);
      }
    }
    
    this.orchestrator.setupBursts(panPositions);
    this.noiseOrchestrator.setupBursts(panPositions);
  }

  async togglePlayback(): Promise<void> {
    await this.initializeAudio();
    
    if (!this.orchestrator || !this.noiseOrchestrator) return;

    if (this.isPlaying) {
      if (this.audioMode === 'bandpassed-noise') {
        this.noiseOrchestrator.stop();
      } else {
        this.orchestrator.stop();
      }
      this.isPlaying = false;
    } else {
      if (this.audioMode === 'bandpassed-noise') {
        this.noiseOrchestrator.play();
      } else {
        this.orchestrator.play();
      }
      this.isPlaying = true;
    }
  }
  
  setAudioMode(mode: AudioMode): void {
    const wasPlaying = this.isPlaying;
    
    // Stop current playback
    if (wasPlaying) {
      if (this.audioMode === 'bandpassed-noise') {
        this.noiseOrchestrator?.stop();
      } else {
        this.orchestrator?.stop();
      }
    }
    
    // Switch mode
    this.audioMode = mode;
    
    // Resume playback if was playing
    if (wasPlaying) {
      if (mode === 'bandpassed-noise') {
        this.noiseOrchestrator?.play();
      } else {
        this.orchestrator?.play();
      }
    }
  }

  getPlayingState(): boolean {
    return this.isPlaying;
  }

  updateBurstParams(params: {
    attackTime?: number;
    releaseTime?: number;
    spectralSlope?: number;
    volume?: number;
  }): void {
    if (this.orchestrator) {
      this.orchestrator.setBurstParams(params);
    }
    if (this.noiseOrchestrator) {
      this.noiseOrchestrator.setBurstParams(params);
    }
  }

  updateMaskCenterFrequency(centerFreq: number): void {
    this.currentMaskCenter = centerFreq;
    this.updatePattern();
  }

  updateMaskBandwidth(bandwidth: number): void {
    this.currentBandwidth = bandwidth;
    this.updatePattern();
  }
  
  updatePanCount(count: number): void {
    this.currentPanCount = count;
    if (this.orchestrator || this.noiseOrchestrator) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) {
        // Stop the currently active orchestrator based on mode
        if (this.audioMode === 'bandpassed-noise') {
          this.noiseOrchestrator?.stop();
        } else {
          this.orchestrator?.stop();
        }
      }
      this.setupPanning();
      this.updatePattern();
      if (wasPlaying) {
        // Restart the currently active orchestrator based on mode
        if (this.audioMode === 'bandpassed-noise') {
          this.noiseOrchestrator?.play();
        } else {
          this.orchestrator?.play();
        }
      }
    }
  }
  
  updateStaggerDelay(delay: number): void {
    this.currentStaggerDelay = delay;
    if (this.orchestrator) {
      this.orchestrator.setStaggerDelay(delay);
    }
    if (this.noiseOrchestrator) {
      this.noiseOrchestrator.setStaggerDelay(delay);
    }
  }
  
  updateFrequencyCount(count: number): void {
    this.currentFrequencyCount = count;
    const frequencies = generateBaseFrequencies(40, 14000, count);
    if (this.orchestrator) {
      this.orchestrator.setBaseFrequencies(frequencies);
    }
    if (this.noiseOrchestrator) {
      this.noiseOrchestrator.setBaseFrequencies(frequencies);
    }
  }

  setCustomPositions(positions: SoundstagePosition[]): void {
    this.customPositions = positions;
    this.useCustomPattern = true;
    this.updatePattern();
  }

  clearCustomPositions(): void {
    this.customPositions = null;
    this.useCustomPattern = false;
    this.updateMaskPattern();
  }

  private updatePattern(): void {
    if (this.useCustomPattern && this.customPositions) {
      this.updateCustomPattern();
    } else {
      this.updateMaskPattern();
    }
  }

  private updateCustomPattern(): void {
    if (!this.orchestrator || !this.noiseOrchestrator || !this.customPositions) return;

    const steps = [];
    
    // Create a pattern that cycles through each position
    this.customPositions.forEach(position => {
      const masks = new Map();
      
      // Calculate mask bounds for this position's frequency
      const halfBandwidth = this.currentBandwidth / 2;
      const lowerBound = position.frequency / Math.pow(2, halfBandwidth);
      const upperBound = position.frequency * Math.pow(2, halfBandwidth);
      
      // Create masks for all pan positions
      for (let i = 0; i < this.currentPanCount; i++) {
        if (i === position.panIndex) {
          // This position plays unmasked
          masks.set(i, []);
        } else {
          // Other positions are masked
          masks.set(i, [{ range: [lowerBound, upperBound] }]);
        }
      }
      
      steps.push({ masks });
    });

    // Add a step where all positions are masked (creates rhythm)
    if (steps.length > 0) {
      const allMasked = new Map();
      const centerFreq = this.customPositions[0].frequency;
      const halfBandwidth = this.currentBandwidth / 2;
      const lowerBound = centerFreq / Math.pow(2, halfBandwidth);
      const upperBound = centerFreq * Math.pow(2, halfBandwidth);
      
      for (let i = 0; i < this.currentPanCount; i++) {
        allMasked.set(i, [{ range: [lowerBound, upperBound] }]);
      }
      steps.push({ masks: allMasked });
    }

    const newPattern: BurstPattern = {
      steps,
      repeat: true
    };

    this.orchestrator.loadPattern(newPattern);
    this.noiseOrchestrator.loadPattern(newPattern);
  }

  private updateMaskPattern(): void {
    if (!this.orchestrator || !this.noiseOrchestrator) return;
    
    // Calculate bounds based on bandwidth in octaves
    const halfBandwidth = this.currentBandwidth / 2;
    const lowerBound = this.currentMaskCenter / Math.pow(2, halfBandwidth);
    const upperBound = this.currentMaskCenter * Math.pow(2, halfBandwidth);
    
    const steps = [];
    
    if (this.currentPanCount === 1) {
      // Simple alternating pattern for mono
      steps.push({
        masks: new Map([[0, [{ range: [lowerBound, upperBound] }]]])
      });
      steps.push({
        masks: new Map()
      });
    } else {
      // First, all positions exclude the masked band
      const allExclude = new Map();
      for (let i = 0; i < this.currentPanCount; i++) {
        allExclude.set(i, [{ range: [lowerBound, upperBound] }]);
      }
      steps.push({ masks: allExclude });
      
      // Then rotating pattern: one position at a time plays full range
      for (let i = 0; i < this.currentPanCount; i++) {
        const masks = new Map();
        for (let j = 0; j < this.currentPanCount; j++) {
          if (j !== i) {
            // Other positions still exclude the masked frequencies
            masks.set(j, [{ range: [lowerBound, upperBound] }]);
          }
          // Position i has no mask (plays full range)
        }
        steps.push({ masks });
      }
    }
    
    const newPattern: BurstPattern = {
      steps,
      repeat: true
    };
    
    this.orchestrator.loadPattern(newPattern);
    this.noiseOrchestrator.loadPattern(newPattern);
  }

  dispose(): void {
    if (this.orchestrator) {
      this.orchestrator.dispose();
      this.orchestrator = null;
    }
    if (this.noiseOrchestrator) {
      this.noiseOrchestrator.dispose();
      this.noiseOrchestrator = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}