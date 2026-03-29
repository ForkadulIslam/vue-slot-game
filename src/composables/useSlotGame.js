import { ref, readonly, watch } from 'vue';
import { sound } from '@pixi/sound';
import axios from 'axios';
import gsap from 'gsap';

// --- 1. GAME CONFIGURATION ---
const symbolPaths = {
  W: 'icon-wild',
  S: 'icon-scatter',
  //seven: 'icon-777',
  Nine: 'icon-spade',
  Jack: 'icon-J',
  Ten: 'icon-diamond',
  King: 'icon-K',
  Queen: 'icon-Q',
  //lemon: 'icon-heart',
  Ace: 'icon-A',
  //banana: 'icon-club',
  //Scatter2: 'icon-bonus',
};

// --- 2. SHARED REACTIVE STATE ---
const balance = ref(0);
const betAmount = ref(0);
const availableBets = ref(new Set());
const isSpinning = ref(false);
const isCelebrationPlaying = ref(false); 
const isAutoplaying = ref(false);
const outcome = ref([]); 
const reelsForDisplay = ref([]);
const winAmount = ref(0.00);
const displayedWinAmount = ref(0.00);
const winningPaylines = ref([]);
const winningSymbolPositions = ref([]);
const winningScatters = ref([]);
const scatterWinAmount = ref(0);
const isWinAnimationPlaying = ref(false);
const payTable = ref({});
const linesDefinitions = ref({});
const reelsNumber = ref(5);
const reelsSymbolsNumber = ref(4);
const availableSymbols = ref([]);
const sessionId = ref(0);
const multipliers = ref([4, 8, 16, 32])

// --- Free Spin State ---
const isInFreeSpinSession = ref(false);
const freeSpinsAvailable = ref(0);
const freeSpinsTotal = ref(0);
const freeSpinTotalWin = ref(0);
const hasTriggeredFreeSpins = ref(false);
export const gameError = ref(null);
export const isGameReady = ref(false); 

// --- PIXI SOUNDS SETUP ---
const triggerEffectWithDucking = (soundInstance) => {
  if (!soundInstance) return;

  gsap.to(sounds.backgroundMusic, { volume: 0.1, duration: 0.3 });

  soundInstance.volume = 1.0;
  soundInstance.play();

  setTimeout(() => {
    gsap.to(soundInstance, { 
        volume: 0, 
        duration: 0.5, 
        onComplete: () => soundInstance.stop() 
    });

    gsap.to(sounds.backgroundMusic, { volume: 0.5, duration: 1.5 });
  }, 1000);
};

// --- AUDIO MANAGEMENT ---
let activeMusic = null;

const manageSound = () => {
  const musicOut = activeMusic;
  let musicIn = null;

  if (isCelebrationPlaying.value) {
    musicIn = sounds.celebrationMusic;
  } else if (isSpinning.value) {
    musicIn = sounds.reelsSound;
  } else {
    musicIn = sounds.backgroundMusic;
  }

  if (musicOut === musicIn) return;

  if (musicOut) {
    gsap.to(musicOut, { 
        volume: 0, 
        duration: 0.5, 
        onComplete: () => musicOut.pause() 
    });
  }

  musicIn.play();
  gsap.to(musicIn, { volume: 0.9, duration: 0.5 });
  
  activeMusic = musicIn;
};

const endpoint = import.meta.env.VITE_API_BASE_URL;

const startGameSession = async () => {
  gameError.value = null;
  const queryParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = queryParams.get('userId');

  if (!userIdFromUrl) {
    const errorMsg = 'Missing userId in URL. Expected format: ?userId=1';
    gameError.value = errorMsg;
    return { error: errorMsg };
  }

  try {
    const response = await axios.post(`${endpoint}/start-session`, {
      userId: userIdFromUrl,
      gameId:'mega-win'
    });
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      const errorMessage = response.data?.message || 'Unknown error during session start.';
      gameError.value = errorMessage;
      return { error: errorMessage };
    }
  } catch (error) {
    let errorMessage;
    if (error.response) {
      const serverMessage = error.response.data?.message || error.response.statusText;
      errorMessage = `Server error: ${serverMessage}`;
    } else if (error.request) {
      errorMessage = 'Network error: No response from server.';
    } else {
      errorMessage = `Request setup error: ${error.message}`;
    }
    gameError.value = errorMessage;
    return { error: errorMessage };
  }
};

