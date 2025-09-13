'use client';

import React from 'react';

interface FrequencyCountSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function FrequencyCountSlider({ 
  value, 
  onChange, 
  min = 10, 
  max = 500 
}: FrequencyCountSliderProps) {
  
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
        Frequencies per Burst: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step="10"
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
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}