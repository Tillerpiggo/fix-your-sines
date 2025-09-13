'use client';

import React from 'react';
import { AudioMode } from '../lib/controllers/AudioController';

interface AudioModeToggleProps {
  value: AudioMode;
  onChange: (value: AudioMode) => void;
}

export default function AudioModeToggle({ 
  value, 
  onChange
}: AudioModeToggleProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value as AudioMode);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '20px',
      margin: '20px 0',
      justifyContent: 'center'
    }}>
      <label style={{ 
        fontWeight: value === 'tone' ? 'bold' : 'normal',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="audioMode"
          value="tone"
          checked={value === 'tone'}
          onChange={handleChange}
          style={{ marginRight: '8px', cursor: 'pointer' }}
        />
        Tone Burst
      </label>
      
      <label style={{ 
        fontWeight: value === 'noise' ? 'bold' : 'normal',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="audioMode"
          value="noise"
          checked={value === 'noise'}
          onChange={handleChange}
          style={{ marginRight: '8px', cursor: 'pointer' }}
        />
        Noise Burst (Notched)
      </label>
    </div>
  );
}