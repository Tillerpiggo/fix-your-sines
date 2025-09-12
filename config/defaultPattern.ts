import { BurstPattern } from '../lib/types/audio';

// Generate base frequencies from 100Hz to 10kHz
export const generateBaseFrequencies = (minFreq: number, maxFreq: number, count: number): number[] => {
  const frequencies: number[] = [];
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logStep = (logMax - logMin) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const logFreq = logMin + i * logStep;
    frequencies.push(Math.pow(10, logFreq));
  }
  
  return frequencies;
};

export const baseFrequencies = generateBaseFrequencies(100, 10000, 100);

// Default pattern: alternating 2-3kHz excluded/included
export const defaultPattern: BurstPattern = {
  steps: [
    {
      // Step 1: Exclude 2-3kHz for all bursts
      masks: new Map([
        [0, [{ range: [2000, 3000] }]],
        [1, [{ range: [2000, 3000] }]],
        [2, [{ range: [2000, 3000] }]],
        [3, [{ range: [2000, 3000] }]],
        [4, [{ range: [2000, 3000] }]]
      ])
    },
    {
      // Step 2: Full range, no masks
      masks: new Map()
    }
  ],
  repeat: true
};