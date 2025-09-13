import { BurstOrchestrator } from '../audio/BurstOrchestrator';
import { BurstPattern } from '../types/audio';
import { generateBaseFrequencies } from '../../config/defaultPattern';

export class AudioController {
  private audioContext: AudioContext | null = null;
  private orchestrator: BurstOrchestrator | null = null;
  private isPlaying = false;
  private currentMaskCenter = 2500; // Default center frequency
  private currentBandwidth = 0.58; // Default bandwidth in octaves (roughly 2-3kHz)
  private currentPanCount = 1; // Default to mono for debugging
  private currentStaggerDelay = 50; // Default stagger delay
  private currentFrequencyCount = 100; // Default frequency count

  private async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.orchestrator = new BurstOrchestrator(this.audioContext);
      this.setupPanning();
      
      // Configure with default settings
      const frequencies = generateBaseFrequencies(40, 14000, this.currentFrequencyCount);
      this.orchestrator.setBaseFrequencies(frequencies);
      this.orchestrator.setBurstParams({
        attackTime: 75,  // Increased to 75ms for much smoother onset
        releaseTime: 100,
        spectralSlope: -4.5,
        volume: 0.5
      });
      this.orchestrator.setStepDelay(500);
      this.orchestrator.setStaggerDelay(this.currentStaggerDelay);
      this.updateMaskPattern();
    }
  }
  
  private setupPanning(): void {
    if (!this.orchestrator) return;
    
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
  }

  async togglePlayback(): Promise<void> {
    await this.initializeAudio();
    
    if (!this.orchestrator) return;

    if (this.isPlaying) {
      this.orchestrator.stop();
      this.isPlaying = false;
    } else {
      this.orchestrator.play();
      this.isPlaying = true;
    }
  }

  getPlayingState(): boolean {
    return this.isPlaying;
  }

  updatePattern(pattern: BurstPattern): void {
    if (this.orchestrator) {
      this.orchestrator.loadPattern(pattern);
    }
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
  }

  updateMaskCenterFrequency(centerFreq: number): void {
    this.currentMaskCenter = centerFreq;
    this.updateMaskPattern();
  }

  updateMaskBandwidth(bandwidth: number): void {
    this.currentBandwidth = bandwidth;
    this.updateMaskPattern();
  }
  
  updatePanCount(count: number): void {
    this.currentPanCount = count;
    if (this.orchestrator) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) {
        this.orchestrator.stop();
      }
      this.setupPanning();
      this.updateMaskPattern();
      if (wasPlaying) {
        this.orchestrator.play();
      }
    }
  }
  
  updateStaggerDelay(delay: number): void {
    this.currentStaggerDelay = delay;
    if (this.orchestrator) {
      this.orchestrator.setStaggerDelay(delay);
    }
  }
  
  updateFrequencyCount(count: number): void {
    this.currentFrequencyCount = count;
    if (this.orchestrator) {
      const frequencies = generateBaseFrequencies(40, 14000, count);
      this.orchestrator.setBaseFrequencies(frequencies);
    }
  }

  private updateMaskPattern(): void {
    if (!this.orchestrator) return;
    
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
  }

  dispose(): void {
    if (this.orchestrator) {
      this.orchestrator.dispose();
      this.orchestrator = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}