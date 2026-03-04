const colors = ['green', 'red', 'yellow', 'blue', 'orange', 'purple'];
const colorFrequency = {
    green: 329.63,
    red: 392.0,
    yellow: 523.25,
    blue: 440.0,
    orange: 587.33,
    purple: 659.25,
};

const gameState = {
    sequence: [],
    playerSequence: [],
    score: 0,
    round: 0,
    bestScore: Number(localStorage.getItem('geniusBestScore') || 0),
    started: false,
    acceptingInput: false,
};

const roundValue = document.getElementById('round-value');
const scoreValue = document.getElementById('score-value');
const bestScoreValue = document.getElementById('best-score-value');
const message = document.getElementById('message');
const speedRange = document.getElementById('speed-range');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const buttonElements = [...document.querySelectorAll('.game-button')];

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
buttonElements.forEach((button) => {
    button.addEventListener('click', () => handlePlayerInput(button.dataset.color));
});

drawScoreboard();
setButtonsDisabled(true);

function startGame() {
    if (gameState.started) {
        return;
    }

    resetGameState();
    gameState.started = true;
    message.innerHTML = 'Observe a sequência...';
    nextRound();
}

function restartGame() {
    resetGameState();
    gameState.started = false;
    message.innerHTML = 'Jogo reiniciado. Clique em <strong>Iniciar</strong>.';
    setButtonsDisabled(true);
}

function resetGameState() {
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.score = 0;
    gameState.round = 0;
    gameState.acceptingInput = false;
    drawScoreboard();
}

function nextRound() {
    gameState.round += 1;
    gameState.playerSequence = [];
    gameState.sequence.push(getRandomColor());
    drawScoreboard();

    message.textContent = `Rodada ${gameState.round}: memorize a sequência.`;
    playSequence();
}

function getRandomColor() {
    const index = Math.floor(Math.random() * colors.length);
    return colors[index];
}

function playSequence() {
    gameState.acceptingInput = false;
    setButtonsDisabled(true);

    const speed = Number(speedRange.value);
    gameState.sequence.forEach((color, index) => {
        const startAt = speed * index;

        setTimeout(() => {
            activateButton(color, Math.max(250, speed * 0.65));
            playTone(color, Math.max(120, speed * 0.6));
        }, startAt);
    });

    const totalDuration = speed * gameState.sequence.length + 120;
    setTimeout(() => {
        gameState.acceptingInput = true;
        setButtonsDisabled(false);
        message.textContent = 'Sua vez! Repita a sequência.';
    }, totalDuration);
}

function handlePlayerInput(color) {
    if (!gameState.started || !gameState.acceptingInput) {
        return;
    }

    gameState.playerSequence.push(color);
    activateButton(color, 220);
    playTone(color, 180);

    const currentIndex = gameState.playerSequence.length - 1;
    if (gameState.playerSequence[currentIndex] !== gameState.sequence[currentIndex]) {
        onGameOver();
        return;
    }

    const completedRound = gameState.playerSequence.length === gameState.sequence.length;
    if (completedRound) {
        gameState.score += 1;
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
            localStorage.setItem('geniusBestScore', String(gameState.bestScore));
        }

        drawScoreboard();
        gameState.acceptingInput = false;
        setButtonsDisabled(true);
        message.textContent = 'Boa! Preparando próxima rodada...';
        setTimeout(nextRound, 850);
    }
}

function onGameOver() {
    gameState.started = false;
    gameState.acceptingInput = false;
    setButtonsDisabled(true);

    flashBoard();
    message.innerHTML = `Fim de jogo! Você chegou na rodada <strong>${gameState.round}</strong> com <strong>${gameState.score}</strong> ponto(s).`;
}

function flashBoard() {
    colors.forEach((color, index) => {
        setTimeout(() => activateButton(color, 180), index * 110);
    });
}

function activateButton(color, durationMs) {
    const button = document.getElementById(color);
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), durationMs);
}

function setButtonsDisabled(value) {
    buttonElements.forEach((button) => {
        button.disabled = value;
    });
}

function drawScoreboard() {
    roundValue.textContent = gameState.round;
    scoreValue.textContent = gameState.score;
    bestScoreValue.textContent = gameState.bestScore;
}

function playTone(color, durationMs) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
        return;
    }

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = colorFrequency[color] || 440;

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationMs / 1000 + 0.03);
    oscillator.onended = () => audioContext.close();
}
