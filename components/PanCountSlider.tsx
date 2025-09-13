'use client';

import React from 'react';

interface PanCountSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function PanCountSlider({ 
  value, 
  onChange, 
  min = 1, 
  max = 5 
}: PanCountSliderProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
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
        Number of Panning Positions: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
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
        <span>{min} (Mono)</span>
        <span>{max} (5 Positions)</span>
      </div>
    </div>
  );
}