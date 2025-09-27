'use client';

import { useState, useEffect } from 'react';
import PlayButton from '../components/PlayButton';
import FrequencySlider from '../components/FrequencySlider';
import BandwidthSlider from '../components/BandwidthSlider';
import PanCountSlider from '../components/PanCountSlider';
import StaggerDelaySlider from '../components/StaggerDelaySlider';
import FrequencyCountSlider from '../components/FrequencyCountSlider';
import AudioModeSelector from '../components/AudioModeSelector';
import SoundstageExplorer from '../components/SoundstageExplorer';
import SpeedSlider from '../components/SpeedSlider';
import AttackSlider from '../components/AttackSlider';
import { AudioController, AudioMode, SoundstagePosition } from '../lib/controllers/AudioController';
import styles from './page.module.css';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [controller, setController] = useState<AudioController | null>(null);
  const [centerFrequency, setCenterFrequency] = useState(500); // Default to 500Hz center
  const [bandwidth, setBandwidth] = useState(2.0); // Default bandwidth in octaves (wider notch)
  const [panCount, setPanCount] = useState(1); // Default to mono
  const [staggerDelay, setStaggerDelay] = useState(50); // Default 50ms
  const [frequencyCount, setFrequencyCount] = useState(100); // Default 100 frequencies
  const [audioMode, setAudioMode] = useState<AudioMode>('bandpassed-noise'); // Default to noise for testing
  const [showSoundstage, setShowSoundstage] = useState(false);
  const [speed, setSpeed] = useState(200); // Default 200ms between steps
  const [attackTime, setAttackTime] = useState(50); // Default 50ms attack

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
  
  const handleAudioModeChange = (mode: AudioMode) => {
    setAudioMode(mode);
    if (controller) {
      controller.setAudioMode(mode);
    }
  };

  const handleSoundstagePositionsChange = (positions: { panIndex: number; frequency: number }[]) => {
    if (controller && positions.length > 0) {
      const soundstagePositions: SoundstagePosition[] = positions.map(pos => ({
        panIndex: pos.panIndex,
        frequency: pos.frequency
      }));
      controller.setCustomPositions(soundstagePositions);
    } else if (controller) {
      controller.clearCustomPositions();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (controller) {
      controller.updateSpeed(newSpeed);
    }
  };

  const handleAttackChange = (newAttack: number) => {
    setAttackTime(newAttack);
    if (controller) {
      controller.updateBurstParams({ attackTime: newAttack });
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Audio Burst Player</h1>
        <p>Playing -4.5dB/oct pattern (40Hz-14kHz) with masked band rotating across stereo field</p>
        <AudioModeSelector
          value={audioMode}
          onChange={handleAudioModeChange}
        />
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
          max={4.0}
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
        <SpeedSlider
          value={speed}
          onChange={handleSpeedChange}
          min={50}
          max={2000}
        />
        <AttackSlider
          value={attackTime}
          onChange={handleAttackChange}
          min={2}
          max={200}
        />
        <PlayButton isPlaying={isPlaying} onToggle={handleToggle} />
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => setShowSoundstage(!showSoundstage)}
            style={{
              padding: '10px 20px',
              background: showSoundstage ? '#4CAF50' : '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {showSoundstage ? 'Hide' : 'Show'} Soundstage Explorer
          </button>
        </div>

        {showSoundstage && (
          <SoundstageExplorer
            panCount={panCount}
            minFreq={20}
            maxFreq={20000}
            onPositionsChange={handleSoundstagePositionsChange}
          />
        )}
      </main>
    </div>
  );
}