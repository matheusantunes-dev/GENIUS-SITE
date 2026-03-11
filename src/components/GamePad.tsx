import type { CSSProperties } from 'react';
import type { PadDefinition, PadId } from '../hooks/useGeniusGame';

interface GamePadProps {
  active: boolean;
  disabled: boolean;
  onPress: (padId: PadId) => void;
  pad: PadDefinition;
}

export default function GamePad({ active, disabled, onPress, pad }: GamePadProps) {
  const style = {
    '--pad-base': pad.baseColor,
    '--pad-glow': pad.glowColor,
    '--pad-shadow': pad.shadowColor,
    gridArea: pad.gridArea,
  } as CSSProperties;

  return (
    <button
      aria-label={`${pad.label} - tecla ${pad.key}`}
      aria-pressed={active}
      className={`game-pad ${active ? 'is-active' : ''}`}
      disabled={disabled}
      onClick={() => onPress(pad.id)}
      style={style}
      type="button"
    >
      <span className="game-pad__key">{pad.key}</span>
      <span className="game-pad__label">{pad.label}</span>
    </button>
  );
}
