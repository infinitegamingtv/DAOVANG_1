// ==========================================================================
// GOLD MINER QUIZ - CLIENT SIDE CONTROLLER & SOUND SYNTHESIZER
// ==========================================================================

const socket = io();

// UI Elements Cache
const screens = {
  landing: document.getElementById('screen-landing'),
  hostLobby: document.getElementById('screen-host-lobby'),
  playerLobby: document.getElementById('screen-player-lobby'),
  hostGame: document.getElementById('screen-host-game'),
  playerGame: document.getElementById('screen-player-game'),
  playerWaitReveal: document.getElementById('screen-player-wait-reveal'),
  hostReveal: document.getElementById('screen-host-reveal'),
  playerReveal: document.getElementById('screen-player-reveal'),
  hostLeaderboard: document.getElementById('screen-host-leaderboard'),
  playerLeaderboard: document.getElementById('screen-player-leaderboard'),
  hostGameOver: document.getElementById('screen-host-gameover'),
  playerGameOver: document.getElementById('screen-player-gameover')
};

// Form & Interactive Controls
const formJoin = document.getElementById('form-join');
const formHost = document.getElementById('form-host');
const btnTabJoin = document.getElementById('btn-tab-join');
const btnTabHost = document.getElementById('btn-tab-host');
const inputCode = document.getElementById('input-code');
const inputNickname = document.getElementById('input-nickname');
const btnJoin = document.getElementById('btn-join');
const joinErrorMsg = document.getElementById('join-error-msg');
const btnCreateRoom = document.getElementById('btn-create-room');

// Host-specific fields
const hostPin = document.getElementById('host-pin');
const lobbyPlayersList = document.getElementById('lobby-players-list');
const btnStartGame = document.getElementById('btn-start-game');
const hostQuestionIndex = document.getElementById('host-question-index');
const hostTimerText = document.getElementById('host-timer-text');
const timerBar = document.getElementById('timer-bar');
const btnSkipQuestion = document.getElementById('btn-skip-question');
const hostQuestionText = document.getElementById('host-question-text');
const hostOpts = [
  document.getElementById('host-opt-0-text'),
  document.getElementById('host-opt-1-text'),
  document.getElementById('host-opt-2-text'),
  document.getElementById('host-opt-3-text')
];
const hostAnswersCount = document.getElementById('host-answers-count');
const hostRevealCorrectText = document.getElementById('host-reveal-correct-text');
const hostMiningLogs = document.getElementById('host-mining-logs');
const btnRevealNext = document.getElementById('btn-reveal-next');
const btnLeaderboardNext = document.getElementById('btn-leaderboard-next');
const hostLeaderboardList = document.getElementById('host-leaderboard-list');
const btnRestartGame = document.getElementById('btn-restart-game');

// Player-specific fields
const playerMyNickname = document.getElementById('player-my-nickname');
const playerHudName = document.getElementById('player-hud-name');
const playerHudScore = document.getElementById('player-hud-score');
const playerTimerBar = document.getElementById('player-timer-bar');
const playerQuestionPreview = document.getElementById('player-question-preview');
const playerOptBtns = document.querySelectorAll('.player-opt-btn');
const playerRevealCorrect = document.getElementById('player-reveal-correct');
const playerRevealIncorrect = document.getElementById('player-reveal-incorrect');
const playerRevealCorrectAns = document.getElementById('player-reveal-correct-ans');
const playerBasePoints = document.getElementById('player-base-points');
const miningNodes = document.querySelectorAll('.mining-node');
const miningRewardOverlay = document.getElementById('mining-reward-overlay');
const rewardVisual = document.getElementById('reward-visual');
const rewardTitle = document.getElementById('reward-title');
const rewardText = document.getElementById('reward-text');
const btnCloseReward = document.getElementById('btn-close-reward');
const playerMyRank = document.getElementById('player-my-rank');
const playerTotalGold = document.getElementById('player-total-gold');
const playerFinalRank = document.getElementById('player-final-rank');
const playerFinalGold = document.getElementById('player-final-gold');
const btnPlayerExit = document.getElementById('btn-player-exit');
const btnClosePlayAgain = document.getElementById('btn-player-exit');

// Game state variables
let myRoomCode = '';
let myNickname = '';
let myScore = 0;
let isHost = false;
let currentQuestionIndex = 0;
let countdownInterval = null;

