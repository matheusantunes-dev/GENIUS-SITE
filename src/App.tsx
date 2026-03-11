import type { CSSProperties } from 'react';
import ControlPanel from './components/ControlPanel';
import GamePad from './components/GamePad';
import SequenceMeter from './components/SequenceMeter';
import StatCard from './components/StatCard';
import { useGeniusGame } from './hooks/useGeniusGame';
import './styles/app.css';

const phaseCopy = {
  idle: {
    label: 'Standby',
    detail: 'Pronto para iniciar uma nova rodada.',
  },
  playback: {
    label: 'Memorize',
    detail: 'Observe as luzes e guarde a ordem.',
  },
  input: {
    label: 'Execute',
    detail: 'Repita a sequencia sem hesitar.',
  },
  gameover: {
    label: 'Falha',
    detail: 'Reinicie e tente bater o recorde.',
  },
} as const;

export default function App() {
  const {
    acceptingInput,
    activePad,
    bestScore,
    handlePadPress,
    message,
    pads,
    phase,
    progress,
    restartGame,
    round,
    score,
    sequenceLength,
    setSpeed,
    speed,
    startGame,
  } = useGeniusGame();

  const phaseMeta = phaseCopy[phase];
  const sequenceCounter = sequenceLength === 0 ? '0/0' : `${progress}/${sequenceLength}`;
  const legendDotStyle = (color: string): CSSProperties => ({
    background: color,
    boxShadow: `0 0 18px ${color}`,
  });

  return (
    <div className="page-shell">
      <div className="bg-orb bg-orb--amber" />
      <div className="bg-orb bg-orb--cyan" />

      <main className="app-shell">
        <section className="hero-panel">
          <div className="hero-copy">
            <h1>Genius Reactor</h1>
            <p className="hero-copy__text">
              O clássico jogo de memória renasce com visual moderno e jogabilidade fluida. Teste seus reflexos com controles precisos, salve seus recordes mundiais e encare o desafio em qualquer tela, do PC ao celular, com performance total.
            </p>
          </div>

          <div className="hero-side">
            <div className={`phase-chip phase-chip--${phase}`}>
              <span>{phaseMeta.label}</span>
              <strong>{phaseMeta.detail}</strong>
            </div>

            <div className="keyboard-card">
              <span>Atalhos</span>
              <strong>1 2 3 4 5 6</strong>
              <p>Mouse e teclado funcionam em paralelo. Enter inicia e ESC limpa a rodada.</p>
            </div>
          </div>
        </section>

        <section className="stats-row" aria-label="placar principal">
          <StatCard label="Rodada" value={round} tone="warm" />
          <StatCard label="Pontos" value={score} tone="cool" />
          <StatCard label="Recorde" value={bestScore} tone="signal" />
          <StatCard label="Pads" value={pads.length} tone="neutral" />
        </section>

        <section className="content-grid">
          <section className="board-card" aria-label="tabuleiro do jogo">
            <div className={`board-frame ${acceptingInput ? 'board-frame--armed' : ''}`}>
              {pads.map((pad) => (
                <GamePad
                  key={pad.id}
                  pad={pad}
                  active={activePad === pad.id}
                  disabled={!acceptingInput}
                  onPress={handlePadPress}
                />
              ))}

              <div className="board-core">
                <span className="board-core__label">Sequencia</span>
                <strong>{sequenceCounter}</strong>
                <p>
                  {sequenceLength > 0
                    ? 'Entradas confirmadas nesta rodada.'
                    : 'Pressione iniciar para gerar a primeira combinacao.'}
                </p>
                <SequenceMeter current={progress} total={sequenceLength} />
              </div>
            </div>
          </section>

          <aside className="side-stack">
            <ControlPanel
              onRestart={restartGame}
              onSpeedChange={setSpeed}
              onStart={startGame}
              phase={phase}
              speed={speed}
            />

            <section className="status-card">
              <p className="section-label">Status do jogo</p>
              <p className="status-card__message">{message}</p>
              <div className="status-card__details">
                <div>
                  <span>Rodada ativa</span>
                  <strong>{round}</strong>
                </div>
                <div>
                  <span>Acertos validos</span>
                  <strong>{score}</strong>
                </div>
              </div>
            </section>

            <section className="guide-card">
              <p className="section-label">Mapa rapido</p>
              <ul className="legend-list">
                {pads.map((pad) => (
                  <li key={pad.id}>
                    <span
                      className="legend-dot"
                      style={legendDotStyle(pad.baseColor)}
                      aria-hidden="true"
                    />
                    <strong>{pad.key}</strong>
                    <span>{pad.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
