import { BurstParams } from '../types/audio';

export class NoiseBurst {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private panner: StereoPannerNode;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer;
  private filters: BiquadFilterNode[] = [];
  private envelopeGain: GainNode;
  private currentParams: BurstParams | null = null;
  private isInitialized = false;
  private filterQ = 10; // Q factor for notch filters (higher = narrower notch)

  constructor(audioContext: AudioContext, panPosition: number) {
    this.audioContext = audioContext;
    
    // Create white noise buffer
    this.noiseBuffer = this.createNoiseBuffer();
    
    this.envelopeGain = audioContext.createGain();
    this.envelopeGain.gain.value = 0;
    
    this.outputNode = audioContext.createGain();
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = panPosition;
    
    this.envelopeGain.connect(this.outputNode);
    this.outputNode.connect(this.panner);
    this.panner.connect(audioContext.destination);
  }

  private createNoiseBuffer(): AudioBuffer {
    // Create 2 seconds of pink noise using the Voss-McCartney algorithm
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Pink noise generation using Voss-McCartney algorithm
    // This creates multiple white noise generators at different update rates
    const numGenerators = 16;
    const generators = new Array(numGenerators).fill(0);
    
    for (let i = 0; i < bufferSize; i++) {
      let sum = 0;
      
      // Update each generator at its specific rate
      for (let g = 0; g < numGenerators; g++) {
        const updateRate = Math.pow(2, g);
        if (i % updateRate === 0) {
          generators[g] = Math.random() * 2 - 1;
        }
        sum += generators[g];
      }
      
      // Normalize and apply slight high-frequency compensation
      // Pink noise is naturally -3dB/oct, this adds a bit more slope
      output[i] = sum / (numGenerators * 0.75);
    }
    
    // Apply additional gentle high-frequency rolloff for -4.5dB/oct approximation
    // Using a simple first-order lowpass filter
    const cutoff = 0.15; // Adjust for desired slope
    for (let i = 1; i < bufferSize; i++) {
      output[i] = output[i] * cutoff + output[i - 1] * (1 - cutoff);
    }

    return buffer;
  }

  setParams(params: BurstParams): void {
    const { frequencies } = params;
    
    // Clean up previous setup
    this.cleanup();
    
    // Create new noise source
    this.noiseSource = this.audioContext.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.loop = true;
    
    // Create notch filters for each frequency
    let previousNode: AudioNode = this.noiseSource;
    
    // Clear old filters
    this.filters = [];
    
    // Create a notch filter for each frequency
    frequencies.forEach(freq => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'notch';
      filter.frequency.value = freq;
      filter.Q.value = this.filterQ;
      
      previousNode.connect(filter);
      previousNode = filter;
      this.filters.push(filter);
    });
    
    // Connect the last filter to the envelope
    previousNode.connect(this.envelopeGain);
    
    // Start the noise source
    this.noiseSource.start();
    
    this.currentParams = params;
    this.isInitialized = true;
  }

  play(): void {
    if (!this.currentParams || !this.isInitialized) {
      console.warn('NoiseBurst: Cannot play without parameters set');
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

  private cleanup(): void {
    if (this.noiseSource) {
      this.noiseSource.stop();
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }
    
    this.filters.forEach(filter => filter.disconnect());
    this.filters = [];
    
    this.isInitialized = false;
  }

  dispose(): void {
    this.cleanup();
    this.envelopeGain.disconnect();
    this.outputNode.disconnect();
    this.panner.disconnect();
  }
}