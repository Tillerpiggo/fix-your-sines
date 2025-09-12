import { BurstOrchestrator } from '../audio/BurstOrchestrator';
import { BurstPattern } from '../types/audio';
import { baseFrequencies, defaultPattern } from '../../config/defaultPattern';

export class AudioController {
  private audioContext: AudioContext | null = null;
  private orchestrator: BurstOrchestrator | null = null;
  private isPlaying = false;
  private currentMaskCenter = 2500; // Default center frequency
  private currentBandwidth = 0.58; // Default bandwidth in octaves (roughly 2-3kHz)

  private async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Set up orchestrator with 5 bursts panned evenly from full left to full right
      this.orchestrator = new BurstOrchestrator(this.audioContext);
      this.orchestrator.setupBursts([-1, -0.5, 0, 0.5, 1]);
      
      // Configure with default settings
      this.orchestrator.setBaseFrequencies(baseFrequencies);
      this.orchestrator.setBurstParams({
        attackTime: 10,
        releaseTime: 100,
        spectralSlope: -4.5,
        volume: 0.5
      });
      this.orchestrator.setStepDelay(500);
      this.orchestrator.setStaggerDelay(20);
      this.orchestrator.loadPattern(defaultPattern);
    }
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

  private updateMaskPattern(): void {
    if (!this.orchestrator) return;
    
    // Calculate bounds based on bandwidth in octaves
    const halfBandwidth = this.currentBandwidth / 2;
    const lowerBound = this.currentMaskCenter / Math.pow(2, halfBandwidth);
    const upperBound = this.currentMaskCenter * Math.pow(2, halfBandwidth);
    
    const newPattern: BurstPattern = {
      steps: [
        {
          // Step 1: Exclude the frequency band for all bursts
          masks: new Map([
            [0, [{ range: [lowerBound, upperBound] }]],
            [1, [{ range: [lowerBound, upperBound] }]],
            [2, [{ range: [lowerBound, upperBound] }]],
            [3, [{ range: [lowerBound, upperBound] }]],
            [4, [{ range: [lowerBound, upperBound] }]]
          ])
        },
        {
          // Step 2: Full range, no masks
          masks: new Map()
        }
      ],
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