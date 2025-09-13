'use client';

import { useState, useEffect } from 'react';
import PlayButton from '../components/PlayButton';
import FrequencySlider from '../components/FrequencySlider';
import BandwidthSlider from '../components/BandwidthSlider';
import PanCountSlider from '../components/PanCountSlider';
import StaggerDelaySlider from '../components/StaggerDelaySlider';
import FrequencyCountSlider from '../components/FrequencyCountSlider';
import { AudioController } from '../lib/controllers/AudioController';
import styles from './page.module.css';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [controller, setController] = useState<AudioController | null>(null);
  const [centerFrequency, setCenterFrequency] = useState(2500); // Default to 2.5kHz center
  const [bandwidth, setBandwidth] = useState(0.58); // Default bandwidth in octaves
  const [panCount, setPanCount] = useState(1); // Default to mono
  const [staggerDelay, setStaggerDelay] = useState(50); // Default 50ms
  const [frequencyCount, setFrequencyCount] = useState(100); // Default 100 frequencies

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

  const handleBandwidthChange = (bw: number) => {
    setBandwidth(bw);
    if (controller) {
      controller.updateMaskBandwidth(bw);
    }
  };
  
  const handlePanCountChange = (count: number) => {
    setPanCount(count);
    if (controller) {
      controller.updatePanCount(count);
    }
  };
  
  const handleStaggerDelayChange = (delay: number) => {
    setStaggerDelay(delay);
    if (controller) {
      controller.updateStaggerDelay(delay);
    }
  };
  
  const handleFrequencyCountChange = (count: number) => {
    setFrequencyCount(count);
    if (controller) {
      controller.updateFrequencyCount(count);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sine Tone Burst Player</h1>
        <p>Playing -4.5dB/oct pattern (40Hz-14kHz) with masked band rotating across stereo field</p>
        <FrequencySlider 
          value={centerFrequency} 
          onChange={handleFrequencyChange}
          min={100}
          max={10000}
        />
        <BandwidthSlider
          value={bandwidth}
          onChange={handleBandwidthChange}
          min={0.1}
          max={2.0}
        />
        <PanCountSlider
          value={panCount}
          onChange={handlePanCountChange}
          min={1}
          max={5}
        />
        <StaggerDelaySlider
          value={staggerDelay}
          onChange={handleStaggerDelayChange}
          min={0}
          max={200}
        />
        <FrequencyCountSlider
          value={frequencyCount}
          onChange={handleFrequencyCountChange}
          min={10}
          max={500}
        />
        <PlayButton isPlaying={isPlaying} onToggle={handleToggle} />
      </main>
    </div>
  );
}