// ==========================================================================
// WEB AUDIO API SYNTHESIZER (PROCEDURAL SOUND EFFECTS)
// ==========================================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function createOscillator(type, freq, duration, gainStart, gainEnd = 0.001) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(gainStart, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(gainEnd, audioCtx.currentTime + duration);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
  
  return { osc, gainNode };
}

const sfx = {
  join: () => {
    createOscillator('sine', 587.33, 0.1, 0.1); // D5
    setTimeout(() => createOscillator('sine', 880, 0.15, 0.1), 80); // A5
  },
  
  correct: () => {
    // Upward happy triad
    createOscillator('triangle', 523.25, 0.15, 0.15); // C5
    setTimeout(() => createOscillator('triangle', 659.25, 0.15, 0.15), 100); // E5
    setTimeout(() => createOscillator('triangle', 783.99, 0.15, 0.15), 200); // G5
    setTimeout(() => createOscillator('triangle', 1046.50, 0.4, 0.2), 300); // C6
  },
  
  incorrect: () => {
    // Sad buzz descending
    const { osc } = createOscillator('sawtooth', 220, 0.5, 0.2);
    osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.5);
  },
  
  pickHit: () => {
    // Metal impact: white noise + high frequency metallic chime
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Noise buffer
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    // Metallic chime
    const { osc } = createOscillator('sine', 1200, 0.2, 0.15);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);

    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start();
  },
  
  explosion: () => {
    // Dynamite sound: noise + low pitch oscillator sweeping down
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const bufferSize = audioCtx.sampleRate * 0.6;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    
    const boom = audioCtx.createOscillator();
    const boomGain = audioCtx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(120, audioCtx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4);
    
    boomGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    boom.connect(boomGain);
    boomGain.connect(audioCtx.destination);
    
    noise.start();
    boom.start();
    boom.stop(audioCtx.currentTime + 0.45);
  },
  
  diamond: () => {
    // Super magical sparkling high pitch chords
    const notes = [987.77, 1174.66, 1318.51, 1567.98, 1975.53]; // B5, D6, E6, G6, B6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        createOscillator('sine', freq, 0.6, 0.15);
      }, i * 70);
    });
  },
  
  tick: () => {
    createOscillator('triangle', 880, 0.05, 0.08); // High click
  },
  
  victory: () => {
    // Royal arcade fanfare
    const melody = [
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 400 }, // C5 (held)
      { f: 659.25, d: 200 }, // E5
      { f: 587.33, d: 200 }, // D5
      { f: 659.25, d: 200 }, // E5
      { f: 783.99, d: 200 }, // G5
      { f: 1046.50, d: 600 } // C6
    ];
    melody.forEach((note, index) => {
      setTimeout(() => {
        createOscillator('triangle', note.f, note.d / 1000, 0.15);
      }, index * 200);
    });
  }
};

// ==========================================================================
// STATE MANAGEMENT & SCREEN ROUTING
// ==========================================================================

function showScreen(screenKey) {
  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.remove('active');
    }
  });
  if (screens[screenKey]) {
    screens[screenKey].classList.add('active');
  }
}

// Tab Controls on Landing Screen
btnTabJoin.addEventListener('click', () => {
  btnTabJoin.classList.add('active');
  btnTabHost.classList.remove('active');
  formJoin.classList.add('active');
  formHost.classList.remove('active');
  sfx.join();
});

btnTabHost.addEventListener('click', () => {
  btnTabHost.classList.add('active');
  btnTabJoin.classList.remove('active');
  formHost.classList.add('active');
  formJoin.classList.remove('active');
  sfx.join();
});

// ==========================================================================
// HOST PATHWAY EVENTS
// ==========================================================================

btnCreateRoom.addEventListener('click', () => {
  isHost = true;
  socket.emit('create-room');
});

socket.on('room-created', (code) => {
  myRoomCode = code;
  hostPin.innerText = code;
  btnStartGame.innerText = `BẮT ĐẦU CHƠI (0)`;
  showScreen('hostLobby');
  sfx.victory();
});

socket.on('lobby-update', (nicknames) => {
  if (!isHost) return;
  
  lobbyPlayersList.innerHTML = '';
  nicknames.forEach(nick => {
    const bubble = document.createElement('div');
    bubble.className = 'player-bubble';
    bubble.innerText = nick;
    lobbyPlayersList.appendChild(bubble);
  });
  
  btnStartGame.innerText = `BẮT ĐẦU CHƠI (${nicknames.length})`;
  sfx.join();
});

btnStartGame.addEventListener('click', () => {
  if (myRoomCode) {
    socket.emit('start-game', myRoomCode);
  }
});