const getSpinAndOutcome = async ()=>{
  try {
    const response = await axios.post(`${endpoint}/spin`, {
        "bet":betAmount.value,
        "sessionId": sessionId.value
    });
    
    // Handle enveloped response
    if (response.data) {
      return response.data;
    }

    // Handle explicit error status from backend
    const errorMessage = response.data?.message || 'Unknown error during spin.';
    return { error: errorMessage };

  } catch (error) {
    console.error('Axios error in getSpinAndOutcome:', error);
    let errorMessage;
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.statusText;
    } else if (error.request) {
      errorMessage = 'Network error: No response from server.';
    } else {
      errorMessage = `Request error: ${error.message}`;
    }
    return { error: errorMessage }; 
  }
}

const processOutcome = () => {
  const _outcome = outcome.value;
  winAmount.value = _outcome.totalWin ? _outcome.totalWin.toFixed(2) : parseFloat(0).toFixed(2);
  hasTriggeredFreeSpins.value = false;

  if (_outcome.reelsSymbols) {
    reelsForDisplay.value = _outcome.reelsSymbols;
  }

  winningPaylines.value = [];
  winningSymbolPositions.value = [];
  winningScatters.value = [];
  scatterWinAmount.value = 0;

  if (_outcome.winningLines && Object.keys(_outcome.winningLines).length > 0) {
    const lines = Object.values(_outcome.winningLines);
    winningPaylines.value = lines;

    const symbolPositions = [];
    lines.forEach(line => {
      const lineDefinition = line.definition;
      line.symbolsPositions.forEach(reelIndex => {
        const rowIndex = lineDefinition[reelIndex];
        symbolPositions.push({ reel: reelIndex, row: rowIndex });
      });
    });
    winningSymbolPositions.value = symbolPositions;
  }

  if (_outcome.winningScatters) {
    let totalScatterWin = 0;
    const scatterPositions = [];
    for (const key in _outcome.winningScatters) {
        const scatterData = _outcome.winningScatters[key];
        if (scatterData && scatterData.symbolsPositions) {
            totalScatterWin += scatterData.winAmount;
            scatterData.symbolsPositions.forEach(posArray => {
                scatterPositions.push({ reel: posArray[0], row: posArray[1] });
            });
        }
    }
    if (scatterPositions.length > 0) {
        winningScatters.value = scatterPositions;
        scatterWinAmount.value = totalScatterWin;
    }
  }

  // Handle Free Games from new backend structure
  const wonFreeGamesNumber = _outcome.wonFreeGamesNumber || 0;
  const freeGamesNum = _outcome.freeGamesNum || 0;
  const freeGamesSum = _outcome.freeGamesSum || 0;
  const freeGamesBank = _outcome.freeGamesBank || 0;

  if (wonFreeGamesNumber > 0) {
    hasTriggeredFreeSpins.value = true;
    freeSpinsTotal.value = wonFreeGamesNumber;
    isInFreeSpinSession.value = true;
    console.log("Free spin announcement: Awared: "+wonFreeGamesNumber)
  }

  if (freeGamesNum > 0) {
    isInFreeSpinSession.value = true;
    freeSpinsAvailable.value = freeGamesSum - freeGamesNum;
    freeSpinTotalWin.value = freeGamesBank;
    
    if (freeGamesNum === freeGamesSum) {
        outcome.value.shouldTriggerBigWinCelebration = true;
        isInFreeSpinSession.value = false;
    }
  }
};

let isInitialized = false;
export async function initializeGame() {
  if (isInitialized) {
    isGameReady.value = true;
    return;
  }
  isGameReady.value = false;

  const gameSession = await startGameSession();
  if (gameSession.error) {
    return;
  }
  const initialGrid = gameSession.reelsSymbols;
  sessionId.value = gameSession.sessionId
  balance.value = parseFloat(gameSession.credits).toFixed(2);
  betAmount.value = gameSession.bet;
  availableBets.value = gameSession.availableBets
  outcome.value = gameSession;
  reelsForDisplay.value = initialGrid;

  payTable.value = gameSession.paytable;
  linesDefinitions.value = gameSession.linesDefinitions;
  availableSymbols.value = gameSession.availableSymbols;
  isInitialized = true;
  isGameReady.value = true; 
}

const sounds = {
  winAlert: null,
  explosion: null,
  jackpotCoinLoop: null,
  backgroundMusic: null,
  celebrationMusic: null,
  reelsSound: null
};

