'use client';

import React from 'react';
import { AudioMode } from '../lib/controllers/AudioController';

interface AudioModeSelectorProps {
  value: AudioMode;
  onChange: (value: AudioMode) => void;
}

export default function AudioModeSelector({ 
  value, 
  onChange
}: AudioModeSelectorProps) {
  
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
        Sine Tones
      </label>
      
      <label style={{ 
        fontWeight: value === 'bandpassed-noise' ? 'bold' : 'normal',
        cursor: 'pointer'
      }}>
        <input
          type="radio"
          name="audioMode"
          value="bandpassed-noise"
          checked={value === 'bandpassed-noise'}
          onChange={handleChange}
          style={{ marginRight: '8px', cursor: 'pointer' }}
        />
        Bandpassed Noise
      </label>
    </div>
  );
}