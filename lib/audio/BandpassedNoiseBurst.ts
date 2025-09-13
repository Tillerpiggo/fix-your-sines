import { BurstParams } from '../types/audio';

export class BandpassedNoiseBurst {
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private panner: StereoPannerNode;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer;
  private filters: BiquadFilterNode[] = [];
  private envelopeGain: GainNode;
  private currentParams: BurstParams | null = null;
  private isInitialized = false;

  constructor(audioContext: AudioContext, panPosition: number) {
    this.audioContext = audioContext;
    
    // Create noise buffer with proper -4.5dB/octave slope
    this.noiseBuffer = this.createSlopedNoiseBuffer();
    
    this.envelopeGain = audioContext.createGain();
    this.envelopeGain.gain.value = 0;
    
    this.outputNode = audioContext.createGain();
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = panPosition;
    
    this.envelopeGain.connect(this.outputNode);
    this.outputNode.connect(this.panner);
    this.panner.connect(audioContext.destination);
  }

  private createSlopedNoiseBuffer(): AudioBuffer {
    // Create 2 seconds of -4.5dB/octave noise using multiple bandpassed pink noise streams
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate pink noise using Voss-McCartney algorithm
    const pinkNoise = new Float32Array(bufferSize);
    const numRows = 16;
    const rows = new Array(numRows).fill(0);
    let runningSum = 0;
    let index = 0;
    const indexMask = (1 << numRows) - 1;
    
    for (let i = 0; i < bufferSize; i++) {
      index = (index + 1) & indexMask;
      
      let numZeros = 0;
      let n = index;
      while (((n & 1) === 0) && (numZeros < numRows)) {
        n >>= 1;
        numZeros++;
      }
      
      const prevValue = rows[numZeros];
      rows[numZeros] = Math.random() * 2 - 1;
      runningSum += rows[numZeros] - prevValue;
      
      pinkNoise[i] = (runningSum + (Math.random() * 2 - 1)) / (numRows / 2);
    }

    // Clear output
    output.fill(0);

    // Define bands and calculate gains for -4.5dB/oct
    // Pink noise already has -3dB/oct, we need additional -1.5dB/oct
    // Each octave needs to be attenuated by 10^(-1.5/20) = 0.841 relative to the octave below
    
    const bands = [
      { low: 20, high: 40, centerOctave: -5 },
      { low: 40, high: 80, centerOctave: -4 },
      { low: 80, high: 160, centerOctave: -3 },
      { low: 160, high: 320, centerOctave: -2 },
      { low: 320, high: 640, centerOctave: -1 },
      { low: 640, high: 1280, centerOctave: 0 },    // Reference octave (1kHz region)
      { low: 1280, high: 2560, centerOctave: 1 },
      { low: 2560, high: 5120, centerOctave: 2 },
      { low: 5120, high: 10240, centerOctave: 3 },
      { low: 10240, high: 20000, centerOctave: 4 }
    ];

    // Calculate gain for each band
    const attenuationPerOctave = Math.pow(10, -1.5/20); // 0.841 for -1.5dB
    
    bands.forEach(band => {
      // Calculate gain based on octave position
      const gain = Math.pow(attenuationPerOctave, band.centerOctave);
      
      // Create bandpassed version of pink noise for this band
      const bandpassed = new Float32Array(bufferSize);
      
      // Simple two-pole butterworth bandpass
      // Highpass stage
      let hp_x1 = 0, hp_x2 = 0, hp_y1 = 0, hp_y2 = 0;
      const hp_omega = 2 * Math.PI * band.low / this.audioContext.sampleRate;
      const hp_sin = Math.sin(hp_omega);
      const hp_cos = Math.cos(hp_omega);
      const hp_alpha = hp_sin / Math.sqrt(2); // Q = 0.707 for Butterworth
      
      const hp_b0 = hp_alpha;
      const hp_b1 = 0;
      const hp_b2 = -hp_alpha;
      const hp_a0 = 1 + hp_alpha;
      const hp_a1 = -2 * hp_cos;
      const hp_a2 = 1 - hp_alpha;
      
      for (let i = 0; i < bufferSize; i++) {
        const hp_x0 = pinkNoise[i];
        const hp_y0 = (hp_b0 * hp_x0 + hp_b1 * hp_x1 + hp_b2 * hp_x2 - hp_a1 * hp_y1 - hp_a2 * hp_y2) / hp_a0;
        bandpassed[i] = hp_y0;
        
        hp_x2 = hp_x1;
        hp_x1 = hp_x0;
        hp_y2 = hp_y1;
        hp_y1 = hp_y0;
      }
      
      // Lowpass stage
      let lp_x1 = 0, lp_x2 = 0, lp_y1 = 0, lp_y2 = 0;
      const lp_omega = 2 * Math.PI * band.high / this.audioContext.sampleRate;
      const lp_sin = Math.sin(lp_omega);
      const lp_cos = Math.cos(lp_omega);
      const lp_alpha = lp_sin / Math.sqrt(2);
      
      const lp_b0 = (1 - lp_cos) / 2;
      const lp_b1 = 1 - lp_cos;
      const lp_b2 = (1 - lp_cos) / 2;
      const lp_a0 = 1 + lp_alpha;
      const lp_a1 = -2 * lp_cos;
      const lp_a2 = 1 - lp_alpha;
      
      for (let i = 0; i < bufferSize; i++) {
        const lp_x0 = bandpassed[i];
        const lp_y0 = (lp_b0 * lp_x0 + lp_b1 * lp_x1 + lp_b2 * lp_x2 - lp_a1 * lp_y1 - lp_a2 * lp_y2) / lp_a0;
        
        // Add this band's contribution with calculated gain
        output[i] += lp_y0 * gain;
        
        lp_x2 = lp_x1;
        lp_x1 = lp_x0;
        lp_y2 = lp_y1;
        lp_y1 = lp_y0;
      }
    });
    
    // Normalize to prevent clipping
    let maxVal = 0;
    for (let i = 0; i < bufferSize; i++) {
      maxVal = Math.max(maxVal, Math.abs(output[i]));
    }
    if (maxVal > 0) {
      const scale = 0.95 / maxVal;
      for (let i = 0; i < bufferSize; i++) {
        output[i] *= scale;
      }
    }

    return buffer;
  }

