'use client';

import { useState, useRef, useEffect, useCallback, MouseEvent } from 'react';
import styles from './SoundstageExplorer.module.css';

interface Position {
  id: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  panIndex: number; // Which horizontal slot this belongs to
  frequency: number; // Calculated from y position
}

interface SoundstageExplorerProps {
  panCount: number;
  minFreq?: number;
  maxFreq?: number;
  onPositionsChange: (positions: Position[]) => void;
}

export default function SoundstageExplorer({ 
  panCount, 
  minFreq = 100, 
  maxFreq = 10000,
  onPositionsChange 
}: SoundstageExplorerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Calculate frequency from y position (0=top=high freq, 1=bottom=low freq)
  const calculateFrequency = useCallback((y: number): number => {
    // Logarithmic scaling for frequency
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    // Invert y so top is high frequency
    const logFreq = logMin + (1 - y) * (logMax - logMin);
    return Math.exp(logFreq);
  }, [minFreq, maxFreq]);

  // Clear positions when pan count changes
  useEffect(() => {
    // Start with empty positions - let user place them
    setPositions([]);
  }, [panCount]);


  // Notify parent of position changes
  useEffect(() => {
    onPositionsChange(positions);
  }, [positions, onPositionsChange]);

  // Get pan index from x position
  const getPanIndex = (x: number): number => {
    return Math.floor(x * panCount);
  };

  // Get x position for a pan index (centered in slot)
  const getXForPanIndex = (index: number): number => {
    return (index + 0.5) / panCount;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, positionId: string) => {
    e.preventDefault();
    setDraggingId(positionId);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp values
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    // Determine pan index and snap x to center of that slot
    const panIndex = getPanIndex(clampedX);
    const snappedX = getXForPanIndex(panIndex);

    setPositions(prev => prev.map(pos => 
      pos.id === draggingId 
        ? { 
            ...pos, 
            x: snappedX, 
            y: clampedY, 
            panIndex,
            frequency: calculateFrequency(clampedY)
          }
        : pos
    ));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || draggingId) return;
    
    // Only add new dot if Shift key is held
    if (!e.shiftKey) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Determine pan index and snap x to center of that slot
    const panIndex = getPanIndex(x);
    const snappedX = getXForPanIndex(panIndex);

    // Allow multiple positions per slot - just add the new one
    const newPosition: Position = {
      id: `pos-${Date.now()}-${Math.random()}`,
      x: snappedX,
      y,
      panIndex,
      frequency: calculateFrequency(y)
    };
    setPositions(prev => [...prev, newPosition]);
  };

  const handleRemovePosition = (positionId: string) => {
    setPositions(prev => prev.filter(p => p.id !== positionId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Soundstage Explorer</h3>
        <p className={styles.instructions}>
          Shift+click to add positions • Drag vertically to adjust frequency • Right-click to remove
        </p>
      </div>
      
      <div 
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Grid lines for pan positions */}
        {Array.from({ length: panCount + 1 }).map((_, i) => (
          <div
            key={`gridline-${i}`}
            className={styles.gridLine}
            style={{
              left: `${(i / panCount) * 100}%`,
              height: '100%'
            }}
          />
        ))}

        {/* Frequency labels */}
        <div className={styles.freqLabel} style={{ top: '0%' }}>
          {maxFreq}Hz
        </div>
        <div className={styles.freqLabel} style={{ top: '50%' }}>
          {Math.round(Math.sqrt(minFreq * maxFreq))}Hz
        </div>
        <div className={styles.freqLabel} style={{ bottom: '0%' }}>
          {minFreq}Hz
        </div>

        {/* Position markers */}
        {positions.map(pos => (
          <div
            key={pos.id}
            className={`${styles.marker} ${draggingId === pos.id ? styles.dragging : ''}`}
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, pos.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleRemovePosition(pos.id);
            }}
          >
            <div className={styles.markerInfo}>
              {Math.round(pos.frequency)}Hz
            </div>
          </div>
        ))}

        {/* Pan position labels */}
        <div className={styles.panLabels}>
          {Array.from({ length: panCount }).map((_, i) => (
            <div
              key={`pan-${i}`}
              className={styles.panLabel}
              style={{
                left: `${getXForPanIndex(i) * 100}%`
              }}
            >
              {i === 0 ? 'L' : i === panCount - 1 ? 'R' : i === Math.floor(panCount / 2) ? 'C' : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}