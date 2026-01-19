import { ref, readonly, watch, onMounted } from 'vue';
import { Howl } from 'howler';
import axios from 'axios';

// --- 1. GAME CONFIGURATION ---
const symbolPaths = {
  Wild: 'icon-wild',
  Scatter1: 'icon-scatter',
  seven: 'icon-777',
  Nine: 'icon-spade',
  Jack: 'icon-J',
  Ten: 'icon-diamond',
  King: 'icon-K',
  Queen: 'icon-Q',
  lemon: 'icon-heart',
  Ace: 'icon-A',
  banana: 'icon-club',
  Scatter2: 'icon-bonus',
};

// --- 2. SHARED REACTIVE STATE ---
const balance = ref(0);
const betAmount = ref(0);
const availableBets = ref(new Set());
const isSpinning = ref(false);
const isCelebrationPlaying = ref(false); // Typo corrected
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

// --- Free Spin State ---
const isInFreeSpinSession = ref(false);
const freeSpinsAvailable = ref(0);
const freeSpinsTotal = ref(0);
const freeSpinOutcomes = ref([]);
const freeSpinTotalWin = ref(0);
const hasTriggeredFreeSpins = ref(false);

// --- 3. SOUNDS ---
const sounds = {
  winAlert: new Howl({ src: [new URL('../assets/sounds/winAlert.mp3', import.meta.url).href] }),
  explosion: new Howl({ src: [new URL('../assets/sounds/game-explosion.wav', import.meta.url).href] }),
  linewin: new Howl({ src: [new URL('../assets/sounds/linewin.mp3', import.meta.url).href], volume: 1.0 }),
  backgroundMusic: new Howl({ 
    src: [new URL('../assets/sounds/background_music.mp3', import.meta.url).href], 
    loop: true, 
    volume: 0.5 // Base volume
  }),
  celebrationMusic: new Howl({ 
    src: [new URL('../assets/sounds/celebration_music.mp3', import.meta.url).href], 
    loop: true, 
    volume: 0 // Start silent
  }),
  reelsSound: new Howl({ 
    src: [new URL('../assets/sounds/reels-sound.mp3', import.meta.url).href], 
    loop: true, 
    volume: 0 // Start silent
  })
};

