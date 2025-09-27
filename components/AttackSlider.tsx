'use client';

interface AttackSliderProps {
  value: number;
  onChange: (attack: number) => void;
  min?: number;
  max?: number;
}

export default function AttackSlider({
  value,
  onChange,
  min = 2,
  max = 200
}: AttackSliderProps) {
  return (
    <div style={{ margin: '20px 0' }}>
      <label htmlFor="attack-slider">
        Attack Time: {value}ms
      </label>
      <input
        id="attack-slider"
        type="range"
        min={min}
        max={max}
        step="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '300px', display: 'block', marginTop: '10px' }}
      />
    </div>
  );
}