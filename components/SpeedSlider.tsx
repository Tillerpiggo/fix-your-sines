'use client';

interface SpeedSliderProps {
  value: number;
  onChange: (speed: number) => void;
  min?: number;
  max?: number;
}

export default function SpeedSlider({
  value,
  onChange,
  min = 50,
  max = 2000
}: SpeedSliderProps) {
  return (
    <div style={{ margin: '20px 0' }}>
      <label htmlFor="speed-slider">
        Speed (delay between steps): {value}ms
      </label>
      <input
        id="speed-slider"
        type="range"
        min={min}
        max={max}
        step="50"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '300px', display: 'block', marginTop: '10px' }}
      />
    </div>
  );
}