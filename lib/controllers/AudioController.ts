import { BurstOrchestrator } from '../audio/BurstOrchestrator';
import { BurstPattern } from '../types/audio';
import { baseFrequencies, defaultPattern } from '../../config/defaultPattern';

export class AudioController {
  private audioContext: AudioContext | null = null;
  private orchestrator: BurstOrchestrator | null = null;
  private isPlaying = false;

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