  setParams(params: BurstParams, maskBounds?: {lower: number, upper: number}): void {
    // Clean up previous setup
    this.cleanup();
    
    // Create new noise source
    this.noiseSource = this.audioContext.createBufferSource();
    this.noiseSource.buffer = this.noiseBuffer;
    this.noiseSource.loop = true;
    
    // Clear old filters
    this.filters = [];
    
    if (!maskBounds) {
      // No mask = full spectrum noise, no filtering needed
      this.noiseSource.connect(this.envelopeGain);
    } else {
      // Masked mode: Use a notch filter to remove the mask region
      const { lower, upper } = maskBounds;
      const centerFreq = Math.sqrt(lower * upper); // Geometric mean for center
      const Q = centerFreq / (upper - lower); // Q factor for the notch width
      
      // Create a notch filter (band-reject)
      const notchFilter = this.audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.value = centerFreq;
      notchFilter.Q.value = Math.min(Q, 20); // Cap Q to prevent instability
      
      this.noiseSource.connect(notchFilter);
      notchFilter.connect(this.envelopeGain);
      
      this.filters.push(notchFilter);
    }
    
    // Start the noise source
    this.noiseSource.start();
    
    this.currentParams = params;
    this.isInitialized = true;
  }

  play(): void {
    if (!this.currentParams || !this.isInitialized) {
      console.warn('BandpassedNoiseBurst: Cannot play without parameters set');
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