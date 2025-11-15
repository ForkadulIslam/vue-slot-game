import { ref, readonly, nextTick } from 'vue';
import { Howl } from 'howler';
import axios from 'axios';

// --- 1. GAME CONFIGURATION ---
const symbolPaths = {
  Wild: new URL('../assets/images/symblos/celebration/wild.png', import.meta.url).href,
  Scatter1: new URL('../assets/images/symblos/celebration/scatter.png', import.meta.url).href,
  seven: new URL('../assets/images/symblos/seven.svg', import.meta.url).href,
  Nine: new URL('../assets/images/symblos/bar.svg', import.meta.url).href,
  Jack: new URL('../assets/images/symblos/melon.svg', import.meta.url).href,
  Ten: new URL('../assets/images/symblos/bell.svg', import.meta.url).href,
  King: new URL('../assets/images/symblos/plum.svg', import.meta.url).href,
  Queen: new URL('../assets/images/symblos/orange.svg', import.meta.url).href,
  lemon: new URL('../assets/images/symblos/lemon.svg', import.meta.url).href,
  Ace: new URL('../assets/images/symblos/cherry.svg', import.meta.url).href,
  banana: new URL('../assets/images/symblos/banana.svg', import.meta.url).href,
  Scatter2: new URL('../assets/images/symblos/celebration/gold_coin.png', import.meta.url).href,
};

// --- 2. SHARED REACTIVE STATE ---
// By defining the state outside the function, it becomes a singleton.
const balance = ref(0);
const betAmount = ref(0);
const availableBets = ref(new Set());
const isSpinning = ref(false);
const isAutoplaying = ref(false);
const outcome = ref([]); 
const reelsForDisplay = ref([]);
const winAmount = ref(0.00);
const winningPaylines = ref([]);
const winningSymbolPositions = ref([]);

const payTable = ref({});
const linesDefinitions = ref({});
const reelsNumber = ref(5);
const reelsSymbolsNumber = ref(4);
const availableSymbols = ref([]);
const sessionId = ref(0);

// --- 3. SOUNDS ---
const sounds = {
  spin: new Howl({ src: [new URL('../assets/sounds/spin.wav', import.meta.url).href] }),
  win: new Howl({ src: [new URL('../assets/sounds/win-alert.wav', import.meta.url).href] }),
  payout: new Howl({ src: [new URL('../assets/sounds/payout-award.wav', import.meta.url).href] }),
  explosion: new Howl({ src: [new URL('../assets/sounds/game-explosion.wav', import.meta.url).href] }),
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
  winAmount.value = _outcome.totalWin.toFixed(2);
  balance.value = _outcome.credits.toFixed(2);

  // Clear previous win data
  winningPaylines.value = [];
  winningSymbolPositions.value = [];

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




export function useSlotGame() {
  // --- 4. CORE GAME LOGIC ---
  const calculateWins = () => {
    let totalWinnings = 0;
    const currentWinningPaylines = new Set();
    const winningPositions = new Set();
    return { totalWinnings, winningPositions, currentWinningPaylines };
  };

  // --- 5. MAIN SPIN FUNCTION ---
  const spin = async() => {
    if (isSpinning.value || balance.value < betAmount.value) return;
    const finalOutcome = await getSpinAndOutcome();
    outcome.value = finalOutcome;
    isSpinning.value = true;
    winAmount.value = parseFloat(0).toFixed(2);
  };

  const finishSpin = () => {
    isSpinning.value = false;
    processOutcome();
    if (isAutoplaying.value) {
      spin();
    }
  };

  function setBetAmount(bet) {
    betAmount.value = bet;
  }

  function toggleAutoplay() {
    isAutoplaying.value = !isAutoplaying.value;
    if (isAutoplaying.value) {
      spin();
    }
  }
  
  return { 
    balance: readonly(balance), 
    betAmount: readonly(betAmount),
    availableBets:readonly(availableBets),
    isSpinning: readonly(isSpinning), 
    isAutoplaying: readonly(isAutoplaying), 
    outcome: readonly(outcome), 
    reelsForDisplay: readonly(reelsForDisplay), 
    winAmount: readonly(winAmount), 
    spin, 
    finishSpin,
    sounds,
    symbolPaths, 
    setBetAmount, 
    toggleAutoplay, 
    winningPaylines: readonly(winningPaylines),
    winningSymbolPositions: readonly(winningSymbolPositions),
    payTable:readonly(payTable),
    linesDefinitions:readonly(linesDefinitions),
    availableSymbols: readonly(availableSymbols),
    reelsNumber: readonly(reelsNumber),
    reelsSymbolsNumber: readonly(reelsSymbolsNumber)
  };
}
