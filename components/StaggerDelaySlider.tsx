'use client';

import React from 'react';

interface StaggerDelaySliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function StaggerDelaySlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 200 
}: StaggerDelaySliderProps) {
  
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
        Stagger Delay Between Pans: {value} ms
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step="5"
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
        <span>{min} ms</span>
        <span>{max} ms</span>
      </div>
    </div>
  );
}