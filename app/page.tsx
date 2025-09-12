'use client';

import { useState, useEffect } from 'react';
import PlayButton from '../components/PlayButton';
import { AudioController } from '../lib/controllers/AudioController';
import styles from './page.module.css';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [controller, setController] = useState<AudioController | null>(null);

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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sine Tone Burst Player</h1>
        <p>Playing -4.5dB/oct pattern with 2-3kHz alternating</p>
        <PlayButton isPlaying={isPlaying} onToggle={handleToggle} />
      </main>
    </div>
  );
}