// Host control for ending a question early
btnSkipQuestion.addEventListener('click', () => {
  socket.emit('next-step', myRoomCode);
});

btnRevealNext.addEventListener('click', () => {
  socket.emit('next-step', myRoomCode);
});

btnLeaderboardNext.addEventListener('click', () => {
  socket.emit('next-step', myRoomCode);
});

btnRestartGame.addEventListener('click', () => {
  window.location.reload();
});

// ==========================================================================
// PLAYER PATHWAY EVENTS
// ==========================================================================

btnJoin.addEventListener('click', () => {
  const code = inputCode.value.trim();
  const nickname = inputNickname.value.trim();
  
  if (!code || !nickname) {
    joinErrorMsg.innerText = 'Vui lòng nhập đầy đủ mã phòng và biệt danh!';
    return;
  }
  
  joinErrorMsg.innerText = '';
  myNickname = nickname;
  myRoomCode = code;
  isHost = false;
  
  socket.emit('join-room', { code, nickname });
});

socket.on('join-success', ({ code, nickname }) => {
  playerMyNickname.innerText = nickname;
  playerHudName.innerText = nickname;
  playerHudScore.innerText = '0';
  showScreen('playerLobby');
  sfx.victory();
});

socket.on('join-error', (err) => {
  joinErrorMsg.innerText = err;
  sfx.incorrect();
});

// Handles player choice buttons
playerOptBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const optIndex = btn.getAttribute('data-index');
    socket.emit('submit-answer', { code: myRoomCode, answerIndex: optIndex });
    showScreen('playerWaitReveal');
    sfx.join();
  });
});

// ==========================================================================
// CLASSIC GOLD MINER CANVAS MINI-GAME
// ==========================================================================

let canvas, ctx;
let gameInterval = null;
let gameActive = false;
let gameTimer = 8;
let gameTimerInterval = null;

const miner = { x: 180, y: 30 };
const hook = {
  x: 180,
  y: 30,
  angle: 0,
  speed: 8,
  length: 20,
  state: 'SWINGING', // SWINGING, SHOOTING, RETRACTING
  swingSpeed: 0.04,
  direction: 1,
  grabbedItem: null
};

let items = [];
const ITEM_TYPES = {
  gold_small: { radius: 11, weight: 1.5, points: 100, label: 'Cục Vàng Nhỏ (+100 💰)', emoji: '🪙' },
  gold_medium: { radius: 18, weight: 2.5, points: 250, label: 'Cục Vàng Vừa (+250 💰)', emoji: '💰' },
  gold_large: { radius: 25, weight: 5.0, points: 500, label: 'Vàng Khổng Lồ (+500 💰)', emoji: '👑' },
  diamond: { radius: 10, weight: 1.0, points: 1000, label: 'Kim Cương Siêu Quý (+1000 💎)', emoji: '💎' },
  rock: { radius: 20, weight: 6.0, points: 50, label: 'Cục Đá Thường (+50 🪨)', emoji: '🪨' },
  dynamite: { radius: 14, weight: 1.2, points: -150, label: 'Mìn Nổ Bùm! (-150 💥)', emoji: '💥' }
};

