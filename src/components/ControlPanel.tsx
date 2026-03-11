import { getSpeedDescriptor, type Phase } from '../hooks/useGeniusGame';

interface ControlPanelProps {
  onRestart: () => void;
  onSpeedChange: (value: number) => void;
  onStart: () => void;
  phase: Phase;
  speed: number;
}

export default function ControlPanel({
  onRestart,
  onSpeedChange,
  onStart,
  phase,
  speed,
}: ControlPanelProps) {
  const sessionRunning = phase === 'playback' || phase === 'input';

  return (
    <section className="control-card">
      <p className="section-label">Controles</p>

      <div className="button-row">
        <button
          className="action-button action-button--primary"
          disabled={sessionRunning}
          onClick={onStart}
          type="button"
        >
          {phase === 'gameover' ? 'Nova partida' : 'Iniciar'}
        </button>

        <button className="action-button action-button--secondary" onClick={onRestart} type="button">
          Reiniciar
        </button>
      </div>

      <div className="speed-panel">
        <label className="speed-panel__label" htmlFor="speed-range">
          <span>Velocidade</span>
          <strong>{getSpeedDescriptor(speed)}</strong>
        </label>

        <input
          id="speed-range"
          max={1100}
          min={450}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          step={50}
          type="range"
          value={speed}
        />

        <div className="speed-panel__scale" aria-hidden="true">
          <span>Calmo</span>
          <span>Rapido</span>
        </div>
      </div>

      <p className="control-card__hint">
        Ajuste a velocidade para a proxima sequencia. Enter inicia e ESC limpa o tabuleiro.
      </p>
    </section>
  );
}
