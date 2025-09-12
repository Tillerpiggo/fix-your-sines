'use client';

import React from 'react';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export default function PlayButton({ isPlaying, onToggle }: PlayButtonProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: '12px 24px',
        fontSize: '18px',
        fontWeight: 'bold',
        backgroundColor: isPlaying ? '#ff4444' : '#44ff44',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
    >
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}