export function setupLoadedSounds() {
    sounds.winAlert = sound.find('winAlert');
    sounds.explosion = sound.find('explosion');
    sounds.youWinVoice = sound.find('youWinVoice');
    sounds.congratulationsVoice = sound.find('congratulationsVoice')
    
    sounds.jackpotCoinLoop = sound.find('jackpotCoinLoop');
    sounds.jackpotCoinLoop.loop = true;
    sounds.jackpotCoinLoop.value = 0;

    sounds.backgroundMusic = sound.find('backgroundMusic');
    sounds.backgroundMusic.loop = true;
    sounds.backgroundMusic.volume = 0.5;

    sounds.celebrationMusic = sound.find('celebrationMusic');
    sounds.celebrationMusic.loop = true;
    sounds.celebrationMusic.volume = 0;

    sounds.reelsSound = sound.find('reelsSound');
    sounds.reelsSound.loop = true;
    sounds.reelsSound.volume = 0;
}

let audioUnlocked = false;
export function useSlotGame() {

  const unlockAudio = () => {
    if (audioUnlocked) return;
    sound.resumeAll();
    if (!sounds.backgroundMusic.isPlaying) {
      sounds.backgroundMusic.play();
      activeMusic = sounds.backgroundMusic;
    }
    audioUnlocked = true;
  };

  watch(isCelebrationPlaying, manageSound);

  const spin = async() => {
    if (isSpinning.value || isWinAnimationPlaying.value) return;

    triggerEffectWithDucking(sounds.reelsSound);

    if (!isInFreeSpinSession.value && balance.value < betAmount.value) return;

    winAmount.value = parseFloat(0).toFixed(2);
    const finalOutcome = await getSpinAndOutcome();
    
    if (finalOutcome.error) {
      console.error("Spin error:", finalOutcome.error);
      gsap.killTweensOf(sounds.reelsSound);
      if (sounds.reelsSound) sounds.reelsSound.stop();
      gsap.to(sounds.backgroundMusic, { volume: 0.5, duration: 0.5 });
      return;
    }
    
    outcome.value = finalOutcome;
    isSpinning.value = true;
  };

  const finishSpin = () => {
    isSpinning.value = false;
    processOutcome();
  };

  function setBetAmount(bet) {
    unlockAudio();
    betAmount.value = bet;
  };

  function toggleAutoplay() {
    unlockAudio();
    isAutoplaying.value = !isAutoplaying.value;
    if (isAutoplaying.value) {
      spin();
    }
  }

  function setWinAnimationPlaying(value) {
    isWinAnimationPlaying.value = value;
  }

  function startCelebration() {
    isCelebrationPlaying.value = true;
    triggerEffectWithDucking(sounds.celebrationMusic);
  }

  function endCelebration() {
    isCelebrationPlaying.value = false;
    if (sounds.backgroundMusic.volume() < 0.5) {
        sounds.backgroundMusic.fade(sounds.backgroundMusic.volume(), 0.5, 500);
    }
  }

  function updateBalanceFromOutcome() {
    if (outcome.value && typeof outcome.value.credits !== 'undefined') {
      balance.value = outcome.value.credits.toFixed(2);
    }
  }
  
  return { 
    balance: readonly(balance), 
    betAmount: readonly(betAmount),
    availableBets:readonly(availableBets),
    isSpinning: readonly(isSpinning),  
    isWinAnimationPlaying: readonly(isWinAnimationPlaying),
    isCelebrationPlaying: readonly(isCelebrationPlaying),
    isAutoplaying,
    setWinAnimationPlaying,
    startCelebration,
    endCelebration,
    updateBalanceFromOutcome,
    outcome: readonly(outcome), 
    reelsForDisplay: readonly(reelsForDisplay), 
    winAmount: readonly(winAmount),
    displayedWinAmount: displayedWinAmount,
    spin, 
    finishSpin,
    sounds,
    symbolPaths, 
    setBetAmount, 
    toggleAutoplay, 
    winningPaylines: readonly(winningPaylines),
    winningSymbolPositions: readonly(winningSymbolPositions),
    winningScatters: readonly(winningScatters),
    scatterWinAmount: readonly(scatterWinAmount),
    payTable:readonly(payTable),
    linesDefinitions:readonly(linesDefinitions),
    availableSymbols: readonly(availableSymbols),
    reelsNumber: readonly(reelsNumber),
    reelsSymbolsNumber: readonly(reelsSymbolsNumber),
    multipliers: readonly(multipliers),

    isInFreeSpinSession: readonly(isInFreeSpinSession),
    freeSpinsAvailable: readonly(freeSpinsAvailable),
    freeSpinsTotal: readonly(freeSpinsTotal),
    freeSpinTotalWin: readonly(freeSpinTotalWin),
    hasTriggeredFreeSpins: readonly(hasTriggeredFreeSpins),
    gameError: readonly(gameError),
    isGameReady: readonly(isGameReady),
  };
}
