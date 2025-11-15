import { ref, readonly, nextTick } from 'vue';
import { Howl } from 'howler';
import axios from 'axios';

// --- 1. GAME CONFIGURATION ---
const SYMBOLS = {
  SEVEN: 'Scatter2',
  SCATTER: 'Scatter1',
  WILD: 'Wild',
  BAR: 'Nine',
  BELL: 'Ten',
  MELON: 'Jack',
  ORANGE: 'Queen',
  PLUM: 'King',
  CHERRY: 'Ace',
  LEMON: 'lemon'
};



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

const PAYTABLE = {
  [SYMBOLS.WILD]:   { 5: 5000, 4: 1000, 3: 100 },
  [SYMBOLS.SEVEN]:  { 5: 2500, 4: 500,  3: 50 },
  [SYMBOLS.BAR]:    { 5: 1000, 4: 200,  3: 40 },
  [SYMBOLS.BELL]:   { 5: 500,  4: 100,  3: 20 },
  [SYMBOLS.MELON]:  { 5: 250,  4: 50,   3: 15 },
  [SYMBOLS.ORANGE]: { 5: 100,  4: 20,   3: 8 },
  [SYMBOLS.PLUM]:   { 5: 80,   4: 15,   3: 6 },
  [SYMBOLS.CHERRY]: { 5: 60,   4: 12,   3: 5 },
  [SYMBOLS.LEMON]:  { 5: 50,   4: 10,   3: 4 },
};

const SCATTER_PAYOUTS = { 5: 100, 4: 20, 3: 5 };

const REEL_STRIPS = [
  ["Ace", "King", "Queen", "Jack", "Ten", "Nine", "Wild", "Scatter1", "Scatter2"],
  ["Ace", "King", "Queen", "Jack", "Ten", "Nine", "Wild", "Scatter1", "Scatter2"],
  ["Ace", "King", "Queen", "Jack", "Ten", "Nine", "Wild", "Scatter1", "Scatter2"],
  ["Ace", "King", "Queen", "Jack", "Ten", "Nine", "Wild", "Scatter1", "Scatter2"],
  ["Ace", "King", "Queen", "Jack", "Ten", "Nine", "Wild", "Scatter1", "Scatter2"]
];

const PAYLINES = [
    [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [0, 1, 1, 2, 2], [2, 1, 1, 0, 0], [1, 0, 0, 0, 1],
    [1, 2, 2, 2, 1], [0, 1, 0, 1, 0], [1, 2, 1, 2, 1], [2, 1, 2, 1, 2], [0, 0, 2, 0, 0],
    [2, 2, 0, 2, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
    [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 1, 0, 2]
];

const FREE_SPINS_CONFIG = {
  TRIGGER_COUNT: { 3: 10, 4: 15, 5: 20 },
  BASE_MULTIPLIER_INCREMENT: 2,
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
const winningPaylines = ref(new Set());
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
const processOutcome = ()=>{
  const _outcome = outcome.value;
  winAmount.value = _outcome.totalWin.toFixed(2);
  balance.value = _outcome.credits.toFixed(2);
}

// --- Initialize the game with a random grid ---
const gameSession = await startGameSession();
const initialGrid = gameSession.reelsSymbols;
sessionId.value = gameSession.sessionId
balance.value = parseFloat(gameSession.credits).toFixed(2);
betAmount.value = gameSession.bet;
availableBets.value = gameSession.availableBets
outcome.value = gameSession;
reelsForDisplay.value = initialGrid;



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
    PAYLINES 
  };
}
