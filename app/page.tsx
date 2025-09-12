'use client';

import { useState, useEffect } from 'react';
import PlayButton from '../components/PlayButton';
import FrequencySlider from '../components/FrequencySlider';
import { AudioController } from '../lib/controllers/AudioController';
import styles from './page.module.css';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [controller, setController] = useState<AudioController | null>(null);
  const [centerFrequency, setCenterFrequency] = useState(2500); // Default to 2.5kHz center

  useEffect(() => {
    const audioController = new AudioController();
    setController(audioController);

    return () => {
      audioController.dispose();
    };
  }, []);

  const handleToggle = async () => {
    if (!controller) return;
    
    await controller.togglePlayback();
    setIsPlaying(controller.getPlayingState());
  };

  const handleFrequencyChange = (freq: number) => {
    setCenterFrequency(freq);
    if (controller) {
      controller.updateMaskCenterFrequency(freq);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sine Tone Burst Player</h1>
        <p>Playing -4.5dB/oct pattern with masked frequency band alternating</p>
        <FrequencySlider 
          value={centerFrequency} 
          onChange={handleFrequencyChange}
          min={100}
          max={10000}
        />
        <PlayButton isPlaying={isPlaying} onToggle={handleToggle} />
      </main>
    </div>
  );
}