function initMiningGame() {
  canvas = document.getElementById('mining-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  // Set size
  canvas.width = 360;
  canvas.height = 240;
  
  // Reset hook
  hook.x = 180;
  hook.y = 30;
  hook.angle = 0;
  hook.state = 'SWINGING';
  hook.length = 20;
  hook.grabbedItem = null;
  
  // Setup items in bottom area
  items = [];
  const spawnPoints = [
    { x: 50, y: 120, type: 'gold_medium' },
    { x: 120, y: 190, type: 'gold_large' },
    { x: 180, y: 140, type: 'rock' },
    { x: 240, y: 200, type: 'diamond' },
    { x: 300, y: 150, type: 'gold_small' },
    { x: 90, y: 150, type: 'dynamite' },
    { x: 260, y: 120, type: 'rock' },
    { x: 170, y: 200, type: 'gold_small' }
  ];
  
  spawnPoints.forEach(pt => {
    const spec = ITEM_TYPES[pt.type];
    items.push({
      x: pt.x,
      y: pt.y,
      type: pt.type,
      radius: spec.radius,
      weight: spec.weight,
      points: spec.points,
      label: spec.label,
      emoji: spec.emoji
    });
  });

  gameActive = true;
  gameTimer = 8;
  document.getElementById('canvas-time-left').innerText = `⏱️ ${gameTimer}s`;

  // Countdown timer
  clearInterval(gameTimerInterval);
  gameTimerInterval = setInterval(() => {
    gameTimer--;
    document.getElementById('canvas-time-left').innerText = `⏱️ ${gameTimer}s`;
    
    if (gameTimer <= 0) {
      endMiningGame();
    }
  }, 1000);

  // Click handler to launch hook
  canvas.removeEventListener('click', shootHook);
  canvas.addEventListener('click', shootHook);
  
  // Start animation loop
  if (gameInterval) cancelAnimationFrame(gameInterval);
  gameInterval = requestAnimationFrame(updateMiningGame);
}

function shootHook() {
  if (hook.state === 'SWINGING' && gameActive) {
    hook.state = 'SHOOTING';
    sfx.tick(); // short swing sound
  }
}

function updateMiningGame() {
  if (!gameActive) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Underground dirt
  ctx.fillStyle = '#2c1e13';
  ctx.fillRect(0, 50, canvas.width, canvas.height - 50);
  
  // Grass ground top
  ctx.fillStyle = '#8f7215';
  ctx.fillRect(0, 45, canvas.width, 5);

  // Sky area
  ctx.fillStyle = '#222230';
  ctx.fillRect(0, 0, canvas.width, 45);

  // Draw Miner emoji
  ctx.font = '22px Outfit';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🤠', 180, 20);

  // Update Hook Position
  if (hook.state === 'SWINGING') {
    hook.angle += hook.swingSpeed * hook.direction;
    if (hook.angle > 1.3) hook.direction = -1;
    if (hook.angle < -1.3) hook.direction = 1;
    
    hook.x = 180 + Math.sin(hook.angle) * hook.length;
    hook.y = 30 + Math.cos(hook.angle) * hook.length;
  } 
  else if (hook.state === 'SHOOTING') {
    hook.x += Math.sin(hook.angle) * hook.speed;
    hook.y += Math.cos(hook.angle) * hook.speed;
    
    // Check item collisions
    let collided = false;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const dist = Math.hypot(hook.x - it.x, hook.y - it.y);
      if (dist < it.radius + 6) {
        collided = true;
        hook.grabbedItem = it;
        items.splice(i, 1);
        hook.state = 'RETRACTING';
        sfx.pickHit(); // hit sound
        break;
      }
    }
    
    // Check wall hit
    if (!collided && (hook.x < 8 || hook.x > canvas.width - 8 || hook.y > canvas.height - 8)) {
      hook.state = 'RETRACTING';
    }
  } 
  else if (hook.state === 'RETRACTING') {
    let retractSpeed = hook.speed;
    if (hook.grabbedItem) {
      retractSpeed = hook.speed / hook.grabbedItem.weight;
    }
    
    const dx = 180 - hook.x;
    const dy = 30 - hook.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 12) {
      // Reached miner, claim points
      if (hook.grabbedItem) {
        socket.emit('mine-gold', { code: myRoomCode, rewardType: hook.grabbedItem.type });
      }
      hook.grabbedItem = null;
      hook.state = 'SWINGING';
      hook.length = 20;
    } else {
      hook.x += (dx / dist) * retractSpeed;
      hook.y += (dy / dist) * retractSpeed;
    }
  }

  // Draw Rope
  ctx.strokeStyle = '#d35400';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 30);
  ctx.lineTo(hook.x, hook.y);
  ctx.stroke();

  // Draw Claws
  ctx.save();
  ctx.translate(hook.x, hook.y);
  ctx.rotate(-hook.angle);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  // Draw Ground Items
  items.forEach(it => {
    ctx.font = `${it.radius * 1.5}px Outfit`;
    ctx.fillText(it.emoji, it.x, it.y);
  });

  // Draw item grabbed
  if (hook.grabbedItem) {
    ctx.font = `${hook.grabbedItem.radius * 1.5}px Outfit`;
    ctx.fillText(hook.grabbedItem.emoji, hook.x, hook.y + 8);
  }

  gameInterval = requestAnimationFrame(updateMiningGame);
}

function endMiningGame() {
  gameActive = false;
  clearInterval(gameTimerInterval);
  cancelAnimationFrame(gameInterval);
  showScreen('playerWaitReveal');
}

