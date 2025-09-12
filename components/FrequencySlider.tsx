'use client';

import React from 'react';

interface FrequencySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function FrequencySlider({ 
  value, 
  onChange, 
  min = 100, 
  max = 10000 
}: FrequencySliderProps) {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  
  // Convert to 0-100 scale for slider
  const sliderValue = ((logValue - logMin) / (logMax - logMin)) * 100;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    // Convert back from 0-100 to log scale
    const logVal = logMin + (sliderVal / 100) * (logMax - logMin);
    const freqVal = Math.pow(10, logVal);
    onChange(freqVal);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '10px',
      margin: '20px 0'
    }}>
      <label style={{ fontWeight: 'bold' }}>
        Mask Center Frequency: {value.toFixed(0)} Hz
      </label>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={sliderValue}
        onChange={handleChange}
        style={{ width: '300px' }}
      />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '300px',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>{min} Hz</span>
        <span>{max} Hz</span>
      </div>
    </div>
  );
}