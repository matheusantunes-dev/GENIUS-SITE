import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

const STORAGE_KEY = 'geniusBestScore';
const DEFAULT_SPEED = 720;
const INITIAL_MESSAGE = 'Clique em Iniciar para ouvir a primeira sequencia.';

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export type Phase = 'gameover' | 'idle' | 'input' | 'playback';
export type PadId = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';

export interface PadDefinition {
  baseColor: string;
  frequency: number;
  glowColor: string;
  gridArea: string;
  id: PadId;
  key: string;
  label: string;
  shadowColor: string;
}

export const COLOR_PADS: PadDefinition[] = [
  {
    id: 'green',
    label: 'Verde',
    key: '1',
    frequency: 329.63,
    baseColor: '#43b04a',
    glowColor: 'rgba(67, 176, 74, 0.72)',
    shadowColor: 'rgba(22, 109, 39, 0.46)',
    gridArea: 'green',
  },
  {
    id: 'red',
    label: 'Vermelho',
    key: '2',
    frequency: 392,
    baseColor: '#ff5d4d',
    glowColor: 'rgba(255, 93, 77, 0.72)',
    shadowColor: 'rgba(145, 34, 24, 0.44)',
    gridArea: 'red',
  },
  {
    id: 'yellow',
    label: 'Amarelo',
    key: '3',
    frequency: 523.25,
    baseColor: '#f4c542',
    glowColor: 'rgba(244, 197, 66, 0.72)',
    shadowColor: 'rgba(140, 101, 17, 0.4)',
    gridArea: 'yellow',
  },
  {
    id: 'blue',
    label: 'Azul',
    key: '4',
    frequency: 440,
    baseColor: '#2b8cff',
    glowColor: 'rgba(43, 140, 255, 0.72)',
    shadowColor: 'rgba(15, 69, 141, 0.42)',
    gridArea: 'blue',
  },
  {
    id: 'orange',
    label: 'Laranja',
    key: '5',
    frequency: 587.33,
    baseColor: '#ff9b42',
    glowColor: 'rgba(255, 155, 66, 0.76)',
    shadowColor: 'rgba(145, 78, 17, 0.42)',
    gridArea: 'orange',
  },
  {
    id: 'purple',
    label: 'Roxo',
    key: '6',
    frequency: 659.25,
    baseColor: '#8d59ff',
    glowColor: 'rgba(141, 89, 255, 0.74)',
    shadowColor: 'rgba(73, 33, 148, 0.44)',
    gridArea: 'purple',
  },
];

const SOUND_SOURCES: Partial<Record<PadId, string>> = {
  blue: '/sounds/blue.mp3',
  green: '/sounds/green.mp3',
  orange: '/sounds/orange.wav',
  purple: '/sounds/purple.wav',
  red: '/sounds/red.mp3',
  yellow: '/sounds/yellow.mp3',
};

interface GameState {
  activePad: PadId | null;
  bestScore: number;
  message: string;
  phase: Phase;
  playerSequence: PadId[];
  round: number;
  score: number;
  sequence: PadId[];
  speed: number;
}

const getRandomPadId = (): PadId => {
  const index = Math.floor(Math.random() * COLOR_PADS.length);
  return COLOR_PADS[index].id;
};

const getStoredBestScore = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const createInitialState = (): GameState => ({
  activePad: null,
  bestScore: getStoredBestScore(),
  message: INITIAL_MESSAGE,
  phase: 'idle',
  playerSequence: [],
  round: 0,
  score: 0,
  sequence: [],
  speed: DEFAULT_SPEED,
});

export const getSpeedDescriptor = (speed: number) => {
  if (speed <= 550) {
    return 'Turbo';
  }

  if (speed <= 750) {
    return 'Agil';
  }

  if (speed <= 950) {
    return 'Constante';
  }

  return 'Calmo';
};

