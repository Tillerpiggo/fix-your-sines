import { BurstParams } from '../types/audio';

export class ToneBurst {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private panner: StereoPannerNode;
  private oscillators: OscillatorNode[] = [];
  private oscillatorGains: GainNode[] = [];  // Need these for spectral slope
  private envelopeGain: GainNode;
  private currentParams: BurstParams | null = null;
  private isInitialized = false;

  constructor(audioContext: AudioContext, panPosition: number) {
    this.audioContext = audioContext;
    
    this.envelopeGain = audioContext.createGain();
    this.envelopeGain.gain.value = 0;
    
    this.outputNode = audioContext.createGain();
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = panPosition;
    
    this.envelopeGain.connect(this.outputNode);
    this.outputNode.connect(this.panner);
    this.panner.connect(audioContext.destination);
  }

  setParams(params: BurstParams): void {
    const { frequencies, spectralSlope } = params;
    
    // If frequency count changed, rebuild oscillators
    if (this.oscillators.length !== frequencies.length) {
      this.cleanup();
      this.initializeOscillators(frequencies.length);
    }
    
    // Update frequencies and gains
    const gains = this.applySpectralSlope(frequencies, spectralSlope);
    frequencies.forEach((freq, i) => {
      this.oscillators[i].frequency.value = freq;
      this.oscillatorGains[i].gain.value = gains[i];
    });
    
    this.currentParams = params;
  }

  play(): void {
    if (!this.currentParams) {
      console.warn('ToneBurst: Cannot play without parameters set');
      return;
    }
    
    const { attackTime, releaseTime, volume } = this.currentParams;
    
    const now = this.audioContext.currentTime;
    const attackEnd = now + attackTime / 1000;
    const releaseEnd = attackEnd + releaseTime / 1000;
    
    // Cancel any ongoing envelope
    this.envelopeGain.gain.cancelScheduledValues(now);
    
    // Apply new envelope
    this.envelopeGain.gain.setValueAtTime(0, now);
    this.envelopeGain.gain.linearRampToValueAtTime(volume, attackEnd);
    this.envelopeGain.gain.linearRampToValueAtTime(0, releaseEnd);
  }

  private initializeOscillators(count: number): void {
    const now = this.audioContext.currentTime;
    
    for (let i = 0; i < count; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      
      oscillator.connect(gainNode);
      gainNode.connect(this.envelopeGain);
      
      // Start each oscillator at a slightly different time to randomize phase
      const randomDelay = Math.random() * 0.001; // Up to 1ms random delay
      oscillator.start(now + randomDelay);
      
      this.oscillators.push(oscillator);
      this.oscillatorGains.push(gainNode);
    }
    
    this.isInitialized = true;
  }

  private cleanup(): void {
    this.oscillators.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });
    this.oscillatorGains.forEach(gain => gain.disconnect());
    
    this.oscillators = [];
    this.oscillatorGains = [];
    this.isInitialized = false;
  }

  private applySpectralSlope(frequencies: number[], slopeDbPerOct: number): number[] {
    if (frequencies.length === 0) return [];
    
    const minFreq = Math.min(...frequencies);
    
    return frequencies.map(freq => {
      const octaves = Math.log2(freq / minFreq);
      const dbReduction = octaves * slopeDbPerOct;
      return Math.pow(10, dbReduction / 20);
    });
  }

  dispose(): void {
    this.cleanup();
    this.envelopeGain.disconnect();
    this.outputNode.disconnect();
    this.panner.disconnect();
  }
}