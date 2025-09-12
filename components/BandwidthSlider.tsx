'use client';

import React from 'react';

interface BandwidthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function BandwidthSlider({ 
  value, 
  onChange, 
  min = 0.1, 
  max = 2.0 
}: BandwidthSliderProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
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
        Mask Bandwidth: {value.toFixed(2)} octaves
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step="0.01"
        value={value}
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
        <span>{min.toFixed(1)} oct</span>
        <span>{max.toFixed(1)} oct</span>
      </div>
    </div>
  );
}