function showMiningToast(text, type) {
  const container = document.querySelector('.mining-game-box');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'mining-toast';
  toast.innerText = text;
  toast.style.position = 'absolute';
  toast.style.bottom = '40px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = type === 'dynamite' ? 'rgba(231, 76, 60, 0.95)' : 'rgba(46, 204, 113, 0.95)';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '30px';
  toast.style.fontWeight = '800';
  toast.style.zIndex = '100';
  toast.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
  toast.style.animation = 'toastFade 1.2s forwards';
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 1200);
}

// Socket listener when mining successfully saved on server
socket.on('mine-result', ({ rewardType, amount, label, newScore }) => {
  myScore = newScore;
  playerHudScore.innerText = newScore;
  
  if (rewardType === 'dynamite') {
    sfx.explosion();
    document.body.classList.add('node-shake');
    setTimeout(() => document.body.classList.remove('node-shake'), 400);
  } else if (rewardType === 'diamond') {
    sfx.diamond();
  } else {
    sfx.correct();
  }
  
  showMiningToast(label, rewardType);
});

btnPlayerExit.addEventListener('click', () => {
  window.location.reload();
});

// ==========================================================================
// GAME STATE SYNCHRONIZER (BOTH PATHS)
// ==========================================================================

socket.on('new-question', ({ question, options, index, total, timeLeft }) => {
  currentQuestionIndex = index;
  
  if (isHost) {
    hostQuestionIndex.innerText = index + 1;
    hostQuestionText.innerText = question;
    hostAnswersCount.innerText = '0';
    
    // Populate choices text
    for (let i = 0; i < 4; i++) {
      hostOpts[i].innerText = options[i];
    }
    
    // Reset radial timer
    hostTimerText.innerText = timeLeft;
    timerBar.style.strokeDashoffset = 0;
    
    showScreen('hostGame');
  } else {
    // Player gameplay view
    playerQuestionPreview.innerText = `Câu ${index + 1}/${total}: HÃY CHỌN HÌNH KHỚP ĐÁP ÁN!`;
    playerTimerBar.style.width = '100%';
    
    // Reset selected states
    playerOptBtns.forEach(btn => {
      btn.style.opacity = '1';
      btn.disabled = false;
    });
    
    showScreen('playerGame');
  }
});

socket.on('timer-tick', (timeLeft) => {
  if (isHost) {
    hostTimerText.innerText = timeLeft;
    // Calculate progress offset (circumference = 283)
    const ratio = (20 - timeLeft) / 20;
    timerBar.style.strokeDashoffset = ratio * 283;
    
    if (timeLeft <= 5) {
      sfx.tick();
    }
  } else {
    // Update simple horizontal bar for player
    const pct = (timeLeft / 20) * 100;
    playerTimerBar.style.width = pct + '%';
  }
});

// Response notification received by players
socket.on('answer-acknowledged', ({ isCorrect, correctIndex, basePoints }) => {
  // Save round context locally for presentation in the reveal phase
  playerRevealCorrect.dataset.points = basePoints;
});

// Triggered when time runs out or skip is clicked
socket.on('question-revealed', ({ correctIndex, correctText }) => {
  clearInterval(countdownInterval);
  
  if (isHost) {
    hostRevealCorrectText.innerText = correctText;
    hostMiningLogs.innerHTML = '<p class="status-waiting" style="text-align:left;">Đang đợi các thợ mỏ tiến hành khai thác...</p>';
    showScreen('hostReveal');
  } else {
    // Determine player outcome
    const chosenBtn = document.querySelector('.player-opt-btn:disabled'); // not selected button
    const correctNode = playerRevealCorrect.dataset.points && parseInt(playerRevealCorrect.dataset.points) > 0;
    
    if (correctNode) {
      // Setup correct and mining state
      playerBasePoints.innerText = playerRevealCorrect.dataset.points;
      
      playerRevealCorrect.classList.add('active');
      playerRevealIncorrect.classList.remove('active');
      sfx.correct();
      
      // Initialize classic Gold Miner Canvas game!
      setTimeout(initMiningGame, 100);
    } else {
      // Setup incorrect screen
      playerRevealCorrectAns.innerText = correctText;
      playerRevealCorrect.classList.remove('active');
      playerRevealIncorrect.classList.add('active');
      sfx.incorrect();
    }
    
    showScreen('playerReveal');
  }
});