const triggerEffectWithDucking = (effectHowl) => {
  // 1. Dim Background Music
  sounds.backgroundMusic.fade(sounds.backgroundMusic.volume(), 0.1, 300);

  // 2. Play the effect at high volume
  effectHowl.volume(1.0);
  effectHowl.play();

  // 3. Management after 1 second
  setTimeout(() => {
    // Fade out the effect
    effectHowl.fade(1.0, 0, 500);
    
    // Once faded, pause the effect to save resources
    setTimeout(() => {
      effectHowl.pause();
    }, 500);

    // 4. Slowly increment Background music back to 0.5
    sounds.backgroundMusic.fade(0.1, 0.5, 1500); 
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
    // Fade out the old music
    musicOut.fade(musicOut.volume(), 0, 500);
    musicOut.once('fade', () => {
      musicOut.pause();
    });
  }

  // Fade in the new music
  musicIn.play();
  musicIn.fade(0, 0.9, 500); // Target volume for background is 0.5
  
  activeMusic = musicIn;
};

// --- Helper function to generate outcome from API response ---
const endpoint = import.meta.env.VITE_API_BASE_URL;

const startGameSession = async ()=> {
  try {
    const response = await axios.post(`${endpoint}/start-session`, {
        "user_name":"Demo",
        "pin": "1234"
    });
    return response.data;
  } catch (error) {
     console.error('Axios error:', error.message);
  }
}

const getSpinAndOutcome = async ()=>{
  try {
    const response = await axios.post(`${endpoint}/spin`, {
        "bet":betAmount.value,
        "sessionId": sessionId.value
    });
    return response.data
    // Process the data here
  } catch (error) {
     console.error('Axios error:', error.message);
  }

}
const processOutcome = () => {
  const _outcome = outcome.value;
  winAmount.value = _outcome.totalWin ? _outcome.totalWin.toFixed(2) : parseFloat(0).toFixed(2);
  hasTriggeredFreeSpins.value = false;

  // Clear previous win data
  winningPaylines.value = [];
  winningSymbolPositions.value = [];
  winningScatters.value = [];
  scatterWinAmount.value = 0;

  if (_outcome.winningLines && Object.keys(_outcome.winningLines).length > 0) {
    const lines = Object.values(_outcome.winningLines);
    winningPaylines.value = lines;

    const symbolPositions = [];
    lines.forEach(line => {
      const lineDefinition = line.definition; // e.g., [0, 0, 0, 0, 0]
      line.symbolsPositions.forEach(reelIndex => {
        // The line definition gives the row for that reel
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

  if (_outcome.freeGamesResult?.triggeredFreeGames) {
    hasTriggeredFreeSpins.value = true;
    isInFreeSpinSession.value = true;
    freeSpinsAvailable.value = _outcome.freeGamesResult.numberOfFreeSpins;
    freeSpinsTotal.value = _outcome.freeGamesResult.numberOfFreeSpins;
    freeSpinOutcomes.value = [..._outcome.freeGamesResult.freeGamesSpins];
    freeSpinTotalWin.value = 0;
  }
};

// --- Initialize the game with a random grid ---
const gameSession = await startGameSession();
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

let audioUnlocked = false;

export function useSlotGame() {

  const unlockAudio = () => {
    if (audioUnlocked) return;
    const ctx = Howler.ctx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (!sounds.backgroundMusic.playing()) sounds.backgroundMusic.play();
        audioUnlocked = true;
      });
    } else {
      if (!sounds.backgroundMusic.playing()) sounds.backgroundMusic.play();
      audioUnlocked = true;
    }
  };

  watch(isCelebrationPlaying, manageSound);

  

  // MAIN SPIN FUNCTION ---
  const spin = async() => {
    unlockAudio();
    if (isSpinning.value || isWinAnimationPlaying.value) return;

     triggerEffectWithDucking(sounds.reelsSound);

    if (isInFreeSpinSession.value) {
      if (freeSpinsAvailable.value > 0) {
        const freeSpinOutcome = freeSpinOutcomes.value.shift();
        outcome.value = freeSpinOutcome;
        freeSpinsAvailable.value--;
        isSpinning.value = true;
        winAmount.value = parseFloat(0).toFixed(2);
      } else {
        isInFreeSpinSession.value = false;
        // Logic to add freeSpinTotalWin to balance and show summary will be needed here
        if (balance.value < betAmount.value) return;
        const finalOutcome = await getSpinAndOutcome();
        outcome.value = finalOutcome;
        isSpinning.value = true;
        winAmount.value = parseFloat(0).toFixed(2);
      }
    } else {
      if (balance.value < betAmount.value) return;
      const finalOutcome = await getSpinAndOutcome();
      outcome.value = finalOutcome;
      isSpinning.value = true;
      winAmount.value = parseFloat(0).toFixed(2);
    }
  };

  const finishSpin = () => {
    isSpinning.value = false;
    processOutcome();

    if (isInFreeSpinSession.value) {
      freeSpinTotalWin.value += parseFloat(winAmount.value);
    }

    if (isAutoplaying.value) {
      spin();
    }
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
    isAutoplaying: readonly(isAutoplaying), 
    isWinAnimationPlaying: readonly(isWinAnimationPlaying),
    isCelebrationPlaying: readonly(isCelebrationPlaying),
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

    // Free Spin Exports
    isInFreeSpinSession: readonly(isInFreeSpinSession),
    freeSpinsAvailable: readonly(freeSpinsAvailable),
    freeSpinsTotal: readonly(freeSpinsTotal),
    freeSpinTotalWin: readonly(freeSpinTotalWin),
    hasTriggeredFreeSpins: readonly(hasTriggeredFreeSpins),
  };
}