export function useGeniusGame() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const stateRef = useRef(state);
  const timeoutsRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<Partial<Record<PadId, HTMLAudioElement>>>({});
  const pulseTokenRef = useRef(0);

  const updateState = useCallback((updater: SetStateAction<GameState>) => {
    setState((previousState) => {
      const nextState =
        typeof updater === 'function'
          ? (updater as (current: GameState) => GameState)(previousState)
          : updater;

      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const scheduleTask = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((registeredId) => registeredId !== timeoutId);
      callback();
    }, delayMs);

    timeoutsRef.current.push(timeoutId);
  }, []);

  const clearScheduledTasks = useCallback(
    (resetVisual = true) => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
      pulseTokenRef.current += 1;

      if (resetVisual) {
        updateState((current) => (current.activePad === null ? current : { ...current, activePad: null }));
      }
    },
    [updateState],
  );

  const persistBestScore = useCallback((value: number) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const playFallbackTone = useCallback((padId: PadId, durationMs: number) => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;

    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const pad = COLOR_PADS.find((entry) => entry.id === padId);

    oscillator.type = 'triangle';
    oscillator.frequency.value = pad?.frequency ?? 440;

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.17, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000 + 0.04);
  }, []);

  const playPadSound = useCallback(
    (padId: PadId, durationMs: number) => {
      const soundSource = SOUND_SOURCES[padId];
      if (!soundSource) {
        playFallbackTone(padId, durationMs);
        return;
      }

      const preparedAudio =
        audioElementsRef.current[padId] ??
        (() => {
          const nextAudio = new Audio(soundSource);
          nextAudio.preload = 'auto';
          audioElementsRef.current[padId] = nextAudio;
          return nextAudio;
        })();

      const nextPlayback = preparedAudio.cloneNode(true) as HTMLAudioElement;
      nextPlayback.currentTime = 0;
      nextPlayback.volume = 0.72;

      void nextPlayback.play().catch(() => {
        playFallbackTone(padId, durationMs);
      });
    },
    [playFallbackTone],
  );

  const pulsePad = useCallback(
    (padId: PadId, durationMs: number, shouldPlayTone = true) => {
      pulseTokenRef.current += 1;
      const pulseToken = pulseTokenRef.current;

      updateState((current) => ({ ...current, activePad: padId }));

      if (shouldPlayTone) {
        playPadSound(padId, Math.max(140, durationMs - 20));
      }

      scheduleTask(() => {
        if (pulseTokenRef.current !== pulseToken) {
          return;
        }

        updateState((current) =>
          current.activePad === padId ? { ...current, activePad: null } : current,
        );
      }, durationMs);
    },
    [playPadSound, scheduleTask, updateState],
  );

  const playSequence = useCallback(
    (nextSequence: PadId[]) => {
      const currentSpeed = stateRef.current.speed;

      updateState((current) => ({
        ...current,
        activePad: null,
        message: `Rodada ${nextSequence.length}: memorize a sequencia.`,
        phase: 'playback',
        playerSequence: [],
      }));

      nextSequence.forEach((padId, index) => {
        scheduleTask(() => {
          pulsePad(padId, Math.max(280, currentSpeed * 0.62));
        }, currentSpeed * index);
      });

      scheduleTask(() => {
        updateState((current) => ({
          ...current,
          message: 'Sua vez. Repita a ordem usando clique ou teclado.',
          phase: 'input',
        }));
      }, currentSpeed * nextSequence.length + 180);
    },
    [pulsePad, scheduleTask, updateState],
  );

  const advanceRound = useCallback(() => {
    clearScheduledTasks();

    const nextSequence = [...stateRef.current.sequence, getRandomPadId()];

    updateState((current) => ({
      ...current,
      message: `Rodada ${nextSequence.length}: memorize a sequencia.`,
      phase: 'playback',
      playerSequence: [],
      round: nextSequence.length,
      sequence: nextSequence,
    }));

    scheduleTask(() => {
      playSequence(nextSequence);
    }, 240);
  }, [clearScheduledTasks, playSequence, scheduleTask, updateState]);

  const runLossAnimation = useCallback(() => {
    COLOR_PADS.forEach((pad, index) => {
      scheduleTask(() => {
        pulsePad(pad.id, 180);
      }, index * 110);
    });
  }, [pulsePad, scheduleTask]);

  const finishGame = useCallback(() => {
    const snapshot = stateRef.current;
    const nextBestScore = Math.max(snapshot.bestScore, snapshot.score);

    clearScheduledTasks();

    if (nextBestScore > snapshot.bestScore) {
      persistBestScore(nextBestScore);
    }

    updateState((current) => ({
      ...current,
      activePad: null,
      bestScore: nextBestScore,
      message: `Fim de jogo. Voce chegou na rodada ${current.round} com ${current.score} ponto(s).`,
      phase: 'gameover',
    }));

    runLossAnimation();
  }, [clearScheduledTasks, persistBestScore, runLossAnimation, updateState]);

  const startGame = useCallback(() => {
    if (stateRef.current.phase === 'playback' || stateRef.current.phase === 'input') {
      return;
    }

    clearScheduledTasks();

    updateState((current) => ({
      ...current,
      activePad: null,
      message: 'Preparando a primeira sequencia.',
      phase: 'playback',
      playerSequence: [],
      round: 0,
      score: 0,
      sequence: [],
    }));

    scheduleTask(() => {
      advanceRound();
    }, 240);
  }, [advanceRound, clearScheduledTasks, scheduleTask, updateState]);

  const restartGame = useCallback(() => {
    clearScheduledTasks();

    updateState((current) => ({
      ...current,
      activePad: null,
      message: INITIAL_MESSAGE,
      phase: 'idle',
      playerSequence: [],
      round: 0,
      score: 0,
      sequence: [],
    }));
  }, [clearScheduledTasks, updateState]);

  const handlePadPress = useCallback(
    (padId: PadId) => {
      const snapshot = stateRef.current;
      if (snapshot.phase !== 'input') {
        return;
      }

      const nextPlayerSequence = [...snapshot.playerSequence, padId];
      updateState((current) => ({ ...current, playerSequence: nextPlayerSequence }));
      pulsePad(padId, 220);

      const expectedPad = snapshot.sequence[nextPlayerSequence.length - 1];
      if (padId !== expectedPad) {
        scheduleTask(() => {
          finishGame();
        }, 220);
        return;
      }

      if (nextPlayerSequence.length !== snapshot.sequence.length) {
        return;
      }

      const nextScore = snapshot.score + 1;
      const nextBestScore = Math.max(snapshot.bestScore, nextScore);

      if (nextBestScore > snapshot.bestScore) {
        persistBestScore(nextBestScore);
      }

      updateState((current) => ({
        ...current,
        bestScore: nextBestScore,
        message: 'Sequencia completa. Preparando a proxima rodada.',
        phase: 'playback',
        score: nextScore,
      }));

      scheduleTask(() => {
        advanceRound();
      }, 900);
    },
    [advanceRound, finishGame, persistBestScore, pulsePad, scheduleTask, updateState],
  );

  const setSpeed = useCallback(
    (value: number) => {
      updateState((current) => ({ ...current, speed: value }));
    },
    [updateState],
  );

  useEffect(() => {
    Object.entries(SOUND_SOURCES).forEach(([padId, source]) => {
      const audio = new Audio(source);
      audio.preload = 'auto';
      audioElementsRef.current[padId as PadId] = audio;
    });

    return () => {
      audioElementsRef.current = {};
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && stateRef.current.phase !== 'playback' && stateRef.current.phase !== 'input') {
        event.preventDefault();
        startGame();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        restartGame();
        return;
      }

      const matchedPad = COLOR_PADS.find((pad) => pad.key === event.key);
      if (!matchedPad) {
        return;
      }

      event.preventDefault();
      handlePadPress(matchedPad.id);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePadPress, restartGame, startGame]);

  useEffect(() => {
    return () => {
      clearScheduledTasks(false);
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, [clearScheduledTasks]);

  return {
    acceptingInput: state.phase === 'input',
    activePad: state.activePad,
    bestScore: state.bestScore,
    handlePadPress,
    message: state.message,
    pads: COLOR_PADS,
    phase: state.phase,
    progress: state.playerSequence.length,
    restartGame,
    round: state.round,
    score: state.score,
    sequenceLength: state.sequence.length,
    setSpeed,
    speed: state.speed,
    startGame,
  };
}