// Host logs player mining yields in real time
socket.on('player-mined-notification', ({ nickname, label, rewardType }) => {
  if (!isHost) return;
  
  // Remove waiting status message
  const waitingMsg = hostMiningLogs.querySelector('.status-waiting');
  if (waitingMsg) {
    waitingMsg.remove();
  }
  
  const log = document.createElement('div');
  log.className = `log-item ${rewardType === 'dynamite' ? 'dynamite' : ''}`;
  
  const nameSpan = document.createElement('span');
  nameSpan.innerText = `🤠 ${nickname}`;
  
  const lootSpan = document.createElement('span');
  lootSpan.innerText = label;
  
  log.appendChild(nameSpan);
  log.appendChild(lootSpan);
  
  // Prepend to show most recent log at top
  hostMiningLogs.insertBefore(log, hostMiningLogs.firstChild);
  
  if (rewardType === 'dynamite') {
    sfx.explosion();
  } else {
    sfx.pickHit();
  }
});

// Scoreboard notifications
socket.on('leaderboard-update', ({ leaderboard, isFinal }) => {
  if (isHost) {
    hostLeaderboardList.innerHTML = '';
    
    // Sort ranking rows
    leaderboard.slice(0, 5).forEach((player, i) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      
      const rankSpan = document.createElement('span');
      rankSpan.className = 'row-rank';
      rankSpan.innerText = i + 1;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'row-name';
      nameSpan.innerText = `🤠 ${player.nickname}`;
      
      const statsDiv = document.createElement('div');
      statsDiv.className = 'row-stats';
      
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'row-score';
      scoreSpan.innerText = `${player.score} 💰`;
      
      statsDiv.appendChild(scoreSpan);
      
      // If they got mining bonuses, display notification
      if (player.minedGold > 0) {
        const badge = document.createElement('span');
        badge.className = 'row-badge';
        badge.innerText = `Đào được +${player.minedGold}`;
        statsDiv.appendChild(badge);
      } else if (player.minedGold < 0) {
        const badge = document.createElement('span');
        badge.className = 'row-badge dynamite-hit';
        badge.innerText = `Mìn nổ! ${player.minedGold}`;
        statsDiv.appendChild(badge);
      }
      
      row.appendChild(rankSpan);
      row.appendChild(nameSpan);
      row.appendChild(statsDiv);
      
      hostLeaderboardList.appendChild(row);
    });
    
    btnLeaderboardNext.innerText = isFinal ? 'XEM KẾT QUẢ CHUNG CUỘC 🏆' : 'TIẾP TỤC ➡️';
    showScreen('hostLeaderboard');
    sfx.victory();
  } else {
    // Find client standing rank
    const myRankIdx = leaderboard.findIndex(p => p.nickname === myNickname);
    const myRank = myRankIdx !== -1 ? myRankIdx + 1 : '-';
    
    playerMyRank.innerText = myRank;
    playerTotalGold.innerText = myScore;
    
    showScreen('playerLeaderboard');
  }
});

// Final game over screen showing standings podium
socket.on('game-over', (standings) => {
  if (isHost) {
    // Podium top three setup
    const firstPlace = standings[0];
    const secondPlace = standings[1];
    const thirdPlace = standings[2];
    
    if (firstPlace) {
      document.getElementById('podium-1st-name').innerText = firstPlace.nickname;
      document.getElementById('podium-1st-score').innerText = `${firstPlace.score} 💰`;
    }
    if (secondPlace) {
      document.getElementById('podium-2nd-name').innerText = secondPlace.nickname;
      document.getElementById('podium-2nd-score').innerText = `${secondPlace.score} 💰`;
    } else {
      document.getElementById('podium-2nd-name').innerText = 'Trống';
      document.getElementById('podium-2nd-score').innerText = '-';
    }
    if (thirdPlace) {
      document.getElementById('podium-3rd-name').innerText = thirdPlace.nickname;
      document.getElementById('podium-3rd-score').innerText = `${thirdPlace.score} 💰`;
    } else {
      document.getElementById('podium-3rd-name').innerText = 'Trống';
      document.getElementById('podium-3rd-score').innerText = '-';
    }
    
    showScreen('hostGameOver');
    sfx.victory();
  } else {
    // Setup final result for individual player
    const myRankIdx = standings.findIndex(p => p.nickname === myNickname);
    const myRank = myRankIdx !== -1 ? myRankIdx + 1 : '-';
    
    playerFinalRank.innerText = `#${myRank}`;
    playerFinalGold.innerText = myScore;
    
    showScreen('playerGameOver');
    sfx.victory();
  }
});

// Server alerts if connection to host fails
socket.on('host-left', (msg) => {
  alert(msg);
  window.location.reload();
});
